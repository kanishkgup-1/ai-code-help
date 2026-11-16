import redis from "../config/redis.js";
import env from "../config/env.js";

const DEFAULT_COOLDOWN_SECONDS = env.replaceCooldownSeconds || 120;

const memoryFallback = new Map();

/**
 * Gets remaining cooldown seconds for a user.
 * @param {string} userId
 * @returns {Promise<number>} Remaining seconds (0 if not on cooldown)
 */
export async function getReplaceCooldown(userId) {
  if (!userId) return 0;
  const key = `cooldown:replace:${userId}`;

  try {
    if (redis.status === "ready") {
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        return ttl;
      }
      if (ttl === -2) {
        return 0;
      }
    }
  } catch (error) {
    console.warn("Redis cooldown query failed, checking memory fallback:", error.message);
  }

  const expiresAt = memoryFallback.get(key);
  if (expiresAt) {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs > 0) {
      return Math.ceil(remainingMs / 1000);
    }
    memoryFallback.delete(key);
  }
  return 0;
}

/**
 * Sets cooldown for a user in Redis (and memory fallback).
 * @param {string} userId
 * @param {number} [durationSeconds]
 * @returns {Promise<number>} Cooldown duration set in seconds
 */
export async function setReplaceCooldown(userId, durationSeconds = DEFAULT_COOLDOWN_SECONDS) {
  if (!userId) return durationSeconds;
  const key = `cooldown:replace:${userId}`;

  try {
    if (redis.status === "ready") {
      await redis.set(key, "1", "EX", durationSeconds);
    }
  } catch (error) {
    console.warn("Redis cooldown set failed, setting memory fallback:", error.message);
  }

  memoryFallback.set(key, Date.now() + durationSeconds * 1000);
  return durationSeconds;
}
