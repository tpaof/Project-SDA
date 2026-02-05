import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

// PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new AppError(500, 'FATAL: DATABASE_URL environment variable is not defined.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prisma client singleton for development hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires adapter for local PostgreSQL
// Workaround for Prisma 7 adapter typing issues
const adapterOptions = {
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
} as unknown as ConstructorParameters<typeof PrismaClient>[0];

export const prisma = globalForPrisma.prisma ?? new PrismaClient(adapterOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
