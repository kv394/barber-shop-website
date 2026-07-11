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
        description: 'Join our studio and experience world-class training in a supportive community environment.',
        timezone: 'America/New_York',
        currency: 'USD',
        shopType: 'PHYSICAL',
        industryType: 'DANCE_STUDIO',
        customization: {
          heroTitle: 'Discover the Dancer in You.',
          address: { street: '123 Main St', city: 'San Jose' }
        }
      }
    });
    console.log(`Created shop: ${shop.name}`);
  } else {
    // Update existing shop with customization data if missing
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        description: 'Join our studio and experience world-class training in a supportive community environment.',
        customization: {
          heroTitle: 'Discover the Dancer in You.',
          address: { street: '123 Main St', city: 'San Jose' }
        }
      }
    });
    console.log(`Shop already exists and was updated: ${shop.name}`);
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
    { name: 'Beginner Ballet', dropInPrice: 25, semesterPrice: 350, duration: 60, maxCapacity: 15, isGroupClass: true },
    { name: 'Hip Hop Fundamentals', dropInPrice: 20, semesterPrice: 300, duration: 45, maxCapacity: 20, isGroupClass: true },
    { name: 'Contemporary Dance', dropInPrice: 30, semesterPrice: 400, duration: 60, maxCapacity: 12, isGroupClass: true }
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { shopId: shop.id, name: service.name }
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          name: service.name,
          price: service.dropInPrice,
          dropInPrice: service.dropInPrice,
          semesterPrice: service.semesterPrice,
          duration: service.duration,
          maxCapacity: service.maxCapacity,
          isGroupClass: service.isGroupClass,
          shopId: shop.id,
          isBookable: true,
          type: 'CUSTOMER'
        }
      });
      console.log(`Created service/class: ${service.name}`);
    } else {
       await prisma.service.update({
        where: { id: existing.id },
        data: {
          dropInPrice: service.dropInPrice,
          semesterPrice: service.semesterPrice,
          maxCapacity: service.maxCapacity,
          isGroupClass: service.isGroupClass,
        }
      });
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
