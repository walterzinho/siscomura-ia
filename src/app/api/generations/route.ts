import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where = moduleId ? { moduleId } : {};

    const generations = await db.generation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        moduleId: true,
        moduleName: true,
        prompt: true,
        result: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json(generations);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 });
    }

    await db.generation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar registro' }, { status: 500 });
  }
}
