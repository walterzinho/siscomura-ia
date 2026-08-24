import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = (process.env.DATABASE_URL || '').trim()

  if (databaseUrl.startsWith('libsql://')) {
    // Force a valid dummy URL so Prisma's internal validation passes.
    // The adapter handles the real connection to Turso.
    process.env.DATABASE_URL = 'file:./dummy.db'

    const libsql = createClient({
      url: databaseUrl,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
    })
  }

  return new PrismaClient()
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    const client = globalForPrisma.prisma!
    const value = (client as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
