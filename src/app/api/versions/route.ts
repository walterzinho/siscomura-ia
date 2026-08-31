import { NextResponse } from 'next/server';
import { VERSIONS, getCurrentVersion } from '@/lib/versions';

export async function GET() {
  return NextResponse.json({
    currentVersion: getCurrentVersion(),
    versions: VERSIONS,
  });
}