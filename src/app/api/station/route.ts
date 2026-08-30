import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, updateStationSchema } from '@/lib/validations';
import { logError } from '@/lib/logger';

const ROUTE = '/api/station';

function formatConfig(c: { id: string; nombre: string; url: string; email: string; whatsapp: string; facebook: string; tiktok: string; youtube: string; instagram: string; urlApp: string }) {
  return {
    id: c.id,
    nombre: c.nombre,
    url: c.url,
    email: c.email,
    whatsapp: c.whatsapp,
    facebook: c.facebook,
    tiktok: c.tiktok,
    youtube: c.youtube,
    instagram: c.instagram,
    urlApp: c.urlApp,
  };
}

export async function GET() {
  try {
    await checkRateLimit('read');
    let config = await db.stationConfig.findFirst();

    if (!config) {
      config = await db.stationConfig.create({ data: {} });
    }

    return NextResponse.json(formatConfig(config));
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) }
      });
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logError(ROUTE, 'GET failed', { error: message });
    return NextResponse.json({ error: 'Error al obtener datos de la emisora', detail: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateOrThrow(updateStationSchema, body);
    await checkRateLimit('write');

    let config = await db.stationConfig.findFirst();

    const data = {
      nombre: validated.nombre ?? '',
      url: validated.url ?? '',
      email: validated.email ?? '',
      whatsapp: validated.whatsapp ?? '',
      facebook: validated.facebook ?? '',
      tiktok: validated.tiktok ?? '',
      youtube: validated.youtube ?? '',
      instagram: validated.instagram ?? '',
      urlApp: validated.urlApp ?? '',
    };

    if (!config) {
      config = await db.stationConfig.create({ data });
    } else {
      await db.stationConfig.update({ where: { id: config.id }, data });
      config = { ...config, ...data, id: config.id };
    }

    return NextResponse.json(formatConfig(config));
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
    logError(ROUTE, 'PUT failed', { error: message });
    return NextResponse.json({ error: 'Error al guardar datos de la emisora', detail: message }, { status: 500 });
  }
}
