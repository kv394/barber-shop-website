// Quick script to update the Luxury Nails shop's customization colors
// Run: node scripts/fix-nail-salon-colors.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the Luxury Nails shop
  const shop = await prisma.shop.findFirst({
    where: { name: { contains: 'Luxury Nails', mode: 'insensitive' } },
    select: { id: true, name: true, customization: true }
  });

  if (!shop) {
    console.error('Luxury Nails shop not found!');
    return;
  }

  console.log(`Found shop: ${shop.name} (ID: ${shop.id})`);
  console.log('Current customization:', JSON.stringify(shop.customization, null, 2));

  // Update customization with correct theme colors and fonts
  const currentCustom = (shop.customization || {});
  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: {
      customization: {
        ...currentCustom,
        primaryColor: '#D4849C',      // Rose pink (matches luxury-nails.html --rose-primary)
        secondaryColor: '#C9A96E',    // Gold (matches --gold)
        headingFont: 'Playfair Display',
        bodyFont: 'Lato',
        colorTheme: 'light',
      }
    }
  });

  console.log('✅ Updated Luxury Nails shop colors:');
  console.log('  primaryColor: #D4849C (rose)');
  console.log('  secondaryColor: #C9A96E (gold)');
  console.log('  headingFont: Playfair Display');
  console.log('  bodyFont: Lato');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
