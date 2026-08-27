import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ensure prompts are seeded from .md files (local dev only, no-op on Vercel)
    await db.prompt.seedFromFilesystem();
    const prompts = await db.prompt.findMany();
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al leer prompts' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, content } = body;

    if (!moduleId || content === undefined) {
      return NextResponse.json(
        { error: 'Se requiere moduleId y content' },
        { status: 400 }
      );
    }

    await db.prompt.upsert({ where: { moduleId }, data: { content } });

    return NextResponse.json({ success: true, moduleId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar prompt' },
      { status: 500 }
    );
  }
}
