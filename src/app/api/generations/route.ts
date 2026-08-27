import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, deleteGenerationSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    await checkRateLimit('write');
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const generations = await db.generation.findMany({
      where: moduleId ? { moduleId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(generations);
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
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await checkRateLimit('admin');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const olderThanDays = searchParams.get('olderThan');
    const clearAll = searchParams.get('all');

    // Bulk: delete all
    if (clearAll === 'true') {
      const r = await db._raw({ sql: 'DELETE FROM Generation' });
      return NextResponse.json({ success: true, deleted: r.rowsAffected || 0 });
    }

    // Bulk: delete older than N days
    if (olderThanDays) {
      const days = parseInt(olderThanDays, 10);
      if (isNaN(days) || days < 1) {
        return NextResponse.json({ error: 'Valor inválido para olderThan' }, { status: 400 });
      }
      const r = await db._raw({
        sql: "DELETE FROM Generation WHERE createdAt < datetime('now', ?)",
        args: [`-${days} days`],
      });
      return NextResponse.json({ success: true, deleted: r.rowsAffected || 0 });
    }

    // Single: delete by ID
    if (!id) {
      return NextResponse.json({ error: 'Se requiere ID, olderThan o all' }, { status: 400 });
    }

    validateOrThrow(deleteGenerationSchema, { id });
    await db.generation.delete({ where: { id } });

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
    return NextResponse.json({ error: 'Error al eliminar', detail: msg }, { status: 500 });
  }
}
