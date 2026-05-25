import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- STARTING FULL HERITAGE HAIRCUTS SEED ---');
  
  // 1. HARD CLEANUP
  console.log('Orphaning old demo data to free up emails...');
  const oldUsers = await prisma.user.findMany({ where: { email: { contains: 'heritagehaircuts.com' } } });
  for (const u of oldUsers) {
    await prisma.user.update({
      where: { id: u.id },
      data: { email: `archived_${Date.now()}_${u.id}@example.com` }
    }).catch(() => {});
  }
  
  const oldClients = await prisma.user.findMany({ where: { email: { startsWith: 'client' }, role: 'CLIENT' } });
  for (const c of oldClients) {
    await prisma.user.update({
      where: { id: c.id },
      data: { email: `archived_client_${Date.now()}_${c.id}@example.com` }
    }).catch(() => {});
  }

  // 2. CREATE SHOP
  console.log('Creating Shop...');
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

  // 3. CREATE USERS
  console.log('Creating Users...');
  const admin = await prisma.user.create({
    data: { email: 'admin@heritagehaircuts.com', name: 'Arthur Pendelton', role: 'SHOP_ADMIN', shopId: shop.id, phone: '+15550100001' }
  });

  const staff1 = await prisma.user.create({
    data: { email: 'john@heritagehaircuts.com', name: 'John "The Fade" Miller', role: 'STAFF', shopId: shop.id, phone: '+15550100002', workingHours: { monday: { open: '07:00', close: '15:00' }, tuesday: { open: '07:00', close: '15:00' }, wednesday: { open: '07:00', close: '15:00' }, thursday: { open: '07:00', close: '15:00' }, friday: { open: '07:00', close: '15:00' } } }
  });

  const staff2 = await prisma.user.create({
    data: { email: 'sarah@heritagehaircuts.com', name: 'Sarah "The Stylist" Lee', role: 'STAFF', shopId: shop.id, phone: '+15550100004', workingHours: { wednesday: { open: '12:00', close: '20:00' }, thursday: { open: '12:00', close: '20:00' }, friday: { open: '12:00', close: '20:00' }, saturday: { open: '09:00', close: '17:00' }, sunday: { open: '10:00', close: '16:00' } } }
  });

  const renter1 = await prisma.user.create({
    data: { email: 'mike@heritagehaircuts.com', name: 'Mike (Booth Renter)', role: 'BOOTH_RENTER', shopId: shop.id, phone: '+15550100003', stripeConnectOnboarded: true, workingHours: { tuesday: { open: '09:00', close: '13:00' }, wednesday: { open: '09:00', close: '18:00' }, thursday: { open: '09:00', close: '18:00' }, friday: { open: '09:00', close: '18:00' }, saturday: { open: '09:00', close: '18:00' } } }
  });

  const renter2 = await prisma.user.create({
    data: { email: 'dave@heritagehaircuts.com', name: 'Dave (Contractor)', role: 'BOOTH_RENTER', shopId: shop.id, phone: '+15550100005', stripeConnectOnboarded: true, workingHours: { monday: { open: '12:00', close: '20:00' }, tuesday: { open: '12:00', close: '20:00' }, wednesday: { open: '12:00', close: '20:00' }, thursday: { open: '12:00', close: '20:00' }, friday: { open: '12:00', close: '20:00' } } }
  });

  const allProviders = [staff1, staff2, renter1, renter2];

  // Clients
  const clientNames = ['James Smith', 'Robert Johnson', 'William Williams', 'David Brown', 'Richard Jones', 'Thomas Garcia', 'Charles Martinez', 'Joseph Robinson', 'Christopher Clark', 'Daniel Rodriguez'];
  const clients = [];
  for (let i = 0; i < clientNames.length; i++) {
    const client = await prisma.user.create({
      data: { email: `client${i}@example.com`, name: clientNames[i], role: 'CLIENT', phone: `+155502000${i.toString().padStart(2, '0')}`, shopId: shop.id, clientNotes: i % 3 === 0 ? 'Prefers a mid-skin fade.' : null }
    });
    clients.push(client);
  }

  // 4. CREATE ADVANCED SERVICES
  console.log('Creating Services...');
  const services = await Promise.all([
    prisma.service.create({ data: { name: 'The Heritage Signature Fade', description: 'Our premium signature fade with hot towel finish.', price: 55, duration: 45, shopId: shop.id, isBookable: true } }),
    prisma.service.create({ data: { name: 'Classic Gentleman\'s Cut', description: 'Timeless scissor cut and styling.', price: 45, duration: 30, shopId: shop.id, isBookable: true } }),
    prisma.service.create({ data: { name: 'Hot Towel Straight Razor Shave', description: 'Traditional hot lather straight razor shave.', price: 40, duration: 45, shopId: shop.id, isBookable: true } }),
    prisma.service.create({ data: { name: 'Beard Sculpting & Line Up', description: 'Detailed beard shaping and crisp line up.', price: 30, duration: 30, shopId: shop.id, isBookable: true } }),
    prisma.service.create({ data: { name: 'Kids Cut', description: 'Precision cut for the young gentlemen (Under 12).', price: 25, duration: 30, shopId: shop.id, isBookable: true } }),
    prisma.service.create({ data: { name: 'The Works', description: 'Haircut, Beard Sculpt, Straight Razor Shave, and Wash.', price: 90, duration: 90, shopId: shop.id, isBookable: true } })
  ]);

  // 5. CREATE PRODUCTS & MAPPINGS
  console.log('Creating Products & Mappings...');
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Matte Clay', description: 'High hold, matte finish clay.', price: 22, cost: 10, type: 'RETAIL', inventoryCount: 45, trackInventory: true, reorderPoint: 10, shopId: shop.id } }),
    prisma.product.create({ data: { name: 'Sandalwood Beard Oil', description: 'Nourishing organic beard oil.', price: 18, cost: 8, type: 'RETAIL', inventoryCount: 30, trackInventory: true, reorderPoint: 10, shopId: shop.id } }),
    prisma.product.create({ data: { name: 'Premium Shave Gel', description: 'Professional glide shave gel.', price: 0, cost: 15, type: 'BACKBAR', inventoryCount: 8, trackInventory: true, reorderPoint: 3, shopId: shop.id } }),
    prisma.product.create({ data: { name: 'Cooling Aftershave', description: 'Post-shave soothing balm.', price: 0, cost: 12, type: 'BACKBAR', inventoryCount: 5, trackInventory: true, reorderPoint: 2, shopId: shop.id } })
  ]);

  const shaveGel = products.find(p => p.name === 'Premium Shave Gel')!;
  const aftershave = products.find(p => p.name === 'Cooling Aftershave')!;
  const straightShaveService = services.find(s => s.name === 'Hot Towel Straight Razor Shave')!;
  const theWorksService = services.find(s => s.name === 'The Works')!;

  await prisma.serviceProductUsage.createMany({
    data: [
      { serviceId: straightShaveService.id, productId: shaveGel.id, servicesPerProduct: 20, currentServiceCount: 12 },
      { serviceId: straightShaveService.id, productId: aftershave.id, servicesPerProduct: 40, currentServiceCount: 18 },
      { serviceId: theWorksService.id, productId: shaveGel.id, servicesPerProduct: 20, currentServiceCount: 5 },
      { serviceId: theWorksService.id, productId: aftershave.id, servicesPerProduct: 40, currentServiceCount: 5 },
    ]
  });

  // 6. APPOINTMENTS
  console.log('Creating Appointments...');
  const now = new Date();
  const createDate = (daysOffset: number, hours: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, 0, 0, 0);
    return d;
  };

  let apptCount = 0;
  // Past
  for (let i = -14; i < 0; i++) {
    for (let j = 0; j < 3; j++) {
      const client = clients[(Math.abs(i) + j) % clients.length];
      const service = services[j % services.length];
      const staff = allProviders[Math.floor(Math.random() * allProviders.length)];
      const startTime = createDate(i, 10 + j * 2); 
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      await prisma.appointment.create({
        data: { startTime, endTime, status: 'COMPLETED', userId: client.id, staffId: staff.id, shopId: shop.id, serviceId: service.id, subtotal: service.price, totalAmount: service.price, items: { create: [{ name: service.name, price: service.price, quantity: 1, serviceId: service.id }] } }
      });
      apptCount++;
    }
  }

  // Future
  for (let i = 1; i <= 7; i++) {
    for (let j = 0; j < 4; j++) {
      const client = clients[(i + j) % clients.length];
      const service = services[(i + j) % services.length];
      const staff = allProviders[Math.floor(Math.random() * allProviders.length)];
      const startTime = createDate(i, 11 + j * 2); 
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      await prisma.appointment.create({
        data: { startTime, endTime, status: 'SCHEDULED', userId: client.id, staffId: staff.id, shopId: shop.id, serviceId: service.id, subtotal: service.price, totalAmount: service.price, managementToken: Math.random().toString(36).substring(7), items: { create: [{ name: service.name, price: service.price, quantity: 1, serviceId: service.id }] } }
      });
      apptCount++;
    }
  }

  // 7. CAMPAIGNS
  console.log('Creating Campaigns...');
  await prisma.campaign.createMany({
    data: [
      { shopId: shop.id, name: 'Back to School Special - 15% off Kids Cuts', message: 'Get the young gentlemen ready for the first day of school! Book a Kids Cut this week and get 15% off.', type: 'PROMO', channel: 'EMAIL', status: 'SENT', targetSegment: 'ALL', scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), recipientCount: 450 },
      { shopId: shop.id, name: 'Father\'s Day Grooming Package', message: 'Treat Dad to The Works. Gift cards are now available for our premium shave and haircut package.', type: 'NEWSLETTER', channel: 'SMS', status: 'DRAFT', targetSegment: 'ALL', recipientCount: 0 },
      { shopId: shop.id, name: 'We miss you! 10% off your next cut', message: 'It\'s been a while! Come back in for a fresh fade and enjoy 10% off.', type: 'WINBACK', channel: 'EMAIL', status: 'SENT', targetSegment: 'INACTIVE_30_DAYS', scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), recipientCount: 85 }
    ]
  });

  // 8. 100 REVIEWS
  console.log('Generating 100 Reviews...');
  const reviewComments = ["Absolutely the best fade I've ever had. Highly recommend!", "Great atmosphere and excellent service.", "Very professional and clean shop.", "Good cut, but I had to wait 15 minutes past my appointment time.", "The hot towel shave is a game changer. Felt like a new man.", "Consistent quality every single time I visit.", "My barber pays incredible attention to detail.", "A bit pricey, but you get what you pay for. Top tier service.", "Always friendly, always on point.", "First time here and I will definitely be coming back.", "Nice guys, decent cut.", "Best beard trim in the city.", "I bring my son here for his cuts and they are always so patient with him.", "Incredible styling advice, I completely changed my look thanks to them.", "Clean lines, perfect taper."];
  const ownerResponses = ["Thanks so much for the kind words! See you next time.", "We appreciate your business! Glad you enjoyed the service.", "Thank you for the review! Always a pleasure having you in the chair.", "Sorry about the wait, we'll make sure to stay on schedule next time. Thanks for coming in!", "The hot towel shave is our favorite too! Glad you liked it."];

  const reviewsData = [];
  for (let i = 0; i < 100; i++) {
    const rand = Math.random();
    let rating = 5;
    if (rand > 0.95) rating = 3;
    else if (rand > 0.8) rating = 4;

    const hasComment = Math.random() > 0.3;
    const comment = hasComment ? reviewComments[Math.floor(Math.random() * reviewComments.length)] : null;
    const client = clients[Math.floor(Math.random() * clients.length)];
    const dateOffset = Math.floor(Math.random() * 90);
    const createdAt = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000);
    const hasResponse = rating <= 4 || Math.random() > 0.8;
    const ownerResponse = hasResponse ? ownerResponses[Math.floor(Math.random() * ownerResponses.length)] : null;
    const respondedAt = hasResponse ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null;

    reviewsData.push({ shopId: shop.id, userId: client.id, rating, comment, createdAt, ownerResponse, respondedAt });
  }
  await prisma.review.createMany({ data: reviewsData });

  // 9. REPORT
  await prisma.shopUsageReport.create({
    data: { shopId: shop.id, period: new Date(), userCount: 5, appointmentCount: apptCount, productCount: products.length, serviceCount: services.length, formSubmissionCount: 0, portfolioImageCount: 15, clientHistoryImageCount: 0, clientFormulaCount: 0, reviewCount: 100, estimatedStorageMB: 105.2, suggestedMonthlyFeeUSD: 99.00, pricingTierName: 'Growth' }
  });

  console.log('--- ALL DONE ---');
  console.log('Admin Email:', admin.email);
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
