import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Demo mode: skip Prisma instantiation if no DATABASE_URL (Vercel build safety)
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn('[Prisma] DATABASE_URL not set — running in demo mode')
    return null as unknown as PrismaClient
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) globalForPrisma.prisma = prisma
