import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getModuleById } from '@/lib/modules';

function buildProfilePrompt(data: Record<string, string>): string {
  return `Genera una configuración completa de perfil de voz con estos datos del locutor/a:

- Nombre: ${data.name || 'No especificado'}
- Edad: ${data.age || 'No especificada'}
- Género de voz: ${data.gender || 'No especificado'}
- Tipo de perfil/segmento: ${data.profileType || 'No especificado'}
- Región/Acento: ${data.region || 'No especificado'}
- Escenario/Contexto: ${data.scenario || 'No especificado'}
${data.additional ? `- Información adicional: ${data.additional}` : ''}

Genera DOS versiones del perfil: una en español (profileEs) y otra en inglés (profileEn). La versión en inglés debe estar optimizada para el motor TTS de Google Gemini, con descripciones precisas y efectivas para la generación de voz.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con la estructura que indica el system prompt.`;
}

function parseGeminiJson(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text); } catch {}

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch {}
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, gender, profileType, region, scenario, additional } = body;

    if (!name && !profileType && !scenario) {
      return NextResponse.json(
        { error: 'Ingresa al menos el nombre, tipo de perfil o escenario' },
        { status: 400 }
      );
    }

    const prompt = buildProfilePrompt({ name, age, gender, profileType, region, scenario, additional });

    const response = await callGemini('perfiles-locutores-ia', prompt);
    const text = response.text;

    const parsed = parseGeminiJson(text);
    if (!parsed) {
      return NextResponse.json(
        { error: 'No se pudo interpretar la respuesta de la IA como JSON', raw: text },
        { status: 500 }
      );
    }

    const profileEs = parsed.profileEs || parsed;
    const profileEn = parsed.profileEn || null;

    // Save generation to history
    const moduleDef = getModuleById('perfiles-locutores-ia');
    const profileText = [
      `Perfil: ${profileType || name}`,
      `Locutor/a: ${name || 'N/A'}`,
      `Voz: ${profileEs.voice}`,
      `Style: ${profileEs.style}`,
      `Pace: ${profileEs.pace}`,
      `Temperature: ${profileEs.temperature}`,
      `Audio Profile: ${profileEs.audioProfile}`,
      `Scene: ${profileEs.scene}`,
      `Sample Context: ${profileEs.sampleContext}`,
      `Tag: ${profileEs.tag}`,
      `Tags sugeridos: ${(profileEs.suggestedTags || []).join(', ')}`,
    ].join('\n');

    await db.generation.create({
      data: {
        moduleId: 'perfiles-locutores-ia',
        moduleName: moduleDef?.name || 'Perfiles Locutores IA',
        prompt: JSON.stringify({ name, age, gender, profileType, region, scenario, additional }).slice(0, 2000),
        result: profileText,
        metadata: JSON.stringify({ voice: profileEs.voice, style: profileEs.style, pace: profileEs.pace }),
        apiKeyId: response.apiKeyId,
      },
    });

    return NextResponse.json({ success: true, profile: profileEs, profileEn });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
