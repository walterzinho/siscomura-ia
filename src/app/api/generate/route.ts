import { NextRequest, NextResponse } from 'next/server';
import { callGemini, callGeminiWithUrl } from '@/lib/gemini';
import { getModuleById } from '@/lib/modules';
import { db } from '@/lib/db';

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const html = await res.text();
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);
    }
    return '';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, prompt, urls } = body;

    if (!moduleId || !prompt) {
      return NextResponse.json(
        { error: 'Se requiere moduleId y prompt' },
        { status: 400 },
      );
    }

    const moduleDef = getModuleById(moduleId);
    if (!moduleDef) {
      return NextResponse.json(
        { error: `Módulo no encontrado: ${moduleId}` },
        { status: 404 },
      );
    }

    let result: string;
    let metadata: Record<string, unknown> | null = null;
    let apiKeyId: string | undefined;

    if (moduleId === 'horoscopo-semanal' && urls && urls.length > 0) {
      const urlList = urls.filter((u: string) => u.trim()).slice(0, 3);
      const contents = await Promise.all(urlList.map(fetchUrlContent));

      const urlSections = contents
        .map((content, i) => {
          if (!content) return `Fuente ${i + 1} (${urlList[i]}): No se pudo extraer contenido.`;
          return `--- CONTENIDO EXTRAÍDO DE FUENTE ${i + 1} (${urlList[i]}) ---\n${content}`;
        })
        .join('\n\n');

      const fullPrompt = `${prompt}\n\n${urlSections}`;
      const response = await callGemini(moduleId, fullPrompt);
      result = response.text;
      apiKeyId = response.apiKeyId;
      metadata = { urls: urlList, sourcesFetched: contents.filter(Boolean).length };

    } else if (moduleId === 'conexion-territorial' && urls && urls.length > 0) {
      const urlList = urls.filter((u: string) => u.trim()).slice(0, 5);
      const urlPrompts = urlList.map(
        (url: string, i: number) => `Noticia ${i + 1} - URL: ${url}`,
      );
      const fullPrompt = `${prompt}\n\n${urlPrompts.join('\n')}`;
      const response = await callGemini(moduleId, fullPrompt);
      result = response.text;
      apiKeyId = response.apiKeyId;
      metadata = { urls: urlList };

    } else {
      const response = await callGemini(moduleId, prompt);
      result = response.text;
      apiKeyId = response.apiKeyId;
    }

    await db.generation.create({
      data: {
        moduleId,
        moduleName: moduleDef.name,
        prompt: prompt.slice(0, 2000),
        result,
        metadata: metadata ? JSON.stringify(metadata) : null,
        apiKeyId,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
