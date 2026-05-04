import { cacheService } from './lib/cache';

async function run() {
  await cacheService.invalidatePattern(`shop_public_page_data:*`);
  await cacheService.invalidatePattern(`shop_layout:*`);
  await cacheService.invalidatePattern(`shop-template-content:*`);
  console.log('All public shop caches cleared.');
}

run().catch(console.error);
