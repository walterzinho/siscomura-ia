import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

const PROMPTS_DIR = join(process.cwd(), 'prompts');

export async function loadPromptFile(moduleId: string): Promise<string> {
  try {
    const content = await readFile(join(PROMPTS_DIR, `${moduleId}.md`), 'utf-8');
    return content;
  } catch {
    return '';
  }
}

export async function getStationContext(): Promise<string> {
  try {
    const config = await db.stationConfig.findFirst();
    if (!config) return '';

    const parts: string[] = [];
    if (config.nombre) parts.push(`Nombre de la emisora: ${config.nombre}`);
    if (config.url) parts.push(`Sitio web: ${config.url}`);
    if (config.email) parts.push(`Correo de contacto: ${config.email}`);
    if (config.whatsapp) parts.push(`WhatsApp: ${config.whatsapp}`);
    if (config.facebook) parts.push(`Facebook: ${config.facebook}`);
    if (config.tiktok) parts.push(`TikTok: ${config.tiktok}`);
    if (config.youtube) parts.push(`YouTube: ${config.youtube}`);
    if (config.instagram) parts.push(`Instagram: ${config.instagram}`);
    if (config.urlApp) parts.push(`App de la emisora: ${config.urlApp}`);

    if (parts.length === 0) return '';

    return `
\n## DATOS DE LA EMISORA (usa estos datos reales en los libretos cuando corresponda)
\n${parts.join('\n')}`;
  } catch {
    return '';
  }
}

export async function getActiveApiKey() {
  const keys = await db.apiKey.findMany({
    where: { isActive: true },
    orderBy: { usageCount: 'asc' },
  });

  if (keys.length === 0) {
    return null;
  }

  return keys[0];
}

export async function rotateApiKeyUsage(apiKeyId: string) {
  await db.apiKey.update({
    where: { id: apiKeyId },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}

export async function callGemini(
  moduleId: string,
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; apiKeyId: string; model: string }> {
  // Load system instruction from .md file if not provided
  let finalSystemInstruction = systemInstruction || '';
  if (!finalSystemInstruction) {
    finalSystemInstruction = await loadPromptFile(moduleId);
  }

  // Append station context to system instruction
  const stationCtx = await getStationContext();
  if (stationCtx && finalSystemInstruction) {
    finalSystemInstruction = finalSystemInstruction + stationCtx;
  }

  const apiKey = await getActiveApiKey();
  if (!apiKey) {
    throw new Error(
      'No hay API Keys activas configuradas. Ve a Configuración > API Keys para agregar una.'
    );
  }

  const model = apiKey.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.key}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  };

  if (finalSystemInstruction) {
    body.systemInstruction = { parts: [{ text: finalSystemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData as GeminiResponse).error?.message || `Error HTTP ${response.status}`;
    throw new Error(`Error de API: ${errorMsg}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('La API no devolvió contenido. Intenta nuevamente.');
  }

  await rotateApiKeyUsage(apiKey.id);

  return { text, apiKeyId: apiKey.id, model };
}

export async function callGeminiWithUrl(
  moduleId: string,
  url: string,
  prompt: string
): Promise<{ text: string; apiKeyId: string; model: string }> {
  let pageContent = '';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const html = await res.text();
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      pageContent = textContent.slice(0, 15000);
    }
  } catch {
    pageContent = `[No se pudo acceder al contenido de la URL: ${url}. Genera el contenido basándote en el contexto proporcionado en el prompt.]`;
  }

  const fullPrompt = `${prompt}\n\n---\n\nContenido extraído de la URL (${url}):\n${pageContent}`;

  return callGemini(moduleId, fullPrompt);
}
