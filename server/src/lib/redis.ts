import Redis from 'ioredis';
import 'dotenv/config';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * General-purpose Redis client (commands, pub, etc.).
 */
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('[redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[redis] Connected successfully');
});

/**
 * Attempt to connect and verify the Redis connection.
 * Returns { ok: true } on success, or { ok: false, message } on failure.
 */
export async function connectRedis(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  try {
    await redis.connect();
    await redis.ping();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // If already connected, that's fine
    if (message.includes('already connected')) {
      return { ok: true };
    }
    return { ok: false, message };
  }
}

export default redis;
