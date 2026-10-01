import Redis from "ioredis";
import { env } from "../config/env";

export let isRedisConnected = false;

const options = {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false,
  commandTimeout: 500,
  retryStrategy(times: number) {
    return null; // Stop retrying if unavailable in standalone mode
  },
};

export const redis = new Redis(env.REDIS_URL, options);
export const redisSub = new Redis(env.REDIS_URL, options);

redis.on("error", (err) => {
  if (isRedisConnected) {
    console.error("Redis Connection Error:", err.message);
  }
});

redisSub.on("error", (err) => {
  if (isRedisConnected) {
    console.error("Redis Subscriber Error:", err.message);
  }
});

export async function connectRedis() {
  try {
    if (redis.status === "wait") await redis.connect();
    if (redisSub.status === "wait") await redisSub.connect();
    isRedisConnected = true;
    console.log("✅ Redis connected successfully");
  } catch (err: any) {
    isRedisConnected = false;
    console.warn("⚠️ Redis not connected (running in standalone mode):", err.message);
  }
}
