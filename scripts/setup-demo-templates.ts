#!/usr/bin/env npx tsx
/**
 * Update ALL Heritage Haircuts and Luxury Nails shops to template=custom.
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const allShops = await prisma.shop.findMany({
    select: { id: true, name: true, template: true, customization: true },
  });
  console.log('All shops:');
  allShops.forEach((s: any) => console.log(`  ${s.name} (${s.id}) template=${s.template}`));

  // Update ALL "Heritage Haircuts" shops
  const heritageHtml = readFileSync(join(process.cwd(), 'public/html-sections/heritage-haircuts.html'), 'utf-8');
  const heritageShops = allShops.filter((s: any) => s.name.toLowerCase().includes('heritage'));
  
  for (const shop of heritageShops) {
    const currentCustomization = (shop.customization as any) || {};
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        template: 'custom',
        customization: { ...currentCustomization, customHtml: heritageHtml },
      },
    });
    console.log(`✅ Updated Heritage: ${shop.id} → template=custom (${heritageHtml.length} chars)`);
  }

  // Update ALL "Luxury Nails" shops
  const nailsHtml = readFileSync(join(process.cwd(), 'public/html-sections/luxury-nails.html'), 'utf-8');
  const nailsShops = allShops.filter((s: any) => s.name.toLowerCase().includes('luxury nails'));
  
  for (const shop of nailsShops) {
    const currentCustomization = (shop.customization as any) || {};
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        template: 'custom',
        customization: { ...currentCustomization, customHtml: nailsHtml },
      },
    });
    console.log(`✅ Updated Nails: ${shop.id} → template=custom (${nailsHtml.length} chars)`);
  }

  // Also invalidate all caches
  const { cacheService } = await import('../lib/cache');
  await cacheService.invalidate('shop_public_page_data:heritage-haircuts');
  await cacheService.invalidate('shop_public_page_data:luxury-nails');
  await cacheService.invalidate('shop_public_page_data:luxury-nails--spa');
  console.log('\n✅ Caches invalidated');
  console.log('🎉 All done!');
}

main()
  .catch(e => { console.error('Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
