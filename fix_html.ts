import { prisma } from './lib/prisma';
import fs from 'fs';

async function main() {
  const htmlContent = fs.readFileSync('public/html-sections/SportClips.html', 'utf8');
  
  const shop = await prisma.shop.findFirst({
    where: { id: 'cmn9kj24n0000lqzc7kcsmpst' } // Missouri City / Heritage Haircuts
  });
  
  if (shop && shop.customization) {
    let custom: any = shop.customization;
    custom.customHtml = htmlContent;
    
    await prisma.shop.update({
      where: { id: shop.id },
      data: { customization: custom }
    });
    console.log("Successfully updated shop customHtml in DB");
  }
}

main().catch(console.error);
