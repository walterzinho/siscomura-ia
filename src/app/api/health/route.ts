import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.apiKey.count();
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      db: 'disconnected',
      error: msg,
      envSet: !!process.env.DATABASE_URL,
      envPrefix: process.env.DATABASE_URL?.substring(0, 20),
    });
  }
}
