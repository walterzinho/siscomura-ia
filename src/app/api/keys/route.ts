import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const keys = await db.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const safeKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      model: k.model,
      isActive: k.isActive,
      usageCount: k.usageCount,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      keyPreview: k.key.slice(0, 8) + '...' + k.key.slice(-4),
    }));
    return NextResponse.json(safeKeys);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al obtener API Keys', detail: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, key, model } = body;

    if (!name || !key) {
      return NextResponse.json(
        { error: 'Se requiere nombre y API Key' },
        { status: 400 }
      );
    }

    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: key.trim(),
        model: model || 'gemini-2.0-flash',
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      model: apiKey.model,
      isActive: apiKey.isActive,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al crear API Key', detail: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, key, model, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (key !== undefined) data.key = key.trim();
    if (model !== undefined) data.model = model;
    if (isActive !== undefined) data.isActive = isActive;

    await db.apiKey.update({ where: { id }, data });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al actualizar API Key', detail: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 });
    }

    await db.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al eliminar API Key', detail: msg }, { status: 500 });
  }
}
