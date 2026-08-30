import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getModuleById } from '@/lib/modules';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, generateProfileSchema } from '@/lib/validations';
import { wrapUserPrompt } from '@/lib/prompt-sanitizer';
import { parseGeminiJson } from '@/lib/parse-json';
import { logError } from '@/lib/logger';

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

const ROUTE = '/api/generate-profile';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, gender, profileType, region, scenario, additional } = validateOrThrow(generateProfileSchema, body);
    await checkRateLimit('generate');

    if (!name && !profileType && !scenario) {
      return NextResponse.json(
        { error: 'Ingresa al menos el nombre, tipo de perfil o escenario' },
        { status: 400 }
      );
    }

    const prompt = buildProfilePrompt({ name, age, gender, profileType, region, scenario, additional });

    const response = await callGemini('perfiles-locutores-ia', wrapUserPrompt(prompt));
    const parsed = parseGeminiJson(response.text);

    if (!parsed) {
      logError(ROUTE, 'Failed to parse Gemini JSON response');
      return NextResponse.json(
        { error: 'La IA no devolvió un JSON válido. Intenta nuevamente.' },
        { status: 502 }
      );
    }

    const profileEs = (parsed.profileEs || parsed) as Record<string, unknown>;
    const profileEn = (parsed.profileEn || null) as Record<string, unknown> | null;

    // Safe property access with fallbacks
    const get = (obj: Record<string, unknown>, key: string, fallback = 'N/A') =>
      (obj[key] as string) || fallback;

    // Save generation to history
    const moduleDef = getModuleById('perfiles-locutores-ia');
    const profileText = [
      `Perfil: ${profileType || name}`,
      `Locutor/a: ${name || 'N/A'}`,
      `Voz: ${get(profileEs, 'voice')}`,
      `Style: ${get(profileEs, 'style')}`,
      `Pace: ${get(profileEs, 'pace')}`,
      `Temperature: ${get(profileEs, 'temperature')}`,
      `Audio Profile: ${get(profileEs, 'audioProfile')}`,
      `Scene: ${get(profileEs, 'scene')}`,
      `Sample Context: ${get(profileEs, 'sampleContext')}`,
      `Tag: ${get(profileEs, 'tag')}`,
      `Tags sugeridos: ${Array.isArray(profileEs.suggestedTags) ? (profileEs.suggestedTags as string[]).join(', ') : 'N/A'}`,
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
    logError(ROUTE, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
