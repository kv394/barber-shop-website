const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function clearCache() {
  if (redisUrl && redisToken) {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    console.log('Clearing Redis cache...');
    await redis.flushdb();
    console.log('Redis cache cleared!');
  } else {
    console.log('No Redis config found.');
  }
}
clearCache();