import { PrismaClient } from '@prisma/client';

const SUPABASE_DATABASE_URL =
  "postgresql://postgres.zksmzotvrdqphrtperbk:CapsuleDB2026SecureKey@15.164.120.176:5432/postgres?sslmode=require";

// Ensure DATABASE_URL is never empty string or invalid on serverless deployments (e.g. Vercel)
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '' || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = SUPABASE_DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
