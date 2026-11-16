import Redis from "ioredis";
import env from "./env.js";

let redisClient = null;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 10) {
          return 5000;
        }
        return Math.min(times * 500, 2000);
      }
    });

    redisClient.on("connect", () => {
      console.log("Connected to Redis.");
    });

    redisClient.on("error", (err) => {
      console.warn("Redis client warning:", err?.message || err?.code || String(err));
    });
  }

  return redisClient;
}

export default getRedisClient();
