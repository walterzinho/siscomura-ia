import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const DEPLOY_VERSION = 'v10-direct-libsql';

export async function GET() {
  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const hasToken = !!process.env.TURSO_AUTH_TOKEN;

  // Test 1: Direct libsql connection (no Prisma)
  let libsqlOk = false;
  let libsqlError = '';
  try {
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const result = await libsql.execute('SELECT 1 as ok');
    libsqlOk = true;
  } catch (e) {
    libsqlError = e instanceof Error ? e.message : String(e);
  }

  // Test 2: Prisma (through proxy)
  let prismaOk = false;
  let prismaError = '';
  try {
    const { db } = await import('@/lib/db');
    await db.apiKey.count();
    prismaOk = true;
  } catch (e) {
    prismaError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    version: DEPLOY_VERSION,
 libsql: { ok: libsqlOk, error: libsqlError },
    prisma: { ok: prismaOk, error: prismaError?.substring(0, 200) },
    env: {
      set: !!process.env.DATABASE_URL,
      len: databaseUrl.length,
      prefix: databaseUrl.substring(0, 30),
      hasToken,
    },
  });
}