import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
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
    return NextResponse.json(
      { error: 'Error al obtener datos de la emisora', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    let config = await db.stationConfig.findFirst();

    if (!config) {
      config = await db.stationConfig.create({
        data: {
          nombre: body.nombre ?? '',
          url: body.url ?? '',
          email: body.email ?? '',
          whatsapp: body.whatsapp ?? '',
          facebook: body.facebook ?? '',
          tiktok: body.tiktok ?? '',
          youtube: body.youtube ?? '',
          instagram: body.instagram ?? '',
          urlApp: body.urlApp ?? '',
        },
      });
    } else {
      await db.stationConfig.update({
        where: { id: config.id },
        data: {
          nombre: body.nombre ?? '',
          url: body.url ?? '',
          email: body.email ?? '',
          whatsapp: body.whatsapp ?? '',
          facebook: body.facebook ?? '',
          tiktok: body.tiktok ?? '',
          youtube: body.youtube ?? '',
          instagram: body.instagram ?? '',
          urlApp: body.urlApp ?? '',
        },
      });
    }

    return NextResponse.json({
      id: config.id,
      nombre: body.nombre ?? '',
      url: body.url ?? '',
      email: body.email ?? '',
      whatsapp: body.whatsapp ?? '',
      facebook: body.facebook ?? '',
      tiktok: body.tiktok ?? '',
      youtube: body.youtube ?? '',
      instagram: body.instagram ?? '',
      urlApp: body.urlApp ?? '',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar datos de la emisora', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
