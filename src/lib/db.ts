import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'

  // Si la URL empieza con "libsql://", usar el adapter de Turso (para Vercel)
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: databaseUrl })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter, log: ['query'] })
  }

  // SQLite local (desarrollo)
  return new PrismaClient({ log: ['query'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
