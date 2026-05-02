import { prisma } from './lib/prisma';
import * as fs from 'fs';

async function run() {
  const html = fs.readFileSync('public/html-sections/SportClips.html', 'utf8');
  const shopId = 'cmn9kj24n0000lqzc7kcsmpst';
  
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  const customization = (shop?.customization as any) || {};
  
  await prisma.shop.update({
    where: { id: shopId },
    data: {
      customization: {
        ...customization,
        customHtml: html
      }
    }
  });
  console.log('Updated customHtml for shop', shopId);
}
run().catch(console.error);
