import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient | null = null

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''

  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: databaseUrl })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  // SQLite local (desarrollo)
  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient())
