import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.apiKey.count();
    return NextResponse.json({ ok: true, db: 'connected', tables: 'auto-created', apiKeyCount: count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, db: 'disconnected', error: msg });
  }
}
