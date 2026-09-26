import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL;

  // On Vercel serverless environments, the filesystem outside /tmp is read-only.
  // We copy the seeded dev.db to /tmp/dev.db so SQLite can write locks and journals.
  if (process.env.VERCEL) {
    const isRemoteDb = dbUrl && (dbUrl.startsWith('postgres') || dbUrl.startsWith('mysql') || dbUrl.startsWith('prisma') || dbUrl.startsWith('libsql'));

    if (!isRemoteDb) {
      const tmpDbPath = path.join('/tmp', 'dev.db');

      const candidatePaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.join(__dirname, '..', '..', 'prisma', 'dev.db'),
        path.join(__dirname, '..', '..', 'dev.db'),
      ];

      const sourcePath = candidatePaths.find(p => fs.existsSync(p));

      if (!fs.existsSync(tmpDbPath)) {
        if (sourcePath) {
          try {
            fs.copyFileSync(sourcePath, tmpDbPath);
            console.log(`[Prisma/Vercel] Successfully initialized SQLite db at ${tmpDbPath} from ${sourcePath}`);
          } catch (err) {
            console.error('[Prisma/Vercel] Error copying dev.db to /tmp:', err);
          }
        } else {
          console.warn('[Prisma/Vercel] Warning: Source SQLite database not found in:', candidatePaths);
        }
      }

      dbUrl = `file:${tmpDbPath}`;
    }
  }

  return new PrismaClient({
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
