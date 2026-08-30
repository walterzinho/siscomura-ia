import { NextRequest, NextResponse } from 'next/server';
import { callGemini, loadPromptFile } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getModuleById } from '@/lib/modules';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, generateCampaignSchema } from '@/lib/validations';
import { wrapUserPrompt } from '@/lib/prompt-sanitizer';
import { parseGeminiJson, extractArray } from '@/lib/parse-json';
import { logError } from '@/lib/logger';

const PHOTO_STYLES: Record<string, string> = {
  cinematic: 'Realistic, highly detailed, cinematic lighting, shallow depth of field, 50mm lens effect, professional composition, 2K.',
  smartphone: 'Raw, unedited smartphone photo, slight motion blur, casual lighting, realistic organic skin textures.',
  analog: 'Vintage 35mm analog film photograph, warm classic color grading, subtle film grain, nostalgic feel.',
  watercolor: 'Cozy warm watercolor painting, soft hand-drawn illustrations, pastel color tones.',
  oil: 'Luminous oil canvas painting, rich impasto brush strokes, classical fine art style, dramatic chiaroscuro.',
  macro: 'Professional agricultural macro studio photography, high-end close-up, sharp focus, studio lighting.',
};

const ROUTE = '/api/generate-campaign';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      characterName, characterDesc,
      numMessages = 8, topics = '',
      enfoque = 'consejo', fbLength = 'medio',
      photoStyle = 'cinematic',
      footer = '', hashtags = '',
    } = validateOrThrow(generateCampaignSchema, body);
    await checkRateLimit('generate');

    const systemPrompt = await loadPromptFile('contenido-personajes');

    const topicsClause = topics
      ? `El usuario ha establecido estos temas: "${topics}". Distribúyelos equitativamente entre las ${numMessages} propuestas. Documenta el tema en la propiedad "tema".`
      : `Autogenera temas variados de la vida del campo acordes al personaje. Documenta cada tema en la propiedad "tema".`;

    const depthMap: Record<string, string> = {
      consejo: 'TIPO CONSEJO: Lenguaje muy sencillo, amigable, cálido, vocabulario cotidiano folclórico del campesino.',
      tecnico: 'TIPO TÉCNICO: Lenguaje claro con terminología especializada de agronomía explicada de forma didáctica.',
      tutorial: 'TIPO TUTORIAL: Estructura didáctica paso a paso (máx 4 pasos). Formato práctico y aplicable.',
    };

    const lengthMap: Record<string, string> = {
      corto: '2-3 oraciones breves.',
      medio: '4-6 oraciones con desarrollo moderado.',
      largo: '7-10 oraciones con explicación detallada, anécdotas y CTA extenso.',
    };

    const userPrompt = `${characterName}: ${characterDesc}\n\n${topicsClause}\n\nEstilo de redacción: ${depthMap[enfoque] || depthMap.consejo}\nExtensión del copy de Facebook: ${lengthMap[fbLength] || lengthMap.medio}\n\nGenera exactamente ${numMessages} propuestas con los 7 campos especificados.`;

    const response = await callGemini('contenido-personajes', wrapUserPrompt(userPrompt), systemPrompt);
    const parsed = parseGeminiJson(response.text);

    if (!parsed || !parsed.ideas) {
      logError(ROUTE, 'Failed to parse Gemini JSON or missing ideas array');
      return NextResponse.json(
        { error: 'La IA no devolvió un JSON válido con el campo "ideas". Intenta nuevamente.' },
        { status: 502 }
      );
    }

    const ideas = extractArray<Record<string, string>>(parsed, 'ideas');
    if (!ideas) {
      logError(ROUTE, 'ideas field is not a valid array');
      return NextResponse.json(
        { error: 'El campo "ideas" no es un array válido. Intenta nuevamente.' },
        { status: 502 }
      );
    }

    const styleDirective = PHOTO_STYLES[photoStyle] || PHOTO_STYLES.cinematic;

    const enriched = ideas.map((idea) => {
      let copy = idea.copy_facebook || '';
      if (footer) copy += `\n\n${footer}`;
      if (hashtags) copy += `\n${hashtags}`;
      const promptFlow = `based on character description: ${characterDesc}. Act as this character. The character is ${idea.accion || ''}. Setting: ${idea.entorno || ''}. ${styleDirective}`;
      return { ...idea, copy_facebook: copy, prompt_flow: promptFlow };
    });

    const moduleDef = getModuleById('contenido-personajes');
    await db.generation.create({
      data: {
        moduleId: 'contenido-personajes',
        moduleName: moduleDef?.name || 'Contenido de Personajes',
        prompt: `Campaña: ${characterName} | ${numMessages} msgs | ${enfoque} | ${photoStyle}`,
        result: `Campaña generada: ${enriched.length} propuestas para ${characterName}`,
        metadata: JSON.stringify({ characterName, enfoque, photoStyle, count: enriched.length }),
        apiKeyId: response.apiKeyId,
      },
    });

    return NextResponse.json({ success: true, ideas: enriched });
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
