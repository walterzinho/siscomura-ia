import { NextRequest, NextResponse } from 'next/server';
import { callGemini, loadPromptFile } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getModuleById } from '@/lib/modules';

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
    const { quantity = 10, tone = 'contundente', topic = '', character = '' } = body;

    if (quantity < 1 || quantity > 50) {
      return NextResponse.json({ error: 'La cantidad debe ser entre 1 y 50' }, { status: 400 });
    }

    const systemPrompt = await loadPromptFile('contenido-personajes');

    // Extract only the MODO 2 section
    const modo2System = systemPrompt.split('## MODO 2:')[1] || '';
    const fullSystem = `Eres un experto en comunicación digital corta y contundente. Generas frases tipo X (Twitter) que son cortas, impactantes y virales, ideales para redes sociales de una emisora rural.\n\n${modo2System}`;

    const toneInstruction = TONE_PROMPTS[tone] || TONE_PROMPTS.contundente;

    const userPrompt = `Genera exactamente ${quantity} frases tipo X/Twitter con las siguientes especificaciones:

- Tono: ${tone}. ${toneInstruction}
${topic ? `- Tema general: ${topic}` : ''}
${character ? `- Voz del personaje: ${character}` : ''}

Recuerda: máx 280 caracteres por frase, autocontenidas, con gancho para compartir. Varía dentro del tono seleccionado. JSON: {"frases": [{"frase": "...", "tema": "..."}]}`;

    const response = await callGemini('contenido-personajes', userPrompt, fullSystem);
    const parsed = parseGeminiJson(response.text);
    if (!parsed || !parsed.frases) {
      return NextResponse.json({ error: 'No se pudo interpretar la respuesta', raw: response.text }, { status: 500 });
    }

    const frases = parsed.frases as Array<{ frase: string; tema: string }>;

    const moduleDef = getModuleById('contenido-personajes');
    await db.generation.create({
      data: {
        moduleId: 'contenido-personajes',
        moduleName: moduleDef?.name || 'Contenido de Personajes',
        prompt: `Frases masivas: ${quantity} | ${tone} | ${topic || 'sin tema'}`,
        result: frases.map((f, i) => `${i + 1}. ${f.frase}`).join('\n'),
        metadata: JSON.stringify({ mode: 'phrases', tone, quantity, topic }),
        apiKeyId: response.apiKeyId,
      },
    });

    return NextResponse.json({ success: true, frases });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
