import * as IORedis from "ioredis";
import "dotenv/config";

// NodeNext/ESM: ioredis default export is not typed as constructable; extract constructor
const Redis = ((IORedis as any).default ?? IORedis) as new (url: string, opts?: object) => import("ioredis").Redis;

// REDIS_URL takes precedence; otherwise build from REDIS_HOST + REDIS_PORT (Docker uses host name, not localhost)
const REDIS_URL =
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`;

const MAX_RETRIES = 20;
let lastErrorLog = 0;
const ERROR_LOG_THROTTLE_MS = 5000;

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  retryStrategy(times: number) {
    if (times > MAX_RETRIES) return null;
    return Math.min(times * 500, 3000);
  },
  lazyConnect: true,
  enableReadyCheck: true,
  enableOfflineQueue: false,
});

redis.on("error", (err: Error) => {
  const now = Date.now();
  if (now - lastErrorLog > ERROR_LOG_THROTTLE_MS) {
    lastErrorLog = now;
    console.error("[redis] Connection error:", err.message);
  }
});

redis.on("connect", () => {
  lastErrorLog = 0;
  console.log("[redis] Connected successfully");
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
    if (message.includes("already connected")) return { ok: true };
    return { ok: false, message };
  }
}

export default redis;
