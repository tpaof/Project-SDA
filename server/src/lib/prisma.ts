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

/**
 * Classifies a database connection error into a human-readable category.
 */
function classifyConnectionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string }).code;

  // PostgreSQL / pg error codes
  if (code === 'ECONNREFUSED' || message.includes('ECONNREFUSED')) {
    return 'DATABASE_UNREACHABLE';
  }
  if (code === 'ENOTFOUND' || message.includes('ENOTFOUND')) {
    return 'DATABASE_HOST_NOT_FOUND';
  }
  if (code === 'ETIMEDOUT' || message.includes('ETIMEDOUT') || message.includes('timeout')) {
    return 'DATABASE_TIMEOUT';
  }
  if (
    code === '28P01' ||
    code === '28000' ||
    message.includes('password authentication failed') ||
    message.includes('authentication failed')
  ) {
    return 'DATABASE_AUTH_FAILURE';
  }
  if (message.includes('SSL') || message.includes('ssl')) {
    return 'DATABASE_SSL_ERROR';
  }

  return 'DATABASE_UNKNOWN_ERROR';
}

/**
 * Attempts to connect to the database and run a lightweight query.
 * Returns `{ ok: true }` on success, or `{ ok: false, errorType, message }` on failure.
 * Never throws – safe to call without crashing the process.
 */
export async function connectPrisma(): Promise<
  | { ok: true }
  | { ok: false; errorType: string; message: string }
> {
  try {
    // Lightweight connectivity check
    await prisma.$queryRawUnsafe('SELECT 1');
    return { ok: true };
  } catch (error: unknown) {
    const errorType = classifyConnectionError(error);
    const rawMessage = error instanceof Error ? error.message : String(error);

    const friendlyMessages: Record<string, string> = {
      DATABASE_UNREACHABLE:
        'Could not reach the database server. Ensure PostgreSQL is running and the host/port in DATABASE_URL are correct.',
      DATABASE_HOST_NOT_FOUND:
        'The database host could not be resolved. Check the hostname in DATABASE_URL.',
      DATABASE_TIMEOUT:
        'The database connection timed out. The server may be overloaded or a firewall is blocking the connection.',
      DATABASE_AUTH_FAILURE:
        'Authentication failed. Verify the username and password in DATABASE_URL.',
      DATABASE_SSL_ERROR:
        'SSL negotiation failed. Check your SSL configuration and DATABASE_URL parameters.',
      DATABASE_UNKNOWN_ERROR:
        `An unexpected database error occurred: ${rawMessage}`,
    };

    const friendlyMessage = friendlyMessages[errorType] ?? friendlyMessages.DATABASE_UNKNOWN_ERROR;

    console.error(`[prisma] Connection error (${errorType}): ${friendlyMessage}`);

    return { ok: false, errorType, message: friendlyMessage };
  }
}

export default prisma;
