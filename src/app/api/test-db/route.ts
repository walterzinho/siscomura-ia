import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  const url = process.env.DATABASE_URL || '';
  
  try {
    const client = createClient({ url });
    const result = await client.execute('SELECT 1 as test');
    return NextResponse.json({ 
      ok: true, 
      libsqlWorks: true,
      result: result.rows,
      urlPrefix: url.substring(0, 30) 
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ 
      ok: false, 
      libsqlWorks: false,
      error: msg,
      urlPrefix: url.substring(0, 30),
      envSet: !!process.env.DATABASE_URL,
    });
  }
}
