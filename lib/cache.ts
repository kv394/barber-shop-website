import { Redis } from '@upstash/redis';
import { logger } from './logger';

// Initialize Upstash Redis connection only if URL and TOKEN are provided
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

class CacheService {
  private redis: Redis | null = null;

  constructor() {
    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
      } catch (err) {
        logger.error('Failed to initialize Upstash Redis client:', err);
      }
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
      const cached = await this.redis.get<T>(key);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn(`Redis GET failed for key: ${key}`, err);
    }

    // Cache miss or failure, fetch fresh data
    const data = await fetcher();

    try {
      if (data !== undefined && data !== null) {
        await this.redis.set(key, data, { ex: ttlSeconds });
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
      // Upstash Redis provides `keys` command
      const keys = await this.redis.keys(pattern);
      if (keys && keys.length > 0) {
        // Upstash del takes multiple keys as spread
        await this.redis.del(...keys);
      }
    } catch (err) {
      logger.warn(`Redis pattern literal invalidation failed: ${pattern}`, err);
    }
  }
}

export const cacheService = new CacheService();

