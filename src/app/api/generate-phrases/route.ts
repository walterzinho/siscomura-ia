import { NextRequest, NextResponse } from 'next/server';
import { callGemini, loadPromptFile } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getModuleById } from '@/lib/modules';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, generatePhrasesSchema } from '@/lib/validations';
import { wrapUserPrompt } from '@/lib/prompt-sanitizer';

const TONE_PROMPTS: Record<string, string> = {
  motivacional: 'Frases que inspiran y motivan al campesino, conectadas a la tierra, la siembra y la fe.',
  humoristico: 'Frases con humor campero, ironía amable, doble sentido del campo.',
  reflexivo: 'Frases poéticas sobre la vida rural, la naturaleza y el paso del tiempo.',
  provocativo: 'Frases que cuestionan, provocan pensamiento crítico sobre el agro y la realidad campesina.',
  informativo: 'Frases con datos, tips rápidos, curiosidades agrícolas en formato punchy.',
  contundente: 'Frases fuertes, directas, con personalidad, estilo pensamiento del día.',
};

function parseGeminiJson(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s !== -1 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quantity = 10,
      tones = ['contundente'],
      topics = '',
      character = '',
    } = validateOrThrow(generatePhrasesSchema, body);
    await checkRateLimit('generate');

    const validTones = Array.isArray(tones) ? tones.filter((t: string) => TONE_PROMPTS[t]) : [TONE_PROMPTS[tones] ? tones : 'contundente'];
    if (validTones.length === 0) validTones.push('contundente');

    const topicList = topics.split(',').map((t: string) => t.trim()).filter(Boolean);
    // Build distribution plan
    const perTone = Math.floor(quantity / validTones.length);
    const remainder = quantity % validTones.length;
    const toneDistribution = validTones.map((tone: string, i: number) => ({
      tone,
      count: perTone + (i < remainder ? 1 : 0),
    }));

    const perTopic = topicList.length > 0
      ? Math.floor(quantity / topicList.length)
      : 0;
    const topicRemainder = topicList.length > 0
      ? quantity % topicList.length
      : 0;

    // Build tone instructions block
    const toneInstructions = toneDistribution.map(d => {
      const desc = TONE_PROMPTS[d.tone] || '';
      return `- **${d.tone}** (${d.count} frases): ${desc}`;
    }).join('\n');

    // Build topic distribution instruction
    let topicInstruction = '';
    if (topicList.length > 0) {
      const topicDistribution = topicList.map((topic: string, i: number) => {
        const count = perTopic + (i < topicRemainder ? 1 : 0);
        return `- "${topic}": ${count} frases`;
      }).join('\n');

      topicInstruction = `

### DISTRIBUCIÓN DE TEMAS
Reparte las ${quantity} frases equitativamente entre estos temas:
${topicDistribution}
Cada frase debe abordar uno de estos temas. Documenta el tema en la propiedad "tema" de cada frase.`;
    } else {
      topicInstruction = `

### TEMAS
Autogenera temas variados de la vida rural y el agro. Documenta el tema específico en la propiedad "tema" de cada frase.`;
    }

    const systemPrompt = await loadPromptFile('contenido-personajes');
    const modo2System = systemPrompt.split('## MODO 2:')[1] || '';
    const fullSystem = `Eres un experto en comunicación digital corta y contundente. Generas frases tipo X (Twitter) que son cortas, impactantes y virales, ideales para redes sociales de una emisora rural.\n\n${modo2System}`;

    const userPrompt = `Genera exactamente ${quantity} frases tipo X/Twitter.

### DISTRIBUCIÓN DE TONOS
${validTones.length === 1
      ? `Todas las frases deben ser de tono **${validTones[0]}**: ${TONE_PROMPTS[validTones[0]]}`
      : `Reparte las frases equitativamente entre estos tonos:\n${toneInstructions}`
    }

La propiedad "tono" de cada frase debe indicar cuál de estos tonos se usó (${validTones.join(', ')}).${topicInstruction}
${character ? `\n### VOZ DEL PERSONAJE\nEscribe todas las frases como si las dijera ${character}. Mantén su estilo y forma de expresarse.` : ''}

Recuerda: máx 280 caracteres por frase, autocontenidas, con gancho para compartir. Varía dentro de cada tono y tema.

Responde ÚNICAMENTE con JSON: {"frases": [{"frase": "...", "tema": "...", "tono": "..."}]}`;

    const response = await callGemini('contenido-personajes', wrapUserPrompt(userPrompt), fullSystem);
    const parsed = parseGeminiJson(response.text);
    if (!parsed || !parsed.frases) {
      return NextResponse.json({ error: 'No se pudo interpretar la respuesta', raw: response.text }, { status: 500 });
    }

    const frases = (parsed.frases as Array<{ frase: string; tema: string; tono: string }>).map(f => ({
      frase: f.frase,
      tema: f.tema || '',
      tono: f.tono || validTones[0],
    }));

    const moduleDef = getModuleById('contenido-personajes');
    await db.generation.create({
      data: {
        moduleId: 'contenido-personajes',
        moduleName: moduleDef?.name || 'Contenido de Personajes',
        prompt: `Frases masivas: ${quantity} | ${validTones.length} tonos | ${topicList.length || 0} temas`,
        result: frases.map((f, i) => `${i + 1}. [${f.tono}] ${f.frase}`).join('\n'),
        metadata: JSON.stringify({ mode: 'phrases', tones: validTones, topics: topicList, quantity }),
        apiKeyId: response.apiKeyId,
      },
    });

    return NextResponse.json({ success: true, frases });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) }
      });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
