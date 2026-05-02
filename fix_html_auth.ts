import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres.yjavfwugdkpghszspnrw:gadJur-tydvoj-8wymza@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
})

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
