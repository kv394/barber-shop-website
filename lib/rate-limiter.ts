import Redis from 'ioredis';

// Create a singleton Redis instance for rate limiting
let redisClient: Redis | null = null;

export function getRedisClient() {
  if (!redisClient) {
    // Only initialize if Redis URL is available.
    // Fallback to null (in-memory limiting could be added for local dev, but Redis is standard for Prod)
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL);
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
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  
  // If Redis is not configured, bypass rate limiting (useful for local dev without Docker)
  if (!redis) {
    return { success: true, remaining: limit };
  }

  try {
    const key = `ratelimit:${identifier}`;
    
    // Multi/Exec ensures these commands are run atomically
    const current = await redis.get(key);
    
    if (current && parseInt(current, 10) >= limit) {
      return { success: false, remaining: 0 };
    }

    const multi = redis.multi();
    multi.incr(key);
    
    // If the key didn't exist (it was just created by incr), set an expiration
    if (!current) {
      multi.expire(key, windowSeconds);
    }
    
    const results = await multi.exec();
    // In ioredis, multi.exec() returns an array of [error, result] tuples.
    // The first command was INCR, so results[0][1] holds the new value.
    const newValue = results ? results[0][1] as number : 1;

    return { 
      success: newValue <= limit, 
      remaining: Math.max(0, limit - newValue) 
    };
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Fail open: if Redis crashes, don't break the application, just allow the request
    return { success: true, remaining: 1 };
  }
}
