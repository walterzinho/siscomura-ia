import { createClient, type Client, type InValue } from '@libsql/client';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { encrypt, decrypt } from '@/lib/crypto';

/* ------------------------------------------------------------------
   Lightweight libsql wrapper — replaces Prisma on Vercel.
   Prisma inlines process.env.DATABASE_URL at build-time, which
   breaks when the var is marked as "Secret" (runtime-only).
   libsql reads the env var at call-time, so it always works.
   ------------------------------------------------------------------ */

let _client: Client | undefined;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: (process.env.DATABASE_URL || '').trim(),
    });
  }
  return _client;
}

/* ---- Helpers --------------------------------------------------- */

function toBool(v: number | null | undefined): boolean {
  return v === 1;
}
function fromBool(v: boolean): number {
  return v ? 1 : 0;
}
function toDate(v: string | null | undefined): Date | null {
  return v ? new Date(v) : null;
}
function fromDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
function cuid(): string {
  // Simple unique ID (matches Prisma @default(cuid()) pattern)
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/* ---- Auto-migration: ensures tables exist ---------------------- */

let _migrated = false;

async function ensureTables() {
  if (_migrated) return;
  const c = getClient();
  await c.batch([
    { sql: `CREATE TABLE IF NOT EXISTS ApiKey (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      key        TEXT NOT NULL,
      model      TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
      isActive   INTEGER NOT NULL DEFAULT 1,
      usageCount INTEGER NOT NULL DEFAULT 0,
      lastUsedAt TEXT,
      createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS Generation (
      id         TEXT PRIMARY KEY,
      moduleId   TEXT NOT NULL,
      moduleName TEXT NOT NULL,
      prompt     TEXT NOT NULL,
      result     TEXT NOT NULL,
      metadata   TEXT,
      apiKeyId   TEXT REFERENCES ApiKey(id) ON DELETE SET NULL,
      createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_generation_moduleId ON Generation(moduleId)' },
    { sql: 'CREATE INDEX IF NOT EXISTS idx_generation_createdAt ON Generation(createdAt)' },
    { sql: `CREATE TABLE IF NOT EXISTS StationConfig (
      id         TEXT PRIMARY KEY,
      nombre     TEXT NOT NULL DEFAULT '',
      url        TEXT NOT NULL DEFAULT '',
      email      TEXT NOT NULL DEFAULT '',
      whatsapp   TEXT NOT NULL DEFAULT '',
      facebook   TEXT NOT NULL DEFAULT '',
      tiktok     TEXT NOT NULL DEFAULT '',
      youtube    TEXT NOT NULL DEFAULT '',
      instagram  TEXT NOT NULL DEFAULT '',
      urlApp     TEXT NOT NULL DEFAULT '',
      createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS ModuleConfig (
      id          TEXT PRIMARY KEY,
      moduleId    TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      description TEXT NOT NULL,
      icon        TEXT NOT NULL,
      sortOrder   INTEGER NOT NULL DEFAULT 0,
      isActive    INTEGER NOT NULL DEFAULT 1,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS Prompt (
      id        TEXT PRIMARY KEY,
      moduleId  TEXT NOT NULL UNIQUE,
      content   TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
    { sql: `CREATE TABLE IF NOT EXISTS User (
      id         TEXT PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      name       TEXT NOT NULL DEFAULT '',
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'admin',
      createdAt  TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt  TEXT NOT NULL DEFAULT (datetime('now'))
    )` },
  ]);
  _migrated = true;
}

/* ---- Public db object (Prisma-compatible API) ------------------ */

export const db = {
  /* --------- ApiKey ------------------------------------------- */
  apiKey: {
    async count() {
      await ensureTables();
      const r = await getClient().execute('SELECT COUNT(*) as c FROM ApiKey');
      return Number(r.rows[0].c);
    },

    async findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
      take?: number;
    }) {
      await ensureTables();
      const params: InValue[] = [];
      const conditions: string[] = [];

      if (args?.where) {
        for (const [k, v] of Object.entries(args.where)) {
          if (v === true || v === false) {
            params.push(fromBool(v as boolean));
          } else {
            params.push(v as InValue);
          }
          conditions.push(`${k} = ?`);
        }
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      let orderBy = 'createdAt DESC';
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0];
        orderBy = `${field} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const limit = args?.take ? `LIMIT ${args.take}` : '';
      const r = await getClient().execute({
        sql: `SELECT * FROM ApiKey ${where} ORDER BY ${orderBy} ${limit}`,
        args: params,
      });

      return r.rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        key: decrypt(row.key as string),
        model: row.model as string,
        isActive: toBool(row.isActive as number),
        usageCount: Number(row.usageCount),
        lastUsedAt: toDate(row.lastUsedAt as string | null),
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));
    },

    async create(args: { data: Record<string, unknown> }) {
      await ensureTables();
      const id = args.data.id || cuid();
      const now = new Date().toISOString();
      await getClient().execute({
        sql: `INSERT INTO ApiKey (id, name, key, model, isActive, usageCount, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        args: [
          id,
          args.data.name as string,
          encrypt(String(args.data.key)),
          (args.data.model as string) || 'gemini-3.6-flash',
          args.data.isActive !== undefined ? fromBool(args.data.isActive as boolean) : 1,
          now,
          now,
        ] as InValue[],
      });
      return {
        id,
        name: args.data.name as string,
        key: args.data.key as string,
        model: ((args.data.model as string) || 'gemini-3.6-flash'),
        isActive: args.data.isActive !== undefined ? (args.data.isActive as boolean) : true,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    },

    async update(args: { where: { id: string }; data: Record<string, unknown> }) {
      await ensureTables();
      const sets: string[] = [];
      const params: InValue[] = [];

      for (const [k, v] of Object.entries(args.data)) {
        if (k === 'usageCount' && typeof v === 'object' && v !== null && 'increment' in v) {
          sets.push(`usageCount = usageCount + ?`);
          params.push((v as { increment: number }).increment);
        } else if (k === 'key') {
          // Encrypt API keys before storing
          sets.push(`${k} = ?`);
          params.push(encrypt(String(v)));
        } else if (v === true || v === false) {
          sets.push(`${k} = ?`);
          params.push(fromBool(v as boolean));
        } else if (v instanceof Date) {
          sets.push(`${k} = ?`);
          params.push(v.toISOString());
        } else {
          sets.push(`${k} = ?`);
          params.push(v as InValue);
        }
      }

      sets.push("updatedAt = datetime('now')");
      params.push(args.where.id);

      await getClient().execute({
        sql: `UPDATE ApiKey SET ${sets.join(', ')} WHERE id = ?`,
        args: params,
      });
    },

    async delete(args: { where: { id: string } }) {
      await ensureTables();
      await getClient().execute({
        sql: 'DELETE FROM ApiKey WHERE id = ?',
        args: [args.where.id],
      });
    },
  },

  /* --------- Generation ---------------------------------------- */
  generation: {
    async findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
      take?: number;
      select?: Record<string, boolean>;
    }) {
      await ensureTables();
      const params: InValue[] = [];
      const conditions: string[] = [];

      if (args?.where) {
        for (const [k, v] of Object.entries(args.where)) {
          params.push(v as InValue);
          conditions.push(`${k} = ?`);
        }
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      let orderBy = 'createdAt DESC';
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0];
        orderBy = `${field} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const limit = args?.take ? `LIMIT ${args.take}` : '';

      // select is always the same in current usage
      const r = await getClient().execute({
        sql: `SELECT id, moduleId, moduleName, prompt, result, metadata, createdAt FROM Generation ${where} ORDER BY ${orderBy} ${limit}`,
        args: params,
      });

      return r.rows.map((row) => ({
        id: row.id as string,
        moduleId: row.moduleId as string,
        moduleName: row.moduleName as string,
        prompt: row.prompt as string,
        result: row.result as string,
        metadata: row.metadata as string | null,
        createdAt: new Date(row.createdAt as string),
      }));
    },

    async create(args: { data: Record<string, unknown> }) {
      await ensureTables();
      const id = cuid();
      await getClient().execute({
        sql: `INSERT INTO Generation (id, moduleId, moduleName, prompt, result, metadata, apiKeyId, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id,
          args.data.moduleId as string,
          args.data.moduleName as string,
          args.data.prompt as string,
          args.data.result as string,
          args.data.metadata as string | null ?? null,
          args.data.apiKeyId as string | null ?? null,
        ] as InValue[],
      });
      return { id };
    },

    async delete(args: { where: { id: string } }) {
      await ensureTables();
      await getClient().execute({
        sql: 'DELETE FROM Generation WHERE id = ?',
        args: [args.where.id],
      });
    },
  },

  /* --------- StationConfig ------------------------------------- */
  stationConfig: {
    async findFirst() {
      await ensureTables();
      const r = await getClient().execute('SELECT * FROM StationConfig LIMIT 1');
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      return {
        id: row.id as string,
        nombre: row.nombre as string,
        url: row.url as string,
        email: row.email as string,
        whatsapp: row.whatsapp as string,
        facebook: row.facebook as string,
        tiktok: row.tiktok as string,
        youtube: row.youtube as string,
        instagram: row.instagram as string,
        urlApp: row.urlApp as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    async create(args: { data?: Record<string, unknown> }) {
      await ensureTables();
      const id = cuid();
      const d = args.data || {};
      await getClient().execute({
        sql: `INSERT INTO StationConfig (id, nombre, url, email, whatsapp, facebook, tiktok, youtube, instagram, urlApp, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [
          id,
          (d.nombre as string) || '',
          (d.url as string) || '',
          (d.email as string) || '',
          (d.whatsapp as string) || '',
          (d.facebook as string) || '',
          (d.tiktok as string) || '',
          (d.youtube as string) || '',
          (d.instagram as string) || '',
          (d.urlApp as string) || '',
        ] as InValue[],
      });
      return {
        id,
        nombre: (d.nombre as string) || '',
        url: (d.url as string) || '',
        email: (d.email as string) || '',
        whatsapp: (d.whatsapp as string) || '',
        facebook: (d.facebook as string) || '',
        tiktok: (d.tiktok as string) || '',
        youtube: (d.youtube as string) || '',
        instagram: (d.instagram as string) || '',
        urlApp: (d.urlApp as string) || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async update(args: { where: { id: string }; data: Record<string, unknown> }) {
      await ensureTables();
      const fields = ['nombre', 'url', 'email', 'whatsapp', 'facebook', 'tiktok', 'youtube', 'instagram', 'urlApp'];
      const sets: string[] = [];
      const params: InValue[] = [];

      for (const f of fields) {
        if (f in args.data) {
          sets.push(`${f} = ?`);
          params.push((args.data[f] as string | null) ?? '');
        }
      }

      sets.push("updatedAt = datetime('now')");
      params.push(args.where.id);

      await getClient().execute({
        sql: `UPDATE StationConfig SET ${sets.join(', ')} WHERE id = ?`,
        args: params,
      });
    },
  },

  /* --------- ModuleConfig -------------------------------------- */
  moduleConfig: {
    async findMany() {
      await ensureTables();
      const r = await getClient().execute('SELECT * FROM ModuleConfig ORDER BY sortOrder ASC');
      return r.rows.map((row) => ({
        id: row.id as string,
        moduleId: row.moduleId as string,
        name: row.name as string,
        description: row.description as string,
        icon: row.icon as string,
        sortOrder: Number(row.sortOrder),
        isActive: toBool(row.isActive as number),
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));
    },
  },

  /* --------- Prompt ------------------------------------------- */
  prompt: {
    async findMany() {
      await ensureTables();
      const r = await getClient().execute('SELECT id, moduleId, content, createdAt, updatedAt FROM Prompt ORDER BY moduleId ASC');
      return r.rows.map((row) => ({
        id: row.id as string,
        moduleId: row.moduleId as string,
        content: row.content as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));
    },

    async findFirst(args: { where: { moduleId: string } }) {
      await ensureTables();
      const r = await getClient().execute({
        sql: 'SELECT id, moduleId, content, createdAt, updatedAt FROM Prompt WHERE moduleId = ?',
        args: [args.where.moduleId],
      });
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      return {
        id: row.id as string,
        moduleId: row.moduleId as string,
        content: row.content as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    async upsert(args: { where: { moduleId: string }; data: { content: string } }) {
      await ensureTables();
      const existing = await getClient().execute({
        sql: 'SELECT id FROM Prompt WHERE moduleId = ?',
        args: [args.where.moduleId],
      });
      if (existing.rows.length > 0) {
        await getClient().execute({
          sql: "UPDATE Prompt SET content = ?, updatedAt = datetime('now') WHERE moduleId = ?",
          args: [args.data.content, args.where.moduleId],
        });
      } else {
        const id = cuid();
        await getClient().execute({
          sql: "INSERT INTO Prompt (id, moduleId, content, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
          args: [id, args.where.moduleId, args.data.content],
        });
      }
    },

    /** Seed from .md files if not yet in DB */
    async seedFromFilesystem() {
      await ensureTables();
      const PROMPTS_DIR = join(process.cwd(), 'prompts');
      try {
        const files = await readdir(PROMPTS_DIR);
        const mdFiles = files.filter((f) => f.endsWith('.md'));
        for (const filename of mdFiles) {
          const moduleId = filename.replace('.md', '');
          const exists = await getClient().execute({
            sql: 'SELECT id FROM Prompt WHERE moduleId = ?',
            args: [moduleId],
          });
          if (exists.rows.length === 0) {
            const content = await readFile(join(PROMPTS_DIR, filename), 'utf-8');
            const id = cuid();
            await getClient().execute({
              sql: "INSERT INTO Prompt (id, moduleId, content, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'))",
              args: [id, moduleId, content],
            });
          }
        }
      } catch {
        // .md dir may not exist at runtime on Vercel — that's fine
      }
    },
  },

  /* --------- User --------------------------------------------- */
  user: {
    async findByEmail(email: string) {
      await ensureTables();
      const r = await getClient().execute({
        sql: 'SELECT id, email, name, role, createdAt, updatedAt FROM User WHERE email = ?',
        args: [email],
      });
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      return {
        id: row.id as string,
        email: row.email as string,
        name: row.name as string,
        role: row.role as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    async findById(id: string) {
      await ensureTables();
      const r = await getClient().execute({
        sql: 'SELECT id, email, name, role, createdAt, updatedAt FROM User WHERE id = ?',
        args: [id],
      });
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      return {
        id: row.id as string,
        email: row.email as string,
        name: row.name as string,
        role: row.role as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    async findWithPassword(email: string) {
      await ensureTables();
      const r = await getClient().execute({
        sql: 'SELECT id, email, name, password, role, createdAt, updatedAt FROM User WHERE email = ?',
        args: [email],
      });
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      return {
        id: row.id as string,
        email: row.email as string,
        name: row.name as string,
        password: row.password as string,
        role: row.role as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    async count() {
      await ensureTables();
      const r = await getClient().execute('SELECT COUNT(*) as c FROM User');
      return Number(r.rows[0].c);
    },

    async create(args: { data: { email: string; name: string; password: string; role?: string } }) {
      await ensureTables();
      const id = cuid();
      const now = new Date().toISOString();
      await getClient().execute({
        sql: 'INSERT INTO User (id, email, name, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [id, args.data.email, args.data.name, args.data.password, args.data.role || 'admin', now, now],
      });
      return {
        id,
        email: args.data.email,
        name: args.data.name,
        role: args.data.role || 'admin',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    },
  },

  /* --------- Raw SQL (for bulk ops) --------------------------- */
  async _raw(args: { sql: string; args?: InValue[] }) {
    await ensureTables();
    return getClient().execute(args as { sql: string; args?: InValue[] });
  },
};
