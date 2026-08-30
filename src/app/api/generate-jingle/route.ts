import { NextRequest, NextResponse } from 'next/server';
import { callGemini, loadPromptFile } from '@/lib/gemini';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, generateJingleSchema } from '@/lib/validations';
import { wrapUserPrompt } from '@/lib/prompt-sanitizer';
import { INSTRUMENTOS_MAP } from '@/lib/jingles-constants';
import { logError } from '@/lib/logger';

const ROUTE = '/api/generate-jingle';

function buildUserPrompt(data: ReturnType<typeof generateJingleSchema.parse>): string {
  const lines: string[] = [];

  lines.push(`PLATAFORMA: ${data.plataforma}`);
  lines.push(`CLASE: ${data.clase}`);
  lines.push(`PARA QUIÉN: ${data.paraQuien}`);
  lines.push('');

  lines.push('--- DATOS DEL JINGLE ---');
  if (data.nombreJingle.trim()) lines.push(`Nombre del Jingle: ${data.nombreJingle.trim()}`);
  if (data.nombreSujeto.trim()) lines.push(`Nombre de la ${data.paraQuien === 'institucional' ? 'Emisora' : 'Cliente'}: ${data.nombreSujeto.trim()}`);
  lines.push(`Objetivo: ${data.objetivo.trim() || '(No especificado)'}`);
  lines.push(`Mensaje a resaltar: ${data.mensajeResaltar.trim() || '(No especificado)'}`);

  if (data.paraQuien === 'cliente' && data.datosContacto.trim()) {
    lines.push(`Datos de contacto del cliente: ${data.datosContacto.trim()}`);
  }

  lines.push('');
  lines.push('--- DIRECCIÓN MUSICAL ---');
  lines.push(`Género Musical: ${data.genero}`);

  // Tempo
  if (data.tempo === 'personalizado' && data.tempoPersonalizado) {
    lines.push(`Tempo/BPM: ${data.tempoPersonalizado} BPM`);
  } else {
    const tempoLabels: Record<string, string> = {
      lento: 'Lento (60-80 BPM)',
      medio: 'Medio (100-120 BPM)',
      'medio-rapido': 'Medio-Rápido (120-135 BPM)',
      rapido: 'Rápido (135-155 BPM)',
    };
    lines.push(`Tempo/BPM: ${tempoLabels[data.tempo] || data.tempo}`);
  }

  // Instrumentación
  if (data.instrumentos.length > 0) {
    const instrumentosDesc = data.instrumentos
      .map((i) => INSTRUMENTOS_MAP[i] || i)
      .join(', ');
    lines.push(`Instrumentación: ${instrumentosDesc}`);
  }

  // Estilo vocal
  const vocalLabels: Record<string, string> = {
    masculino: 'Voz masculina',
    femenino: 'Voz femenina',
    duo: 'Dúo masculino-femenino',
    coro: 'Coro',
    instrumental: 'Solo instrumental (sin voces cantadas)',
  };
  lines.push(`Estilo Vocal: ${vocalLabels[data.estiloVocal] || data.estiloVocal}`);

  lines.push(`Mood/Energía: ${data.mood}`);

  const estructuraLabels: Record<string, string> = {
    simple: 'Simple (Intro → Canto → Cierre)',
    completa: 'Completa (Intro → Verso → Pre-Coro → Coro → Cierre)',
  };
  lines.push(`Estructura: ${estructuraLabels[data.estructura] || data.estructura}`);

  lines.push('');
  lines.push('--- LETRA Y RIMA ---');
  lines.push(`Tipo de Rima: ${data.tipoRima}`);
  lines.push(`Número de Estrofas del Canto: ${data.numeroEstrofas}`);
  lines.push(`Duración Total: ${data.duracion} segundos`);
  lines.push(`Incluir Locución: ${data.incluirLocucion ? 'Sí' : 'No'}`);

  return lines.join('\n');
}

/** Parse the platform-specific sections from Gemini output */
function parsePlatformOutput(text: string, plataforma: string) {
  if (plataforma === 'suno') {
    const styleMatch = text.match(/=== STYLE PROMPT ===\n([\s\S]*?)\n=== FIN STYLE ===/);
    const lyricsMatch = text.match(/=== LYRICS ===\n([\s\S]*?)\n=== FIN LYRICS ===/);
    return {
      stylePrompt: styleMatch?.[1]?.trim() || '',
      lyrics: lyricsMatch?.[1]?.trim() || '',
      fullPrompt: text,
    };
  }

  if (plataforma === 'udio') {
    const promptMatch = text.match(/=== PROMPT ===\n([\s\S]*?)\n=== FIN PROMPT ===/);
    const lyricsMatch = text.match(/=== LETRA ===\n([\s\S]*?)\n=== FIN LETRA ===/);
    return {
      stylePrompt: promptMatch?.[1]?.trim() || '',
      lyrics: lyricsMatch?.[1]?.trim() || '',
      fullPrompt: text,
    };
  }

  // google-musicfx: single prompt
  const promptMatch = text.match(/=== PROMPT ===\n([\s\S]*?)\n=== FIN PROMPT ===/);
  return {
    stylePrompt: null,
    lyrics: null,
    fullPrompt: promptMatch?.[1]?.trim() || text,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = validateOrThrow(generateJingleSchema, body);
    await checkRateLimit('generate');

    const systemPrompt = await loadPromptFile('generador-jingles');
    const userPrompt = buildUserPrompt(data);

    const response = await callGemini('generador-jingles', wrapUserPrompt(userPrompt), systemPrompt);

    const parsed = parsePlatformOutput(response.text, data.plataforma);

    // Validate that we got meaningful content
    if (!parsed.fullPrompt || parsed.fullPrompt.length < 50) {
      logError(ROUTE, 'Gemini output too short or empty');
      return NextResponse.json(
        { error: 'La IA no generó un prompt válido. Intenta nuevamente.' },
        { status: 502 },
      );
    }

    // Save to generations log
    await db.generation.create({
      data: {
        moduleId: 'generador-jingles',
        moduleName: 'Generador de Jingles',
        prompt: `Jingle: ${data.nombreSujeto} | ${data.plataforma} | ${data.genero} | ${data.duracion}s`,
        result: parsed.fullPrompt,
        metadata: JSON.stringify({
          plataforma: data.plataforma,
          genero: data.genero,
          duracion: data.duracion,
          clase: data.clase,
        }),
        apiKeyId: response.apiKeyId,
      },
    });

    return NextResponse.json({
      success: true,
      plataforma: data.plataforma,
      ...parsed,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        { status: 429, headers: { 'Retry-After': String(error.retryAfter) } },
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logError(ROUTE, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
