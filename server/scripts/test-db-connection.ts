/**
 * scripts/test-db-connection.ts
 *
 * Validates database connectivity using the connectPrisma() helper.
 *
 * Usage:
 *   # Test with the real DATABASE_URL (should succeed if DB is up)
 *   pnpm tsx scripts/test-db-connection.ts
 *
 *   # Simulate a failure by overriding DATABASE_URL
 *   DATABASE_URL="postgresql://bad:bad@localhost:9999/nope" pnpm tsx scripts/test-db-connection.ts
 */

import 'dotenv/config';
import { connectPrisma, prisma } from '../src/lib/prisma.js';

async function main() {
  console.log('--- Database Connection Test ---\n');
  console.log(`DATABASE_URL: ${maskUrl(process.env.DATABASE_URL)}\n`);

  const result = await connectPrisma();

  if (result.ok) {
    console.log('[PASS] Successfully connected to the database.\n');

    // Run a quick schema sanity check – list public tables
    try {
      const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
        "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename",
      );
      console.log('Public tables:');
      for (const t of tables) {
        console.log(`  - ${t.tablename}`);
      }
    } catch (err) {
      console.warn('[WARN] Connected but could not list tables:', err);
    }
  } else {
    console.error(`[FAIL] Connection failed.`);
    console.error(`  Error type : ${result.errorType}`);
    console.error(`  Message    : ${result.message}`);
  }

  // Always disconnect cleanly
  await prisma.$disconnect();

  process.exit(result.ok ? 0 : 1);
}

/**
 * Masks the password portion of a connection string for safe logging.
 */
function maskUrl(url: string | undefined): string {
  if (!url) return '(not set)';
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return '(invalid URL)';
  }
}

main();
