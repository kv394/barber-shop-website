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
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
  const redis = getRedisClient();
  
  if (!redis) {
    return { success: true, remaining: limit };
  }

  try {
    const key = `ratelimit:${identifier}`;
    
    // Upstash provides a pipeline (multi/exec)
    const current = await redis.get<number>(key);
    
    if (current && current >= limit) {
      return { success: false, remaining: 0 };
    }

    const p = redis.pipeline();
    p.incr(key);
    
    if (!current) {
      p.expire(key, windowSeconds);
    }
    
    const results = await p.exec();
    
    // results[0] is the result of the first command (incr)
    const newValue = results ? (results[0] as number) : 1;

    return { 
      success: newValue <= limit, 
      remaining: Math.max(0, limit - newValue) 
    };
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    return { success: true, remaining: 1 };
  }
}
