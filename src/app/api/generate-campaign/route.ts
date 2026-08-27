import { NextRequest, NextResponse } from 'next/server';
import { callGemini, loadPromptFile } from '@/lib/gemini';
import { db } from '@/lib/db';
import { getModuleById } from '@/lib/modules';

const PHOTO_STYLES: Record<string, string> = {
  cinematic: 'Realistic, highly detailed, cinematic lighting, shallow depth of field, 50mm lens effect, professional composition, 2K.',
  smartphone: 'Raw, unedited smartphone photo, slight motion blur, casual lighting, realistic organic skin textures.',
  analog: 'Vintage 35mm analog film photograph, warm classic color grading, subtle film grain, nostalgic feel.',
  watercolor: 'Cozy warm watercolor painting, soft hand-drawn illustrations, pastel color tones.',
  oil: 'Luminous oil canvas painting, rich impasto brush strokes, classical fine art style, dramatic chiaroscuro.',
  macro: 'Professional agricultural macro studio photography, high-end close-up, sharp focus, studio lighting.',
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
      characterName, characterDesc,
      numMessages = 8, topics = '',
      enfoque = 'consejo', fbLength = 'medio',
      photoStyle = 'cinematic',
      imgRefs = [],
      footer = '', hashtags = '',
    } = body;

    if (!characterName || !characterDesc) {
      return NextResponse.json({ error: 'Se requiere nombre y descripción del personaje' }, { status: 400 });
    }

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

    const userPrompt = `${characterName}: ${characterDesc}

${topicsClause}

Estilo de redacción: ${depthMap[enfoque] || depthMap.consejo}
Extensión del copy de Facebook: ${lengthMap[fbLength] || lengthMap.medio}

Genera exactamente ${numMessages} propuestas con los 7 campos especificados.`;

    const response = await callGemini('contenido-personajes', userPrompt, systemPrompt);
    const parsed = parseGeminiJson(response.text);
    if (!parsed || !parsed.ideas) {
      return NextResponse.json({ error: 'No se pudo interpretar la respuesta', raw: response.text }, { status: 500 });
    }

    const styleDirective = PHOTO_STYLES[photoStyle] || PHOTO_STYLES.cinematic;
    const validImages = imgRefs.filter((u: string) => u.trim());
    const imgPrefix = validImages.length === 1
      ? `Using this character reference image ${validImages[0]} `
      : validImages.length > 1
        ? `Using these character reference images ${validImages.join(', ')} `
        : '';

    const ideas = (parsed.ideas as Array<Record<string, string>>).map((idea) => {
      let copy = idea.copy_facebook || '';
      if (footer) copy += `\n\n${footer}`;
      if (hashtags) copy += `\n${hashtags}`;
      const promptFlow = `${imgPrefix}based on character description: ${characterDesc}. Act as this character. The character is ${idea.accion || ''}. Setting: ${idea.entorno || ''}. ${styleDirective}`;
      return { ...idea, copy_facebook: copy, prompt_flow: promptFlow };
    });

    const moduleDef = getModuleById('contenido-personajes');
    await db.generation.create({
      data: {
        moduleId: 'contenido-personajes',
        moduleName: moduleDef?.name || 'Contenido de Personajes',
        prompt: `Campaña: ${characterName} | ${numMessages} msgs | ${enfoque} | ${photoStyle}`,
        result: `Campaña generada: ${ideas.length} propuestas para ${characterName}`,
        metadata: JSON.stringify({ characterName, enfoque, photoStyle, count: ideas.length }),
        apiKeyId: response.apiKeyId,
      },
    });

    return NextResponse.json({ success: true, ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
