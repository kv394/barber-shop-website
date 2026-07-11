import { prisma } from './lib/prisma';

async function main() {
  console.log('Seeding Dance School...');

  const shopName = 'Rhythm & Motion Dance Studio';
  const email = 'admin@rhythmdance.com';

  // Check if shop already exists
  let shop = await prisma.shop.findFirst({
    where: { name: shopName }
  });

  if (!shop) {
    shop = await prisma.shop.create({
      data: {
        name: shopName,
        companyName: shopName,
        timezone: 'America/New_York',
        currency: 'USD',
        shopType: 'PHYSICAL',
        industryType: 'DANCE_STUDIO'
      }
    });
    console.log(`Created shop: ${shop.name}`);
  } else {
    console.log(`Shop already exists: ${shop.name}`);
  }

  // Create admin user
  let admin = await prisma.user.findFirst({
    where: { email }
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Jane Doe',
        email,
        role: 'SHOP_ADMIN',
        shopId: shop.id,
      }
    });
    console.log(`Created admin user: ${admin.email}`);
  } else {
    console.log(`Admin user already exists: ${admin.email}`);
  }

  // Grant admin access explicitly via ShopAccess
  const access = await prisma.shopAccess.findFirst({
    where: { userId: admin.id, shopId: shop.id }
  });

  if (!access) {
    await prisma.shopAccess.create({
      data: {
        userId: admin.id,
        shopId: shop.id,
        role: 'SHOP_ADMIN',
      },
    });
  }

  // Create some classes (Services)
  const services = [
    { name: 'Beginner Ballet', price: 25, duration: 60 },
    { name: 'Hip Hop Fundamentals', price: 20, duration: 45 },
    { name: 'Contemporary Dance', price: 30, duration: 60 }
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { shopId: shop.id, name: service.name }
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          name: service.name,
          price: service.price,
          duration: service.duration,
          shopId: shop.id,
          isBookable: true,
          type: 'CUSTOMER'
        }
      });
      console.log(`Created service/class: ${service.name}`);
    }
  }

  console.log('Seed completed successfully!');
  console.log('Login Email: ' + email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
