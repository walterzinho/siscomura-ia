import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const PROMPTS_DIR = join(process.cwd(), 'prompts');

export async function GET() {
  try {
    const files = await readdir(PROMPTS_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const prompts = await Promise.all(
      mdFiles.map(async (filename) => {
        const content = await readFile(join(PROMPTS_DIR, filename), 'utf-8');
        const moduleId = filename.replace('.md', '');
        return { moduleId, filename, content };
      })
    );

    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al leer prompts' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, content } = body;

    if (!moduleId || content === undefined) {
      return NextResponse.json(
        { error: 'Se requiere moduleId y content' },
        { status: 400 }
      );
    }

    const filename = `${moduleId}.md`;
    const filePath = join(PROMPTS_DIR, filename);

    await writeFile(filePath, content, 'utf-8');

    return NextResponse.json({ success: true, moduleId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar prompt' },
      { status: 500 }
    );
  }
}
