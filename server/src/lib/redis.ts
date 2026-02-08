import RedisPkg from "ioredis";
import "dotenv/config";

const Redis = RedisPkg.default ?? (RedisPkg as any);

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});


redis.on('error', (err: Error) => {
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
