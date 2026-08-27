import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, createApiKeySchema, updateApiKeySchema } from '@/lib/validations';

export async function GET() {
  try {
    await checkRateLimit('write');
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
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) }
      });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al obtener API Keys', detail: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, key, model } = validateOrThrow(createApiKeySchema, body);
    await checkRateLimit('admin');

    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: key.trim(),
        model: model || 'gemini-3.6-flash',
      },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      model: apiKey.model,
      isActive: apiKey.isActive,
    });
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
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al crear API Key', detail: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, key, model, isActive } = validateOrThrow(updateApiKeySchema, body);
    await checkRateLimit('admin');

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (key !== undefined) data.key = key.trim();
    if (model !== undefined) data.model = model;
    if (isActive !== undefined) data.isActive = isActive;

    await db.apiKey.update({ where: { id }, data });

    return NextResponse.json({ success: true });
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
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al actualizar API Key', detail: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await checkRateLimit('admin');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Se requiere ID' }, { status: 400 });
    }

    await db.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
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
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al eliminar API Key', detail: msg }, { status: 500 });
  }
}
