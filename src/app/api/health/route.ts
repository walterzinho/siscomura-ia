import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEPLOY_VERSION = 'v9-dummy-url';

export async function GET() {
  try {
    await db.apiKey.count();
    return NextResponse.json({ ok: true, db: 'connected', version: DEPLOY_VERSION });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const raw = process.env.DATABASE_URL || '';
    const first10 = raw.substring(0, 10);
    const charCodes = Array.from(first10).map(c => c.charCodeAt(0));
    const trimmed = raw.trim();
    const startsOk = trimmed.startsWith('libsql://');
    return NextResponse.json({
      ok: false,
      db: 'disconnected',
      error: msg,
      version: DEPLOY_VERSION,
      envSet: !!process.env.DATABASE_URL,
      envLen: raw.length,
      trimmedLen: trimmed.length,
      startsOk,
      first10,
      charCodes,
      authTokenSet: !!process.env.TURSO_AUTH_TOKEN,
    });
  }
}
