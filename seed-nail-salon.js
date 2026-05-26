const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mock Nail Salon...');

  // 1. Create Shop
  const shop = await prisma.shop.create({
    data: {
      name: 'Luxury Nails & Spa',
      description: 'Premium nail and beauty services in a relaxing environment.',
      country: 'US',
      currency: 'USD',
      locale: 'en-US',
      paymentGateway: 'STRIPE',
      timezone: 'America/New_York',
    },
  });
  console.log(`Created shop: ${shop.name} (ID: ${shop.id})`);

  // 2. Create Users (Admin, Staff, Clients)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@luxurynails.com',
      name: 'Admin Manager',
      role: 'SHOP_ADMIN',
      shopId: shop.id,
      barcode: 'NAIL-ADMIN-1',
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'anna@luxurynails.com',
      name: 'Anna Nguyen',
      role: 'STAFF',
      shopId: shop.id,
      barcode: 'NAIL-STAFF-1',
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'bella@luxurynails.com',
      name: 'Bella Tran',
      role: 'STAFF',
      shopId: shop.id,
      barcode: 'NAIL-STAFF-2',
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: 'jane.doe@example.com',
      name: 'Jane Doe',
      role: 'CLIENT',
      shopId: shop.id,
      phone: '555-0101',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'emily.smith@example.com',
      name: 'Emily Smith',
      role: 'CLIENT',
      shopId: shop.id,
      phone: '555-0102',
    },
  });

  const client3 = await prisma.user.create({
    data: {
      email: 'sarah.connor@example.com',
      name: 'Sarah Connor',
      role: 'CLIENT',
      shopId: shop.id,
      phone: '555-0103',
    },
  });

  const client4 = await prisma.user.create({
    data: {
      email: 'mike.ross@example.com',
      name: 'Mike Ross',
      role: 'CLIENT',
      shopId: shop.id,
      phone: '555-0104',
    },
  });

  const client5 = await prisma.user.create({
    data: {
      email: 'rachel.zane@example.com',
      name: 'Rachel Zane',
      role: 'CLIENT',
      shopId: shop.id,
      phone: '555-0105',
    },
  });
  console.log('Created admin, staff, and clients.');

  // Grant admin access explicitly via ShopAccess
  await prisma.shopAccess.create({
    data: {
      userId: admin.id,
      shopId: shop.id,
      role: 'SHOP_ADMIN',
    },
  });

  // 3. Create Services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Classic Manicure',
        description: 'Nail shaping, cuticle care, hand massage, and polish.',
        price: 35.0,
        duration: 45,
        type: 'CUSTOMER',
        shopId: shop.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Spa Pedicure',
        description: 'Foot soak, scrub, nail shaping, cuticle care, massage, and polish.',
        price: 55.0,
        duration: 60,
        type: 'CUSTOMER',
        shopId: shop.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Acrylic Full Set',
        description: 'Full set of acrylic nail enhancements with gel polish.',
        price: 75.0,
        duration: 90,
        type: 'CUSTOMER',
        shopId: shop.id,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Gel Polish Change',
        description: 'Removal of old gel and application of new gel polish.',
        price: 30.0,
        duration: 30,
        type: 'CUSTOMER',
        shopId: shop.id,
      },
    })
  ]);
  console.log('Created services.');

  // 4. Create Products
  await Promise.all([
    prisma.product.create({
      data: {
        name: 'Premium Cuticle Oil',
        description: 'Nourishing oil for healthy cuticles.',
        price: 15.0,
        cost: 5.0,
        trackInventory: true,
        inventoryCount: 20,
        type: 'RETAIL',
        shopId: shop.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lavender Hand Lotion',
        description: 'Soothing lotion for dry hands.',
        price: 25.0,
        cost: 10.0,
        trackInventory: true,
        inventoryCount: 15,
        type: 'RETAIL',
        shopId: shop.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'OPI Gel Color Base Coat',
        description: 'Base coat for gel polish.',
        price: 20.0,
        cost: 12.0,
        trackInventory: true,
        inventoryCount: 10,
        type: 'BACKBAR',
        shopId: shop.id,
      },
    })
  ]);
  console.log('Created products.');

  // 5. Create some appointments
  const now = new Date();
  
  const appt1Start = new Date(now);
  appt1Start.setHours(10, 0, 0, 0);
  appt1Start.setDate(appt1Start.getDate() + 1); // Tomorrow 10 AM
  const appt1End = new Date(appt1Start);
  appt1End.setMinutes(appt1End.getMinutes() + 45); // 45 min duration

  await prisma.appointment.create({
    data: {
      startTime: appt1Start,
      endTime: appt1End,
      serviceId: services[0].id, // Classic Manicure
      userId: client1.id,
      staffId: staff1.id,
      shopId: shop.id,
      status: 'SCHEDULED',
      totalAmount: 35.0,
      subtotal: 35.0,
    },
  });

  const appt2Start = new Date(now);
  appt2Start.setHours(14, 0, 0, 0);
  appt2Start.setDate(appt2Start.getDate() + 2); // Day after tomorrow 2 PM
  const appt2End = new Date(appt2Start);
  appt2End.setMinutes(appt2End.getMinutes() + 90); // 90 min duration

  await prisma.appointment.create({
    data: {
      startTime: appt2Start,
      endTime: appt2End,
      serviceId: services[2].id, // Acrylic Full Set
      userId: client2.id,
      staffId: staff2.id,
      shopId: shop.id,
      status: 'SCHEDULED',
      totalAmount: 75.0,
      subtotal: 75.0,
    },
  });
  console.log('Created appointments.');

  // 6. Create Referrals
  await Promise.all([
    prisma.referral.create({
      data: {
        shopId: shop.id,
        referrerId: client1.id,
        refereeId: client3.id,
        status: 'COMPLETED',
        referrerRewardPoints: 50,
        refereeRewardPoints: 25,
      }
    }),
    prisma.referral.create({
      data: {
        shopId: shop.id,
        referrerId: client1.id,
        refereeId: client4.id,
        status: 'PENDING',
        referrerRewardPoints: 50,
        refereeRewardPoints: 25,
      }
    }),
    prisma.referral.create({
      data: {
        shopId: shop.id,
        referrerId: client2.id,
        refereeId: client5.id,
        status: 'COMPLETED',
        referrerRewardPoints: 100,
        refereeRewardPoints: 50,
      }
    })
  ]);
  console.log('Created referrals.');

  console.log('Mock seeding complete! ✅');
  console.log(`Login as Admin: admin@luxurynails.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
