import Redis from 'ioredis';
import { logger } from './logger';

// Initialize Redis connection only if REDIS_URL is provided in the environment
const redisUrl = process.env.REDIS_URL;

class CacheService {
  private redis: Redis | null = null;

  constructor() {
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn('Redis reconnection failed after 3 times.');
            return null;
          }
          return Math.min(times * 50, 2000);
        },
      });

      this.redis.on('error', (err) => {
        logger.error('Redis client error:', err);
      });
    }
  }

  /**
   * Get a cached value, or compute it and cache it.
   * @param key The cache key
   * @param fetcher Function to fetch data if cache miss
   * @param ttlSeconds Time-to-live in seconds (default 300s = 5m)
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    if (!this.redis) {
      // If Redis is not configured, fall back to direct fetch
      return await fetcher();
    }

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      logger.warn(`Redis GET failed for key: ${key}`, err);
    }

    // Cache miss or failure, fetch fresh data
    const data = await fetcher();

    try {
      if (data !== undefined && data !== null) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
      }
    } catch (err) {
      logger.warn(`Redis SET failed for key: ${key}`, err);
    }

    return data;
  }

  /**
   * Invalidate a specific cache key
   */
  async invalidate(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (err) {
      logger.warn(`Redis DEL failed for key: ${key}`, err);
    }
  }

  /**
   * Invalidate all keys matching a pattern (Warning: O(N) operation, use carefully)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.redis) return;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (err) {
      logger.warn(`Redis pattern literal invalidation failed: ${pattern}`, err);
    }
  }
}

export const cacheService = new CacheService();

