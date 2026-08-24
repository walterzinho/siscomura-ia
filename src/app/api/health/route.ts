import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEPLOY_VERSION = 'v7-lazy-auth';

export async function GET() {
  try {
    await db.apiKey.count();
    return NextResponse.json({ ok: true, db: 'connected', version: DEPLOY_VERSION });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      db: 'disconnected',
      error: msg,
      version: DEPLOY_VERSION,
      envSet: !!process.env.DATABASE_URL,
      envLen: process.env.DATABASE_URL?.length || 0,
      envPrefix: process.env.DATABASE_URL?.substring(0, 25),
      authTokenSet: !!process.env.TURSO_AUTH_TOKEN,
    });
  }
}
