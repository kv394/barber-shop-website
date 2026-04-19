const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://allowed-stag-73701.upstash.io',
  token: 'gQAAAAAAAR_lAAIncDJiNDNmZjRlYjVkNzU0ODc5OWVmZTRlMjg4YjI4NTZkZXAyNzM3MDE',
});

async function run() {
  try {
    await redis.set('test', '123');
    const val = await redis.get('test');
    console.log('Redis test:', val);
  } catch (err) {
    console.error('Redis error:', err);
  }
}
run();
