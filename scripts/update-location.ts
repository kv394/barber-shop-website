import { prisma } from '../lib/prisma';

async function main() {
  const shops = await prisma.shop.findMany({
    where: { name: 'Heritage Haircuts' }
  });
  
  console.log('Found shops:', shops.map((s: any) => ({ id: s.id, name: s.name, companyName: s.companyName })));
  
  for (const shop of shops) {
    if (!shop.companyName) {
      console.log(`Setting companyName for ${shop.id} to Heritage Haircuts`);
    }
    
    // We only want to rename the specific one if there are multiple.
    // If it's literally named "Heritage Haircuts", let's update it to "Missouri City"
    // and make sure its companyName is "Heritage Haircuts"
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name: 'Missouri City',
        companyName: 'Heritage Haircuts'
      }
    });
    console.log(`Updated shop ${shop.id} to Missouri City`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
