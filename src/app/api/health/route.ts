import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const count = await db.apiKey.count();
    return NextResponse.json({ ok: true, db: 'connected', tables: 'auto-created', apiKeyCount: count });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logError('/api/health', 'Database health check failed', { error: msg });
    return NextResponse.json(
      { ok: false, db: 'disconnected', error: msg },
      { status: 503 }
    );
  }
}
