import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, deleteGenerationSchema } from '@/lib/validations';
import { logError } from '@/lib/logger';

const ROUTE = '/api/generations';

export async function GET(request: NextRequest) {
  try {
    await checkRateLimit('read');
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
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logError(ROUTE, 'GET failed', { error: message });
    return NextResponse.json({ error: 'Error al obtener historial', detail: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await checkRateLimit('admin');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const olderThanDays = searchParams.get('olderThan');
    const clearAll = searchParams.get('all');

    if (clearAll === 'true') {
      const r = await db._raw({ sql: 'DELETE FROM Generation' });
      return NextResponse.json({ success: true, deleted: r.rowsAffected || 0 });
    }

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
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logError(ROUTE, 'DELETE failed', { error: message });
    return NextResponse.json({ error: 'Error al eliminar', detail: message }, { status: 500 });
  }
}
