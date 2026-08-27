import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, updatePromptSchema } from '@/lib/validations';

export async function GET() {
  try {
    await checkRateLimit('write');
    // Ensure prompts are seeded from .md files (local dev only, no-op on Vercel)
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
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error al leer prompts' },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: 'Error al guardar prompt' },
      { status: 500 }
    );
  }
}
