import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, updatePromptSchema } from '@/lib/validations';
import { logError } from '@/lib/logger';

const ROUTE = '/api/prompts';

export async function GET() {
  try {
    await checkRateLimit('read');
    await db.prompt.seedFromFilesystem();
    const prompts = await db.prompt.findMany();
    return NextResponse.json(prompts);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) }
      });
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logError(ROUTE, 'GET failed', { error: message });
    return NextResponse.json({ error: 'Error al leer prompts', detail: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, content } = validateOrThrow(updatePromptSchema, body);
    await checkRateLimit('write');

    await db.prompt.upsert({ where: { moduleId }, data: { content } });

    return NextResponse.json({ success: true, moduleId });
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
    logError(ROUTE, 'PUT failed', { error: message });
    return NextResponse.json({ error: 'Error al guardar prompt', detail: message }, { status: 500 });
  }
}
