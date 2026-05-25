import { prisma } from '../lib/prisma';

async function main() {
  console.log('Cleaning up existing Heritage Haircuts data...');
  const oldUsers = await prisma.user.findMany({ where: { OR: [{ email: { contains: 'heritagehaircuts.com' } }, { email: { startsWith: 'client' } }] } });
  for (const u of oldUsers) {
    if (u.shopId) await prisma.shop.delete({ where: { id: u.shopId } }).catch(() => {});
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  }
  
  console.log('Starting Heritage Haircuts Demo Seed...');

  // 1. Create Shop
  const shop = await prisma.shop.create({
    data: {
      name: 'Heritage Haircuts',
      description: 'Classic grooming for the modern gentleman.',
      slogan: 'Timeless style, modern precision.',
      template: 'modern',
      country: 'US',
      currency: 'USD',
      locale: 'en-US',
      paymentGateway: 'STRIPE',
      depositRequired: false,
      aiTokens: 500,
      customization: {
        theme: {
          primary: "#111827",
          secondary: "#ea580c",
          accent: "#f59e0b",
          background: "#ffffff"
        }
      }
    }
  });

  console.log(`Created Shop: ${shop.name} (${shop.id})`);

  // 2. Create Users (Admin, Staff, Renters, Clients)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@heritagehaircuts.com',
      name: 'Arthur Pendelton',
      role: 'SHOP_ADMIN',
      shopId: shop.id,
      phone: '+15550100001'
    }
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'john@heritagehaircuts.com',
      name: 'John "The Fade" Miller',
      role: 'STAFF',
      shopId: shop.id,
      phone: '+15550100002',
      workingHours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '19:00' },
        friday: { open: '09:00', close: '19:00' },
        saturday: { open: '10:00', close: '16:00' }
      }
    }
  });

  const renter1 = await prisma.user.create({
    data: {
      email: 'mike@heritagehaircuts.com',
      name: 'Mike (Booth Renter)',
      role: 'BOOTH_RENTER',
      shopId: shop.id,
      phone: '+15550100003',
      stripeConnectOnboarded: true,
      workingHours: {
        tuesday: { open: '10:00', close: '18:00' },
        wednesday: { open: '10:00', close: '18:00' },
        thursday: { open: '10:00', close: '18:00' },
        friday: { open: '10:00', close: '18:00' },
        saturday: { open: '09:00', close: '15:00' }
      }
    }
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'sarah@heritagehaircuts.com',
      name: 'Sarah "The Stylist" Lee',
      role: 'STAFF',
      shopId: shop.id,
      phone: '+15550100004',
      workingHours: {
        wednesday: { open: '10:00', close: '18:00' },
        thursday: { open: '10:00', close: '18:00' },
        friday: { open: '10:00', close: '19:00' },
        saturday: { open: '09:00', close: '17:00' }
      }
    }
  });

  const renter2 = await prisma.user.create({
    data: {
      email: 'dave@heritagehaircuts.com',
      name: 'Dave (Contractor)',
      role: 'BOOTH_RENTER',
      shopId: shop.id,
      phone: '+15550100005',
      stripeConnectOnboarded: true,
      workingHours: {
        monday: { open: '08:00', close: '14:00' },
        tuesday: { open: '08:00', close: '14:00' },
        wednesday: { open: '08:00', close: '14:00' },
        thursday: { open: '08:00', close: '14:00' },
        friday: { open: '08:00', close: '14:00' }
      }
    }
  });

  const allProviders = [staff1, staff2, renter1, renter2];

  // Clients
  const clientNames = ['James Smith', 'Robert Johnson', 'William Williams', 'David Brown', 'Richard Jones', 'Thomas Garcia', 'Charles Martinez', 'Joseph Robinson', 'Christopher Clark', 'Daniel Rodriguez'];
  const clients = [];
  
  for (let i = 0; i < clientNames.length; i++) {
    const client = await prisma.user.create({
      data: {
        email: `client${i}@example.com`,
        name: clientNames[i],
        role: 'CLIENT',
        phone: `+155502000${i.toString().padStart(2, '0')}`,
        shopId: shop.id,
        clientNotes: i % 3 === 0 ? 'Prefers a mid-skin fade.' : null
      }
    });
    clients.push(client);
  }

  console.log(`Created ${clients.length} clients and 3 staff members.`);

  // 3. Create Services
  const services = await Promise.all([
    prisma.service.create({
      data: { name: 'The Heritage Cut', description: 'Our signature tailored haircut.', price: 45, duration: 45, shopId: shop.id, isBookable: true }
    }),
    prisma.service.create({
      data: { name: 'Beard Trim & Line Up', description: 'Crisp lines and beard sculpting.', price: 25, duration: 30, shopId: shop.id, isBookable: true }
    }),
    prisma.service.create({
      data: { name: 'Hot Towel Shave', description: 'Traditional straight razor shave.', price: 35, duration: 45, shopId: shop.id, isBookable: true }
    }),
    prisma.service.create({
      data: { name: 'Buzz Cut', description: 'Simple, clean one-length clipper cut.', price: 20, duration: 15, shopId: shop.id, isBookable: true }
    })
  ]);

  console.log(`Created ${services.length} services.`);

  // 4. Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: { name: 'Matte Clay Pomade', price: 22, cost: 10, inventoryCount: 50, trackInventory: true, shopId: shop.id, type: 'RETAIL' }
    }),
    prisma.product.create({
      data: { name: 'Sandalwood Beard Oil', price: 18, cost: 8, inventoryCount: 30, trackInventory: true, shopId: shop.id, type: 'RETAIL' }
    }),
    prisma.product.create({
      data: { name: 'Sea Salt Texture Spray', price: 24, cost: 12, inventoryCount: 40, trackInventory: true, shopId: shop.id, type: 'RETAIL' }
    })
  ]);

  console.log(`Created ${products.length} retail products.`);

  // 5. Create Appointments (Past and Future)
  const now = new Date();
  
  // Helper to create date
  const createDate = (daysOffset: number, hours: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, 0, 0, 0);
    return d;
  };

  let apptCount = 0;

  // Past appointments (Completed)
  for (let i = -14; i < 0; i++) {
    // 2 appts per day
    for (let j = 0; j < 2; j++) {
      const client = clients[(Math.abs(i) + j) % clients.length];
      const service = services[j % services.length];
      const staff = allProviders[Math.floor(Math.random() * allProviders.length)];
      
      const startTime = createDate(i, 10 + j * 2); // 10 AM and 12 PM
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      await prisma.appointment.create({
        data: {
          startTime,
          endTime,
          status: 'COMPLETED',
          userId: client.id,
          staffId: staff.id,
          shopId: shop.id,
          serviceId: service.id,
          subtotal: service.price,
          totalAmount: service.price,
          items: {
            create: [{ name: service.name, price: service.price, quantity: 1, serviceId: service.id }]
          }
        }
      });
      apptCount++;
    }
  }

  // Future appointments (Scheduled)
  for (let i = 1; i <= 7; i++) {
    // 3 appts per day
    for (let j = 0; j < 3; j++) {
      const client = clients[(i + j) % clients.length];
      const service = services[(i + j) % services.length];
      const staff = allProviders[Math.floor(Math.random() * allProviders.length)];
      
      const startTime = createDate(i, 11 + j * 2); // 11 AM, 1 PM, 3 PM
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      await prisma.appointment.create({
        data: {
          startTime,
          endTime,
          status: 'SCHEDULED',
          userId: client.id,
          staffId: staff.id,
          shopId: shop.id,
          serviceId: service.id,
          subtotal: service.price,
          totalAmount: service.price,
          managementToken: Math.random().toString(36).substring(7),
          items: {
            create: [{ name: service.name, price: service.price, quantity: 1, serviceId: service.id }]
          }
        }
      });
      apptCount++;
    }
  }

  console.log(`Created ${apptCount} past and future appointments.`);

  // 6. Shop Usage Report (For Site Admin Dashboard)
  await prisma.shopUsageReport.create({
    data: {
      shopId: shop.id,
      period: new Date(),
      userCount: 4,
      appointmentCount: apptCount,
      productCount: products.length,
      serviceCount: services.length,
      formSubmissionCount: 0,
      portfolioImageCount: 5,
      clientHistoryImageCount: 0,
      clientFormulaCount: 0,
      reviewCount: 12,
      estimatedStorageMB: 45.2,
      suggestedMonthlyFeeUSD: 99.00,
      pricingTierName: 'Growth'
    }
  });

  console.log('Created Shop Usage Report.');

  console.log('\n--- SEED COMPLETE ---');
  console.log(`Login Email: admin@heritagehaircuts.com`);
  console.log(`Shop ID: ${shop.id}`);
  console.log('---------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
