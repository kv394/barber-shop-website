import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- STARTING ADMIN FEATURES SEED ---');
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@heritagehaircuts.com' }
  });

  if (!admin || !admin.shopId) {
    console.error('Could not find existing Heritage Haircuts shop. Did the full seed run?');
    return;
  }

  const shopId = admin.shopId;

  // FETCH REQUIRED RECORDS
  const staff = await prisma.user.findMany({ where: { shopId, role: 'STAFF' } });
  const contractors = await prisma.user.findMany({ where: { shopId, role: 'BOOTH_RENTER' } });
  const allProviders = [...staff, ...contractors];
  const clients = await prisma.user.findMany({ where: { shopId, role: 'CLIENT' } });
  const services = await prisma.service.findMany({ where: { shopId } });
  const appointments = await prisma.appointment.findMany({ where: { shopId }, take: 10 });

  if (clients.length === 0 || allProviders.length === 0 || services.length === 0) {
    console.error('Missing required base data (clients/staff/services). Aborting.');
    return;
  }

  // 1. OPERATIONS
  console.log('Generating Operations Data (Blackouts, Waitlist, Commissions, Expenses, Booth Rent)...');
  
  await prisma.shopBlackoutDate.deleteMany({ where: { shopId } });
  await prisma.shopBlackoutDate.createMany({
    data: [
      { shopId, date: new Date('2026-11-26T00:00:00.000Z'), reason: 'Thanksgiving Day' },
      { shopId, date: new Date('2026-12-25T00:00:00.000Z'), reason: 'Christmas Day' },
      { shopId, date: new Date('2027-01-01T00:00:00.000Z'), reason: 'New Years Day' }
    ]
  });

  await prisma.waitlist.deleteMany({ where: { shopId } });
  await prisma.waitlist.createMany({
    data: [
      { shopId, clientName: clients[0].name, clientPhone: clients[0].phone, serviceId: services[0].id, position: 1, status: 'WAITING' },
      { shopId, clientName: clients[1].name, clientPhone: clients[1].phone, serviceId: services[1].id, position: 2, status: 'WAITING' }
    ]
  });

  await prisma.commissionRule.deleteMany({ where: { shopId } });
  const commRules = [];
  for (const s of staff) {
    commRules.push({ shopId, staffId: s.id, rateType: 'PERCENTAGE', rateValue: 40 });
  }
  await prisma.commissionRule.createMany({ data: commRules });

  await prisma.expense.deleteMany({ where: { shopId } });
  await prisma.expense.createMany({
    data: [
      { shopId, category: 'RENT', amount: 3500.00, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: 'Monthly Shop Rent' },
      { shopId, category: 'UTILITIES', amount: 450.00, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: 'Electric & Water' },
      { shopId, category: 'SUPPLIES', amount: 850.00, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), description: 'Barber Supplies & Towels' },
      { shopId, category: 'MARKETING', amount: 200.00, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), description: 'Facebook Ads' }
    ]
  });

  await prisma.boothRentPayment.deleteMany({ where: { shopId } });
  const rentPayments = [];
  for (const c of contractors) {
    rentPayments.push({ shopId, userId: c.id, amount: 250.00, periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), periodEnd: new Date(), status: 'COMPLETED', paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) });
    rentPayments.push({ shopId, userId: c.id, amount: 250.00, periodStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), periodEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'COMPLETED', paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) });
  }
  await prisma.boothRentPayment.createMany({ data: rentPayments });

  // 2. EXPERIENCE
  console.log('Generating Experience Data (Memberships, Forms)...');
  await prisma.userMembership.deleteMany({ where: { membershipTier: { shopId } } });
  await prisma.membershipTier.deleteMany({ where: { shopId } });
  const vipTier = await prisma.membershipTier.create({
    data: { shopId, name: 'VIP Gentleman\'s Club', description: 'Unlimited cuts and 1 free shave per month.', price: 100.00, interval: 'MONTHLY' }
  });


  await prisma.userMembership.createMany({
    data: [
      { shopId, userId: clients[0].id, membershipTierId: vipTier.id, status: 'ACTIVE', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), currentPeriodEnd: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      { shopId, userId: clients[1].id, membershipTierId: vipTier.id, status: 'ACTIVE', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
      { shopId, userId: clients[2].id, membershipTierId: vipTier.id, status: 'CANCELED', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    ]
  });
  await prisma.formSubmission.deleteMany({ where: { formTemplate: { shopId } } });
  await prisma.formTemplate.deleteMany({ where: { shopId } });
  const consentForm = await prisma.formTemplate.create({
    data: { shopId, name: 'Chemical Treatment Consent', content: 'I consent to the use of chemical styling products...', isRequired: false }
  });
  const intakeForm = await prisma.formTemplate.create({
    data: { shopId, name: 'New Client Intake', content: 'Any allergies to products or aftershaves?', isRequired: true }
  });

  await prisma.formSubmission.deleteMany({ where: { formTemplateId: { in: [consentForm.id, intakeForm.id] } } });
  if (appointments.length > 0) {
    await prisma.formSubmission.createMany({
      data: [
        { appointmentId: appointments[0].id, clientId: appointments[0].userId, formTemplateId: intakeForm.id, contentData: { allergies: 'None' }, signatureUrl: 'signed' },
        { appointmentId: appointments[1].id, clientId: appointments[1].userId, formTemplateId: consentForm.id, contentData: { agreed: true }, signatureUrl: 'signed' }
      ]
    });
  }

  // 3. ENGAGEMENT
  console.log('Generating Engagement Data (Loyalty, Gift Cards)...');
  await prisma.loyaltyProgram.deleteMany({ where: { shopId } });
  const loyalty = await prisma.loyaltyProgram.create({
    data: { shopId, isActive: true, pointsPerDollar: 1, redeemThreshold: 100, redeemValue: 0.10 }
  });

  await prisma.loyaltyAccount.deleteMany({ where: { shopId } });
  for (let i = 0; i < clients.length; i++) {
    const points = Math.floor(Math.random() * 500) + 50;
    const acc = await prisma.loyaltyAccount.create({
      data: { userId: clients[i].id, shopId, pointsBalance: points, lifetimePoints: points + 100 }
    });
    
    // Create a transaction
    await prisma.loyaltyTransaction.create({
      data: { loyaltyAccountId: acc.id, points: 25, type: 'EARNED', description: 'Haircut points' }
    });
  }

  await prisma.giftCard.deleteMany({ where: { shopId } });
  await prisma.giftCard.createMany({
    data: [
      { shopId, code: 'GIFT-100-ABC', initialBalance: 100.00, currentBalance: 100.00, status: 'ACTIVE', purchaserEmail: clients[3].email },
      { shopId, code: 'GIFT-50-XYZ', initialBalance: 50.00, currentBalance: 25.00, status: 'ACTIVE', purchaserEmail: clients[4].email },
      { shopId, code: 'GIFT-25-123', initialBalance: 25.00, currentBalance: 0.00, status: 'REDEEMED', purchaserEmail: clients[5].email },
      { shopId, code: 'GIFT-100-DEF', initialBalance: 100.00, currentBalance: 100.00, status: 'ACTIVE', purchaserEmail: clients[6].email },
      { shopId, code: 'GIFT-50-789', initialBalance: 50.00, currentBalance: 50.00, status: 'ACTIVE', purchaserEmail: clients[7].email }
    ]
  });

  // 4. TEAM
  console.log('Generating Team Data (Portfolios)...');
  await prisma.portfolioImage.deleteMany({ where: { shopId } });
  
  // Unsplash reliable haircut URLs
  const imageUrls = [
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ];

  const portfolioData = [];
  for (const provider of allProviders) {
    for (let i = 0; i < 2; i++) {
      portfolioData.push({
        shopId,
        staffId: provider.id,
        imageUrl: imageUrls[(provider.id.length + i) % imageUrls.length],
        caption: i === 0 ? 'Classic Fade' : 'Beard Sculpting'
      });
    }
  }
  await prisma.portfolioImage.createMany({ data: portfolioData });

  console.log('--- ADMIN FEATURES SEED COMPLETE ---');
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
