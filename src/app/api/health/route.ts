import { NextResponse } from 'next/server';
import { checkDbConnection, getDbError } from '@/lib/db';

export async function GET() {
  const connected = await checkDbConnection();
  return NextResponse.json({
    ok: connected,
    db: connected ? 'connected' : 'disconnected',
    error: connected ? null : (getDbError() || 'DATABASE_URL no configurada o base de datos no accesible'),
  });
}
