import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateOrThrow, ValidationError, updateStationSchema } from '@/lib/validations';

export async function GET() {
  try {
    await checkRateLimit('write');
    let config = await db.stationConfig.findFirst();

    if (!config) {
      config = await db.stationConfig.create({ data: {} });
    }

    return NextResponse.json({
      id: config.id,
      nombre: config.nombre,
      url: config.url,
      email: config.email,
      whatsapp: config.whatsapp,
      facebook: config.facebook,
      tiktok: config.tiktok,
      youtube: config.youtube,
      instagram: config.instagram,
      urlApp: config.urlApp,
    });
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
    return NextResponse.json(
      { error: 'Error al obtener datos de la emisora', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateOrThrow(updateStationSchema, body);
    await checkRateLimit('write');

    let config = await db.stationConfig.findFirst();

    if (!config) {
      config = await db.stationConfig.create({
        data: {
          nombre: validated.nombre ?? '',
          url: validated.url ?? '',
          email: validated.email ?? '',
          whatsapp: validated.whatsapp ?? '',
          facebook: validated.facebook ?? '',
          tiktok: validated.tiktok ?? '',
          youtube: validated.youtube ?? '',
          instagram: validated.instagram ?? '',
          urlApp: validated.urlApp ?? '',
        },
      });
    } else {
      await db.stationConfig.update({
        where: { id: config.id },
        data: {
          nombre: validated.nombre ?? '',
          url: validated.url ?? '',
          email: validated.email ?? '',
          whatsapp: validated.whatsapp ?? '',
          facebook: validated.facebook ?? '',
          tiktok: validated.tiktok ?? '',
          youtube: validated.youtube ?? '',
          instagram: validated.instagram ?? '',
          urlApp: validated.urlApp ?? '',
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      nombre: validated.nombre ?? '',
      url: validated.url ?? '',
      email: validated.email ?? '',
      whatsapp: validated.whatsapp ?? '',
      facebook: validated.facebook ?? '',
      tiktok: validated.tiktok ?? '',
      youtube: validated.youtube ?? '',
      instagram: validated.instagram ?? '',
      urlApp: validated.urlApp ?? '',
    });
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
    return NextResponse.json(
      { error: 'Error al guardar datos de la emisora', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
