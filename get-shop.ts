import { prisma } from './lib/prisma';
async function run() {
  const shop = await prisma.shop.findFirst({ where: { slug: 'missouri-city' } });
  if (!shop) { console.log('Shop not found'); return; }
  console.log('Shop ID:', shop.id);
  const custStr = JSON.stringify(shop.customization || {});
  console.log('Customization size:', custStr.length);
  // See if there's a specific large field
  const c = shop.customization as any;
  for (const key in c) {
    console.log(`Key ${key} size:`, JSON.stringify(c[key] || {}).length);
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
