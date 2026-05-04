import { cacheService } from './lib/cache';

async function run() {
  const shopId = 'cmn9kj24n0000lqzc7kcsmpst';
  await cacheService.invalidate(`shop_public_page_data:${shopId}`);
  console.log('Cache cleared for shop:', shopId);
}

run().catch(console.error);