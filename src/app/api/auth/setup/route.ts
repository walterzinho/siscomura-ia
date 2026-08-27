import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { validateOrThrow, ValidationError } from '@/lib/validations';
import { z } from 'zod';

const setupSchema = z.object({
  email: z.string().email('Email invalido'),
  name: z.string().min(2, 'Nombre muy corto').max(100),
  password: z.string().min(8, 'Minimo 8 caracteres').max(100),
});

/** GET: returns whether setup is needed (no users exist) */
export async function GET() {
  try {
    const count = await db.user.count();
    return NextResponse.json({ needsSetup: count === 0 });
  } catch {
    return NextResponse.json({ needsSetup: true });
  }
}

/** POST: create the first admin user (only works when 0 users exist) */
export async function POST(request: Request) {
  try {
    const count = await db.user.count();
    if (count > 0) {
      return NextResponse.json(
        { error: 'Ya existe un usuario. Usa la pagina de login.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, password } = validateOrThrow(setupSchema, body);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        role: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
