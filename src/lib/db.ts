import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export let db: PrismaClient
let dbError: string | null = null

try {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'

  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: databaseUrl })
    const adapter = new PrismaLibSql(libsql)
    db = new PrismaClient({ adapter, log: [] })
  } else {
    db = new PrismaClient({ log: [] })
  }
} catch (err) {
  dbError = err instanceof Error ? err.message : 'Error desconocido'
  db = new PrismaClient()
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export function getDbError() {
  return dbError
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    await db.apiKey.count()
    return true
  } catch {
    return false
  }
}
