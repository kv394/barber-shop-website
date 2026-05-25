import { prisma } from '../lib/prisma';

async function main() {
  console.log('Starting Advanced Demo Seed for Heritage Haircuts...');

  // Find Admin and Shop
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@heritagehaircuts.com' },
    include: { shop: true }
  });

  if (!admin || !admin.shopId) {
    console.error('Could not find existing Heritage Haircuts shop. Did the basic seed run?');
    return;
  }

  const shopId = admin.shopId;

  // 1. SERVICES
  console.log('Updating Services...');
  const existingServices = await prisma.service.findMany({ where: { shopId } });
  
  const advancedServicesData = [
    { name: 'The Heritage Signature Fade', description: 'Our premium signature fade with hot towel finish.', price: 55, duration: 45, isBookable: true },
    { name: 'Classic Gentleman\'s Cut', description: 'Timeless scissor cut and styling.', price: 45, duration: 30, isBookable: true },
    { name: 'Hot Towel Straight Razor Shave', description: 'Traditional hot lather straight razor shave.', price: 40, duration: 45, isBookable: true },
    { name: 'Beard Sculpting & Line Up', description: 'Detailed beard shaping and crisp line up.', price: 30, duration: 30, isBookable: true },
    { name: 'Kids Cut', description: 'Precision cut for the young gentlemen (Under 12).', price: 25, duration: 30, isBookable: true },
    { name: 'The Works', description: 'Haircut, Beard Sculpt, Straight Razor Shave, and Wash.', price: 90, duration: 90, isBookable: true }
  ];

  const finalServices = [];
  for (let i = 0; i < advancedServicesData.length; i++) {
    const sData = advancedServicesData[i];
    if (i < existingServices.length) {
      // Update existing to avoid foreign key issues on appointments
      const updated = await prisma.service.update({
        where: { id: existingServices[i].id },
        data: { ...sData }
      });
      finalServices.push(updated);
    } else {
      // Create new
      const created = await prisma.service.create({
        data: { ...sData, shopId }
      });
      finalServices.push(created);
    }
  }

  // 2. PRODUCTS
  console.log('Updating Products...');
  await prisma.serviceProductUsage.deleteMany({ where: { product: { shopId } } });
  await prisma.purchaseOrderItem.deleteMany({ where: { product: { shopId } } });
  
  // We can't easily delete products if they are tied to AppointmentItems. We'll update the first 3.
  const existingProducts = await prisma.product.findMany({ where: { shopId } });
  
  const advancedProductsData = [
    // RETAIL
    { name: 'Matte Clay', description: 'High hold, matte finish clay.', price: 22, cost: 10, type: 'RETAIL', inventoryCount: 45, trackInventory: true, reorderPoint: 10 },
    { name: 'Sandalwood Beard Oil', description: 'Nourishing organic beard oil.', price: 18, cost: 8, type: 'RETAIL', inventoryCount: 30, trackInventory: true, reorderPoint: 10 },
    { name: 'Sea Salt Texture Spray', description: 'Pre-styler for volume and texture.', price: 24, cost: 12, type: 'RETAIL', inventoryCount: 20, trackInventory: true, reorderPoint: 5 },
    { name: 'Firm Hold Pomade', description: 'Classic high shine pomade.', price: 20, cost: 9, type: 'RETAIL', inventoryCount: 15, trackInventory: true, reorderPoint: 5 },
    // INTERNAL (BACKBAR)
    { name: 'Premium Shave Gel', description: 'Professional glide shave gel.', price: 0, cost: 15, type: 'BACKBAR', inventoryCount: 8, trackInventory: true, reorderPoint: 3 },
    { name: 'Cooling Aftershave', description: 'Post-shave soothing balm.', price: 0, cost: 12, type: 'BACKBAR', inventoryCount: 5, trackInventory: true, reorderPoint: 2 },
    { name: 'Talc Powder', description: 'Neck dusting powder.', price: 0, cost: 5, type: 'BACKBAR', inventoryCount: 10, trackInventory: true, reorderPoint: 2 }
  ] as const;

  const finalProducts = [];
  for (let i = 0; i < advancedProductsData.length; i++) {
    const pData = advancedProductsData[i];
    if (i < existingProducts.length) {
      const updated = await prisma.product.update({
        where: { id: existingProducts[i].id },
        data: { ...pData }
      });
      finalProducts.push(updated);
    } else {
      const created = await prisma.product.create({
        data: { ...pData, shopId }
      });
      finalProducts.push(created);
    }
  }

  // 3. SERVICE PRODUCT MAPPING (INVENTORY FORECASTING)
  console.log('Mapping Products to Services...');
  const shaveGel = finalProducts.find(p => p.name === 'Premium Shave Gel');
  const aftershave = finalProducts.find(p => p.name === 'Cooling Aftershave');
  const straightShaveService = finalServices.find(s => s.name === 'Hot Towel Straight Razor Shave');
  const theWorksService = finalServices.find(s => s.name === 'The Works');

  if (shaveGel && aftershave && straightShaveService && theWorksService) {
    await prisma.serviceProductUsage.createMany({
      data: [
        { serviceId: straightShaveService.id, productId: shaveGel.id, servicesPerProduct: 20, currentServiceCount: 12 },
        { serviceId: straightShaveService.id, productId: aftershave.id, servicesPerProduct: 40, currentServiceCount: 18 },
        { serviceId: theWorksService.id, productId: shaveGel.id, servicesPerProduct: 20, currentServiceCount: 5 },
        { serviceId: theWorksService.id, productId: aftershave.id, servicesPerProduct: 40, currentServiceCount: 5 },
      ]
    });
  }

  // 4. STAFF AVAILABILITY
  console.log('Updating Staff Availability...');
  await prisma.user.update({
    where: { email: 'john@heritagehaircuts.com' },
    data: {
      workingHours: {
        monday: { open: '07:00', close: '15:00' },
        tuesday: { open: '07:00', close: '15:00' },
        wednesday: { open: '07:00', close: '15:00' },
        thursday: { open: '07:00', close: '15:00' },
        friday: { open: '07:00', close: '15:00' },
      }
    }
  });

  await prisma.user.update({
    where: { email: 'sarah@heritagehaircuts.com' },
    data: {
      workingHours: {
        wednesday: { open: '12:00', close: '20:00' },
        thursday: { open: '12:00', close: '20:00' },
        friday: { open: '12:00', close: '20:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: '10:00', close: '16:00' }
      }
    }
  });

  await prisma.user.update({
    where: { email: 'mike@heritagehaircuts.com' },
    data: {
      workingHours: {
        tuesday: { open: '09:00', close: '13:00' }, // Split shift
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '18:00' }
      }
    }
  });

  await prisma.user.update({
    where: { email: 'dave@heritagehaircuts.com' },
    data: {
      workingHours: {
        monday: { open: '12:00', close: '20:00' },
        tuesday: { open: '12:00', close: '20:00' },
        wednesday: { open: '12:00', close: '20:00' },
        thursday: { open: '12:00', close: '20:00' },
        friday: { open: '12:00', close: '20:00' }
      }
    }
  });

  // 5. CAMPAIGNS
  console.log('Creating Marketing Campaigns...');
  await prisma.campaign.deleteMany({ where: { shopId } });
  await prisma.campaign.createMany({
    data: [
      {
        shopId,
        name: 'Back to School Special - 15% off Kids Cuts',
        message: 'Get the young gentlemen ready for the first day of school! Book a Kids Cut this week and get 15% off.',
        type: 'PROMO',
        channel: 'EMAIL',
        status: 'SENT',
        targetSegment: 'ALL',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        recipientCount: 450
      },
      {
        shopId,
        name: 'Father\'s Day Grooming Package',
        message: 'Treat Dad to The Works. Gift cards are now available for our premium shave and haircut package.',
        type: 'NEWSLETTER',
        channel: 'SMS',
        status: 'DRAFT',
        targetSegment: 'ALL',
        recipientCount: 0
      },
      {
        shopId,
        name: 'We miss you! 10% off your next cut',
        message: 'It\'s been a while! Come back in for a fresh fade and enjoy 10% off.',
        type: 'WINBACK',
        channel: 'EMAIL',
        status: 'SENT',
        targetSegment: 'INACTIVE_30_DAYS',
        scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        recipientCount: 85
      }
    ]
  });

  // 6. 100 MOCK REVIEWS
  console.log('Generating 100 Mock Reviews...');
  await prisma.review.deleteMany({ where: { shopId } });
  
  const staffMembers = await prisma.user.findMany({ where: { shopId, role: { in: ['STAFF', 'BOOTH_RENTER'] } } });
  const clients = await prisma.user.findMany({ where: { shopId, role: 'CLIENT' } });

  const reviewComments = [
    "Absolutely the best fade I've ever had. Highly recommend!",
    "Great atmosphere and excellent service.",
    "Very professional and clean shop.",
    "Good cut, but I had to wait 15 minutes past my appointment time.",
    "The hot towel shave is a game changer. Felt like a new man.",
    "Consistent quality every single time I visit.",
    "My barber pays incredible attention to detail.",
    "A bit pricey, but you get what you pay for. Top tier service.",
    "Always friendly, always on point.",
    "First time here and I will definitely be coming back.",
    "Nice guys, decent cut.",
    "Best beard trim in the city.",
    "I bring my son here for his cuts and they are always so patient with him.",
    "Incredible styling advice, I completely changed my look thanks to them.",
    "Clean lines, perfect taper."
  ];

  const ownerResponses = [
    "Thanks so much for the kind words! See you next time.",
    "We appreciate your business! Glad you enjoyed the service.",
    "Thank you for the review! Always a pleasure having you in the chair.",
    "Sorry about the wait, we'll make sure to stay on schedule next time. Thanks for coming in!",
    "The hot towel shave is our favorite too! Glad you liked it."
  ];

  const reviewsData = [];
  for (let i = 0; i < 100; i++) {
    // Determine rating weighting (Mostly 5, some 4, rare 3)
    const rand = Math.random();
    let rating = 5;
    if (rand > 0.95) rating = 3;
    else if (rand > 0.8) rating = 4;

    const hasComment = Math.random() > 0.3; // 70% have comments
    const comment = hasComment ? reviewComments[Math.floor(Math.random() * reviewComments.length)] : null;
    
    // Assign to a random client and random staff
    const client = clients[Math.floor(Math.random() * clients.length)];
    // (Note: we don't necessarily need to link it to a staff member in the Review model depending on schema, but we link it to the user submitting it and the shop)
    
    // Spread dates over the last 90 days
    const dateOffset = Math.floor(Math.random() * 90);
    const createdAt = new Date(Date.now() - dateOffset * 24 * 60 * 60 * 1000);

    const hasResponse = rating <= 4 || Math.random() > 0.8;
    const ownerResponse = hasResponse ? ownerResponses[Math.floor(Math.random() * ownerResponses.length)] : null;
    const respondedAt = hasResponse ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null;

    reviewsData.push({
      shopId,
      userId: client.id,
      rating,
      comment,
      createdAt,
      ownerResponse,
      respondedAt
    });
  }

  await prisma.review.createMany({
    data: reviewsData
  });

  console.log('--- ADVANCED SEED COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
