import { Redis } from '@upstash/redis';

// Create a singleton Redis instance for rate limiting
let redisClient: Redis | null = null;

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function getRedisClient() {
  if (!redisClient) {
    if (redisUrl && redisToken) {
      try {
        redisClient = new Redis({
          url: redisUrl,
          token: redisToken,
        });
      } catch (err) {
        console.error('Failed to initialize Upstash Redis client for rate limiting:', err);
      }
    }
  }
  return redisClient;
}

/**
 * Basic Token Bucket / Fixed Window rate limiter using Redis.
 *
 * @param identifier - A unique string for the user/IP (e.g., 'booking:192.168.1.1')
 * @param limit - Maximum number of requests allowed in the window
 * @param windowSeconds - The time window in seconds
 * @returns { success: boolean; remaining: number }
 */
export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60,
  failClosed: boolean = false
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  
  if (!redis) {
    const isCritical = failClosed || ['totp', 'booking', 'auth', 'waitlist', 'review'].some(k => identifier.includes(k));
    // When failClosed is true (auth-critical paths), deny requests if Redis is unavailable
    return isCritical
      ? { success: false, remaining: 0 }
      : { success: true, remaining: limit };
  }

  try {
    const key = `ratelimit:${identifier}`;
    
    // Atomic: INCR creates the key if it doesn't exist and returns the new count
    const count = await redis.incr(key);
    
    // Only set expiry on the first request in the window (count === 1 means new key)
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return { 
      success: count <= limit, 
      remaining: Math.max(0, limit - count) 
    };
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // When failClosed is true (auth-critical paths), deny requests on Redis errors
    return failClosed
      ? { success: false, remaining: 0 }
      : { success: true, remaining: 1 };
  }
}
