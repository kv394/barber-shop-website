/**
 * Full-featured seed for Heritage Haircuts
 * Covers: loyalty, reviews, expenses, gift cards, campaigns, commission rules,
 *         products (retail), time logs, waitlist, referrals, client profiles.
 *
 * Run:
 *   DATABASE_URL=... npx tsx prisma/seed-heritage-full.ts
 *
 * Safe to re-run — uses upsert / create-if-not-exists patterns.
 */

import { PrismaClient } from '@prisma/client';

import { config } from 'dotenv';
import { resolve } from 'path';

// Auto-load .env then .env.local from the project root
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local'), override: false });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set. Add it to .env or export it before running.');
  process.exit(1);
}


const prisma = new PrismaClient();

const SHOP_ID = 'cmn9kj24n0000lqzc7kcsmpst';

// ─── Known IDs from seed-heritage.ts ──────────────────────────────────────
const STAFF = {
  marcus:  'heritage-staff-marcus',
  deshawn: 'heritage-staff-deshawn',
  elena:   'heritage-staff-elena',
  jasmine: 'heritage-staff-jasmine',
};

const CLIENTS = {
  mike:   'hh-client-mike',
  james:  'hh-client-james',
  omar:   'hh-client-omar',
  tyler:  'hh-client-tyler',
  carlos: 'hh-client-carlos',
  david:  'hh-client-david',
};

const APTS = {
  apt01: 'hh-apt-01', // Mike - Fade - COMPLETED
  apt02: 'hh-apt-02', // James - Cut+Beard - COMPLETED
  apt06: 'hh-apt-06', // David - Shave - COMPLETED
  apt07: 'hh-apt-07', // Mike - Facial - COMPLETED
  apt08: 'hh-apt-08', // Omar - Braids - COMPLETED
};

// ───────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Extended seed for Heritage Haircuts…\n');

  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID } });
  if (!shop) { console.error('❌  Shop not found'); process.exit(1); }
  console.log(`  📍  Shop: ${shop.name}\n`);

  // ══════════════════════════════════════════════════════════════
  //  SHOP — ADDRESS, CONTACT & BRANDING
  // ══════════════════════════════════════════════════════════════
  const existingCustomization = (shop.customization as any) || {};
  await prisma.shop.update({
    where: { id: SHOP_ID },
    data: {
      name: 'Heritage Haircuts',
      timezone: 'America/New_York',
      customization: {
        ...existingCustomization,
        address: {
          street:  '2847 Heritage Blvd',
          suite:   'Suite 101',
          city:    'Atlanta',
          state:   'GA',
          zip:     '30309',
          country: 'USA',
        },
        contact: {
          phone:     '+1 (404) 555-0142',
          email:     'hello@heritagehaircuts.com',
          website:   'https://heritagehaircuts.com',
          instagram: '@heritagehaircuts',
          facebook:  'Heritage Haircuts ATL',
          yelp:      'heritage-haircuts-atlanta',
        },
        branding: {
          tagline:   'Classic cuts. Modern experience.',
          logoUrl:   null,
          heroImage: null,
        },
      },
    },
  });
  console.log('  ✅  Shop address, contact & branding updated');
  console.log('       📍 2847 Heritage Blvd, Suite 101, Atlanta, GA 30309');
  console.log('       📞 +1 (404) 555-0142');
  console.log('       ✉️  hello@heritagehaircuts.com\n');

  // ══════════════════════════════════════════════════════════════
  //  RETAIL PRODUCTS (for POS checkout)
  // ══════════════════════════════════════════════════════════════
  const retailProducts = [
    { id: 'hh-prod-pomade',    name: 'Suavecito Pomade (Original)',  price: 19.99, cost: 10.00, stock: 20, reorder: 6 },
    { id: 'hh-prod-beard-oil', name: 'Honest Amish Beard Oil',       price: 24.99, cost: 11.00, stock: 14, reorder: 5 },
    { id: 'hh-prod-wax',       name: 'By Vilain Hair Wax (Matte)',   price: 22.99, cost: 12.00, stock: 18, reorder: 6 },
    { id: 'hh-prod-shampoo',   name: 'Tea Tree Shampoo 10oz',        price: 18.00, cost: 8.00,  stock: 12, reorder: 4 },
    { id: 'hh-prod-conditioner',name: 'Tea Tree Conditioner 10oz',   price: 18.00, cost: 8.00,  stock: 10, reorder: 4 },
    { id: 'hh-prod-aftershave', name: 'Clubman Aftershave 6oz',      price: 14.99, cost: 6.50,  stock: 16, reorder: 5 },
    { id: 'hh-prod-gift25',    name: 'Gift Card - $25',              price: 25.00, cost: 25.00, stock: 50, reorder: 10 },
    { id: 'hh-prod-gift50',    name: 'Gift Card - $50',              price: 50.00, cost: 50.00, stock: 50, reorder: 10 },
  ];

  // ══════════════════════════════════════════════════════════════
  //  STAFF — PHONE NUMBERS & BIO
  // ══════════════════════════════════════════════════════════════
  const staffContacts = [
    { id: STAFF.marcus,  phone: '+1 (404) 555-0181', bio: 'Lead barber with 12 years of experience. Specialises in skin fades, patterns and the Heritage Royale package.' },
    { id: STAFF.deshawn, phone: '+1 (404) 555-0182', bio: 'Master of braids, cornrows and natural hair. 8 years experience, known for clean lines and creative designs.' },
    { id: STAFF.elena,   phone: '+1 (404) 555-0183', bio: 'Licensed cosmetologist specialising in coloring, facials and women\'s cuts. 6 years with Heritage.' },
    { id: STAFF.jasmine, phone: '+1 (404) 555-0184', bio: 'Front-desk specialist and junior barber. Handles bookings, waitlist and quick services.' },
  ];

  console.log('  📱  Staff Contact Details:');
  for (const sc of staffContacts) {
    await prisma.user.update({ where: { id: sc.id }, data: { phone: sc.phone } });
    console.log(`      ✅  ${sc.id}  — ${sc.phone}`);
  }
  console.log('');

  // ══════════════════════════════════════════════════════════════
  //  CLIENT — UPDATED CONTACT DETAILS
  // ══════════════════════════════════════════════════════════════
  const clientContacts = [
    { id: CLIENTS.mike,   phone: '+1 (770) 555-0201', email: 'mike.chen@email.com' },
    { id: CLIENTS.james,  phone: '+1 (770) 555-0202', email: 'james.brooks@email.com' },
    { id: CLIENTS.omar,   phone: '+1 (678) 555-0203', email: 'omar.hassan@email.com' },
    { id: CLIENTS.tyler,  phone: '+1 (404) 555-0204', email: 'tyler.wright@email.com' },
    { id: CLIENTS.carlos, phone: '+1 (678) 555-0205', email: 'carlos.mendez@email.com' },
    { id: CLIENTS.david,  phone: '+1 (770) 555-0206', email: 'david.kim@email.com' },
  ];

  console.log('  📱  Client Contact Details:');
  for (const cc of clientContacts) {
    await prisma.user.update({ where: { id: cc.id }, data: { phone: cc.phone } });
    console.log(`      ✅  ${cc.id}  — ${cc.phone}`);
  }
  console.log('');

  console.log('  🛍️  Retail Products:');
  for (const p of retailProducts) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { name: p.name, price: p.price, cost: p.cost, inventoryCount: p.stock, reorderPoint: p.reorder },
      create: {
        id: p.id, name: p.name, price: p.price, cost: p.cost,
        trackInventory: true, inventoryCount: p.stock, reorderPoint: p.reorder,
        type: 'RETAIL', shopId: SHOP_ID,
      },
    });
    console.log(`      ✅  ${p.name}  — $${p.price} | Stock: ${p.stock}`);
  }

  // ══════════════════════════════════════════════════════════════
  //  CLIENT PROFILES (notes, preferences, birthday, allergies)
  // ══════════════════════════════════════════════════════════════
  const clientProfiles = [
    {
      id: CLIENTS.mike, birthday: new Date('1990-05-14'),
      notes: 'Prefers high skin fade with line-up. Always tips well.',
      preferences: 'Likes classic hip-hop music. No strong scents.',
      allergies: null,
    },
    {
      id: CLIENTS.james, birthday: new Date('1985-11-22'),
      notes: 'Regular every 2 weeks. Likes tight beard outline.',
      preferences: 'Prefers quiet appointment. Reads during visit.',
      allergies: 'Sensitive to tea tree products.',
    },
    {
      id: CLIENTS.omar, birthday: new Date('1993-03-08'),
      notes: 'Cornrow style client — needs longest appointment block.',
      preferences: 'Brings own reference photos.',
      allergies: null,
    },
    {
      id: CLIENTS.tyler, birthday: new Date('1988-07-30'),
      notes: 'VIP customer. Loves Heritage Royale package monthly.',
      preferences: 'Champagne if available. Warm towel for shave.',
      allergies: null,
    },
    {
      id: CLIENTS.carlos, birthday: new Date('1995-01-17'),
      notes: 'New client — referred by Tyler Wright.',
      preferences: 'Quick service preferred. Lunch hour slots.',
      allergies: null,
    },
    {
      id: CLIENTS.david, birthday: new Date('1982-09-05'),
      notes: 'Classic straight razor shave every 2 weeks.',
      preferences: 'Old-school barbershop atmosphere. No music.',
      allergies: 'Latex allergy — use nitrile gloves.',
    },
  ];

  console.log('\n  👤  Client Profiles:');
  for (const cp of clientProfiles) {
    await prisma.user.update({
      where: { id: cp.id },
      data: {
        birthday: cp.birthday,
        clientNotes: cp.notes,
        preferences: cp.preferences,
        allergies: cp.allergies,
        referralCode: `HERITAGE-${cp.id.toUpperCase().slice(-6)}`,
      },
    });
    console.log(`      ✅  Updated profile for ${cp.id}`);
  }

  // ══════════════════════════════════════════════════════════════
  //  LOYALTY PROGRAM
  // ══════════════════════════════════════════════════════════════
  console.log('\n  ⭐  Loyalty Program:');
  const loyaltyProgram = await prisma.loyaltyProgram.upsert({
    where: { shopId: SHOP_ID },
    update: {},
    create: {
      shopId: SHOP_ID,
      pointsPerDollar: 1,
      pointsPerVisit: 10,
      redeemThreshold: 100,
      redeemValue: 5,
      isActive: true,
      tiers: [
        { name: 'Bronze',   minPoints: 0,    earnMultiplier: 1.0, perks: 'Standard rewards, 1pt per $1 spent' },
        { name: 'Silver',   minPoints: 200,  earnMultiplier: 1.25, perks: 'Priority booking, 25% bonus points' },
        { name: 'Gold',     minPoints: 500,  earnMultiplier: 1.5,  perks: 'Free product per visit, 50% bonus points' },
        { name: 'Platinum', minPoints: 1000, earnMultiplier: 2.0,  perks: 'VIP lounge, complimentary beverage, 2x points' },
      ],
    },
  });
  console.log(`      ✅  Loyalty program: ${loyaltyProgram.pointsPerDollar}pt/$1, tiers configured`);

  // Loyalty accounts for clients
  const loyaltyData = [
    { userId: CLIENTS.mike,   points: 450, earned: 450, redeemed: 0,   tier: 'Silver',   lifetime: 450 },
    { userId: CLIENTS.james,  points: 380, earned: 380, redeemed: 0,   tier: 'Silver',   lifetime: 380 },
    { userId: CLIENTS.omar,   points: 680, earned: 730, redeemed: 50,  tier: 'Gold',     lifetime: 730 },
    { userId: CLIENTS.tyler,  points: 1250, earned: 1350, redeemed: 100, tier: 'Platinum', lifetime: 1350 },
    { userId: CLIENTS.carlos, points: 35,  earned: 35,  redeemed: 0,   tier: 'Bronze',   lifetime: 35  },
    { userId: CLIENTS.david,  points: 210, earned: 210, redeemed: 0,   tier: 'Silver',   lifetime: 210 },
  ];

  console.log('\n  💳  Loyalty Accounts:');
  for (const la of loyaltyData) {
    const account = await prisma.loyaltyAccount.upsert({
      where: { userId_shopId: { userId: la.userId, shopId: SHOP_ID } },
      update: { pointsBalance: la.points, totalEarned: la.earned, totalRedeemed: la.redeemed, currentTier: la.tier, lifetimePoints: la.lifetime },
      create: {
        userId: la.userId, shopId: SHOP_ID,
        pointsBalance: la.points, totalEarned: la.earned,
        totalRedeemed: la.redeemed, currentTier: la.tier, lifetimePoints: la.lifetime,
      },
    });

    // Add a few sample transactions
    const txCount = await prisma.loyaltyTransaction.count({ where: { loyaltyAccountId: account.id } });
    if (txCount === 0) {
      await prisma.loyaltyTransaction.createMany({
        data: [
          { loyaltyAccountId: account.id, points: 50,  type: 'EARN_VISIT',  description: 'Visit bonus + service spend' },
          { loyaltyAccountId: account.id, points: la.points - 50, type: 'EARN_SPEND', description: 'Points accumulated over visits' },
        ],
      });
    }
    console.log(`      ✅  ${la.userId}  — ${la.points}pts (${la.tier})`);
  }

  // ══════════════════════════════════════════════════════════════
  //  REVIEWS (for completed appointments)
  // ══════════════════════════════════════════════════════════════
  const reviewData = [
    { id: 'hh-rev-01', aptId: APTS.apt01, userId: CLIENTS.mike,  rating: 5, comment: 'Marcus is the best! Perfect fade every time. Been coming here for 3 years.' },
    { id: 'hh-rev-02', aptId: APTS.apt02, userId: CLIENTS.james, rating: 5, comment: 'DeShawn nailed the combo. Great atmosphere and fair prices.' },
    { id: 'hh-rev-06', aptId: APTS.apt06, userId: CLIENTS.david, rating: 4, comment: 'Classic straight razor shave done right. Very professional.' },
    { id: 'hh-rev-07', aptId: APTS.apt07, userId: CLIENTS.mike,  rating: 5, comment: 'The gentleman\'s facial was incredible. Elena knew exactly what she was doing.' },
    { id: 'hh-rev-08', aptId: APTS.apt08, userId: CLIENTS.omar,  rating: 5, comment: 'DeShawn did my cornrows perfectly. Worth every penny. Will be back weekly.' },
  ];

  console.log('\n  ⭐  Reviews:');
  for (const r of reviewData) {
    const existingReview = await prisma.review.findUnique({ where: { id: r.id } });
    if (!existingReview) {
      // Check if appointment already has a review
      const aptReview = await prisma.review.findUnique({ where: { appointmentId: r.aptId } });
      if (!aptReview) {
        await prisma.review.create({
          data: {
            id: r.id, appointmentId: r.aptId, userId: r.userId,
            shopId: SHOP_ID, rating: r.rating, comment: r.comment,
          },
        });
        console.log(`      ✅  ${r.userId}: ${r.rating}⭐ — "${r.comment?.slice(0, 50)}…"`);
      } else {
        console.log(`      ⚠️   ${r.aptId} already has a review — skip`);
      }
    } else {
      console.log(`      ✅  ${r.id} already exists — skip`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  EXPENSES (past 30 days)
  // ══════════════════════════════════════════════════════════════
  const now = new Date();
  const expenseData = [
    { id: 'hh-exp-01', amount: 2800, category: 'RENT',        description: 'Monthly shop rent — April',       daysAgo: 1 },
    { id: 'hh-exp-02', amount: 420,  category: 'UTILITIES',   description: 'Electricity + water — March',      daysAgo: 3 },
    { id: 'hh-exp-03', amount: 185,  category: 'SUPPLIES',    description: 'Barbicide, towels, neck strips',    daysAgo: 5 },
    { id: 'hh-exp-04', amount: 650,  category: 'SUPPLIES',    description: 'Paul Mitchell product restock',    daysAgo: 7 },
    { id: 'hh-exp-05', amount: 120,  category: 'MARKETING',   description: 'Instagram ad campaign — March',   daysAgo: 10 },
    { id: 'hh-exp-06', amount: 89,   category: 'EQUIPMENT',   description: 'Wahl clipper blade replacement',  daysAgo: 12 },
    { id: 'hh-exp-07', amount: 240,  category: 'SUPPLIES',    description: 'Suavecito pomade bulk order',     daysAgo: 15 },
    { id: 'hh-exp-08', amount: 75,   category: 'OTHER',       description: 'Staff meeting lunch',              daysAgo: 18 },
    { id: 'hh-exp-09', amount: 395,  category: 'UTILITIES',   description: 'Internet + phone — March',        daysAgo: 20 },
    { id: 'hh-exp-10', amount: 2800, category: 'RENT',        description: 'Monthly shop rent — March',       daysAgo: 31 },
  ];

  console.log('\n  💸  Expenses:');
  for (const e of expenseData) {
    const existingExp = await prisma.expense.findFirst({ where: { id: e.id } });
    if (!existingExp) {
      const expDate = new Date(now); expDate.setDate(expDate.getDate() - e.daysAgo);
      await prisma.expense.create({
        data: { id: e.id, amount: e.amount, category: e.category, description: e.description, date: expDate, shopId: SHOP_ID },
      });
      console.log(`      ✅  $${e.amount} — ${e.category}: ${e.description}`);
    } else {
      console.log(`      ✅  ${e.id} already exists — skip`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  GIFT CARDS
  // ══════════════════════════════════════════════════════════════
  const giftCards = [
    { id: 'hh-gc-01', code: 'HERITAGE-GIFT-25A', purchaserEmail: CLIENTS.tyler + '@email.com', recipientEmail: 'friend@email.com',  recipientName: 'Alex Turner',  balance: 25, initial: 25 },
    { id: 'hh-gc-02', code: 'HERITAGE-GIFT-50B', purchaserEmail: CLIENTS.james + '@email.com', recipientEmail: 'brother@email.com', recipientName: 'Ryan Brooks',  balance: 50, initial: 50 },
    { id: 'hh-gc-03', code: 'HERITAGE-GIFT-50C', purchaserEmail: 'unknown@email.com',          recipientEmail: null,                recipientName: null,           balance: 30, initial: 50 },
    { id: 'hh-gc-04', code: 'HERITAGE-GIFT-25D', purchaserEmail: CLIENTS.mike + '@email.com',  recipientEmail: 'dad@email.com',     recipientName: 'Mr. Chen',     balance: 0,  initial: 25, status: 'REDEEMED' as const },
  ];

  console.log('\n  🎁  Gift Cards:');
  for (const gc of giftCards) {
    const existing = await prisma.giftCard.findUnique({ where: { code: gc.code } });
    if (!existing) {
      const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await prisma.giftCard.create({
        data: {
          id: gc.id, code: gc.code, shopId: SHOP_ID,
          purchaserEmail: gc.purchaserEmail, recipientEmail: gc.recipientEmail, recipientName: gc.recipientName,
          initialBalance: gc.initial, currentBalance: gc.balance,
          expiresAt: gc.status === 'REDEEMED' ? undefined : expiresAt,
          status: gc.status || 'ACTIVE',
        },
      });
      console.log(`      ✅  ${gc.code}  $${gc.balance}/$${gc.initial}  → ${gc.recipientName || 'unnamed'}`);
    } else {
      console.log(`      ✅  ${gc.code} already exists — skip`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  COMMISSION RULES
  // ══════════════════════════════════════════════════════════════
  console.log('\n  💰  Commission Rules:');
  const commissionRules = [
    { id: 'hh-comm-marcus-svc',  staffId: STAFF.marcus,  serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 55 },
    { id: 'hh-comm-deshawn-svc', staffId: STAFF.deshawn, serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 50 },
    { id: 'hh-comm-elena-svc',   staffId: STAFF.elena,   serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 50 },
    { id: 'hh-comm-jasmine-svc', staffId: STAFF.jasmine, serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 45 },
  ];

  for (const cr of commissionRules) {
    await prisma.commissionRule.upsert({
      where: { id: cr.id },
      update: { rateValue: cr.rateValue },
      create: { id: cr.id, shopId: SHOP_ID, staffId: cr.staffId, serviceId: cr.serviceId, rateType: cr.rateType, rateValue: cr.rateValue },
    });
    console.log(`      ✅  Staff ${cr.staffId}: ${cr.rateValue}% commission`);
  }

  // Also set per-user commission rates
  for (const [id, rate] of [
    [STAFF.marcus, 55], [STAFF.deshawn, 50], [STAFF.elena, 50], [STAFF.jasmine, 45],
  ] as [string, number][]) {
    await prisma.user.update({ where: { id }, data: { commissionRateService: rate, commissionRateProduct: 10 } });
  }

  // ══════════════════════════════════════════════════════════════
  //  TIME LOGS (clock-in/out for today and yesterday)
  // ══════════════════════════════════════════════════════════════
  console.log('\n  🕐  Time Logs:');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const timeLogs = [
    // Yesterday
    { userId: STAFF.marcus,  clockIn: new Date(yesterday.getTime() + 9*60*60*1000),  clockOut: new Date(yesterday.getTime() + 17*60*60*1000) },
    { userId: STAFF.deshawn, clockIn: new Date(yesterday.getTime() + 10*60*60*1000), clockOut: new Date(yesterday.getTime() + 18*60*60*1000) },
    { userId: STAFF.elena,   clockIn: new Date(yesterday.getTime() + 9*60*60*1000),  clockOut: new Date(yesterday.getTime() + 17*60*60*1000) },
    // Today (clocked in, still working)
    { userId: STAFF.marcus,  clockIn: new Date(today.getTime() + 9*60*60*1000),   clockOut: null },
    { userId: STAFF.deshawn, clockIn: new Date(today.getTime() + 10*60*60*1000),  clockOut: null },
  ];

  let tlCount = 0;
  for (const tl of timeLogs) {
    const existing = await prisma.timeLog.findFirst({
      where: { userId: tl.userId, clockIn: tl.clockIn },
    });
    if (!existing) {
      await prisma.timeLog.create({ data: { userId: tl.userId, shopId: SHOP_ID, clockIn: tl.clockIn, clockOut: tl.clockOut } });
      tlCount++;
    }
  }
  console.log(`      ✅  ${tlCount} time log entries created`);

  // ══════════════════════════════════════════════════════════════
  //  WAITLIST ENTRIES
  // ══════════════════════════════════════════════════════════════
  console.log('\n  📋  Waitlist Entries:');
  const waitCount = await prisma.waitlist.count({ where: { shopId: SHOP_ID } });
  if (waitCount === 0) {
    await prisma.waitlist.createMany({
      data: [
        { clientName: 'Jordan Lee',    clientPhone: '+1-555-0301', serviceId: 'hh-svc-fade',     staffId: STAFF.marcus,  position: 1, status: 'WAITING', shopId: SHOP_ID },
        { clientName: 'Sam Ortega',    clientPhone: '+1-555-0302', serviceId: 'hh-svc-mens-cut', staffId: null,          position: 2, status: 'WAITING', shopId: SHOP_ID },
        { clientName: 'Kevin Jackson', clientPhone: '+1-555-0303', serviceId: 'hh-svc-lineup',   staffId: STAFF.deshawn, position: 3, status: 'WAITING', shopId: SHOP_ID },
      ],
    });
    console.log(`      ✅  3 waitlist entries created`);
  } else {
    console.log(`      ✅  Waitlist already has ${waitCount} entries — skip`);
  }

  // ══════════════════════════════════════════════════════════════
  //  CAMPAIGNS
  // ══════════════════════════════════════════════════════════════
  console.log('\n  📣  Campaigns:');
  const campaigns = [
    {
      id: 'hh-camp-01', name: 'Spring Refresh Promo',
      message: 'Spring is here! Book your Heritage Royale package this April and get a complimentary beard oil ($20 value). Use code SPRING24.',
      type: 'PROMO', channel: 'EMAIL', status: 'SENT',
      targetSegment: 'ALL', recipientCount: 6,
      sentAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'hh-camp-02', name: 'Win-Back — 60 Day Inactive',
      message: 'We miss you! It\'s been a while since your last visit. Book this week and get $10 off your service.',
      type: 'RE_ENGAGEMENT', channel: 'EMAIL', status: 'SCHEDULED',
      targetSegment: 'INACTIVE_60', recipientCount: 0,
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'hh-camp-03', name: 'Birthday Month Special',
      message: 'Happy Birthday! 🎉 To celebrate, enjoy a FREE line-up with any full service this month. Show this email at checkout.',
      type: 'BIRTHDAY', channel: 'BOTH', status: 'DRAFT',
      targetSegment: 'BIRTHDAY_THIS_MONTH', recipientCount: 0,
    },
    {
      id: 'hh-camp-04', name: 'Gold & Platinum VIP Offer',
      message: 'As a Gold/Platinum member, you\'re invited to our exclusive Saturday Morning VIP hour (8–9AM). Book your spot now.',
      type: 'CUSTOM', channel: 'EMAIL', status: 'SENT',
      targetSegment: 'LOYALTY_VIP', recipientCount: 2,
      sentAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const c of campaigns) {
    const existing = await prisma.campaign.findFirst({ where: { id: c.id } });
    if (!existing) {
      await prisma.campaign.create({
        data: {
          id: c.id, shopId: SHOP_ID, name: c.name, message: c.message,
          type: c.type, channel: c.channel, status: c.status,
          targetSegment: c.targetSegment, recipientCount: c.recipientCount,
          sentAt: c.sentAt, scheduledAt: c.scheduledAt,
        },
      });
      console.log(`      ✅  ${c.name} (${c.status})`);
    } else {
      console.log(`      ✅  ${c.id} already exists — skip`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  REFERRALS
  // ══════════════════════════════════════════════════════════════
  console.log('\n  🔗  Referrals:');
  const existingRef = await prisma.referral.findFirst({ where: { shopId: SHOP_ID } });
  if (!existingRef) {
    await prisma.referral.create({
      data: {
        shopId: SHOP_ID,
        referrerId: CLIENTS.tyler,
        refereeId: CLIENTS.carlos,
        status: 'REWARDED',
        referrerRewardPoints: 50,
        refereeRewardPoints: 25,
      },
    });
    console.log(`      ✅  Tyler Wright referred Carlos Mendez (REWARDED)`);
  } else {
    console.log(`      ✅  Referrals already exist — skip`);
  }

  // ══════════════════════════════════════════════════════════════
  //  NOTIFICATION PREFERENCES (for clients)
  // ══════════════════════════════════════════════════════════════
  console.log('\n  🔔  Notification Preferences:');
  const notifPrefs = [
    { userId: CLIENTS.mike,   channel: 'BOTH' },
    { userId: CLIENTS.james,  channel: 'EMAIL' },
    { userId: CLIENTS.omar,   channel: 'SMS' },
    { userId: CLIENTS.tyler,  channel: 'BOTH' },
    { userId: CLIENTS.carlos, channel: 'EMAIL' },
    { userId: CLIENTS.david,  channel: 'EMAIL' },
  ];

  for (const pref of notifPrefs) {
    await prisma.notificationPreference.upsert({
      where: { userId: pref.userId },
      update: { preferredChannel: pref.channel },
      create: {
        userId: pref.userId, preferredChannel: pref.channel,
        appointmentReminders: true, reviewRequests: true,
        promotions: true, birthdayMessages: true, loyaltyUpdates: true,
      },
    });
  }
  console.log(`      ✅  ${notifPrefs.length} preferences set`);

  // ══════════════════════════════════════════════════════════════
  //  DONE
  // ══════════════════════════════════════════════════════════════
  console.log('\n🎉  Extended seed complete!\n');
  console.log('   Feature Coverage:');
  console.log('   ─────────────────────────────────────────');
  console.log('   ✅  Shop address, contact & branding');
  console.log('   ✅  Staff phone numbers');
  console.log('   ✅  Client contact details');
  console.log('   ✅  Retail Products (POS checkout)');
  console.log('   ✅  Client Profiles (notes, preferences, birthdays, allergies)');
  console.log('   ✅  Loyalty Program + Accounts + Transactions');
  console.log('   ✅  Reviews (5-star ratings with comments)');
  console.log('   ✅  Expenses (30 days of business expenses)');
  console.log('   ✅  Gift Cards (active + partially redeemed + fully redeemed)');
  console.log('   ✅  Commission Rules (per-staff percentages)');
  console.log('   ✅  Time Logs (clock-in/out records)');
  console.log('   ✅  Waitlist (3 walk-in customers)');
  console.log('   ✅  Campaigns (promo, re-engagement, birthday, VIP)');
  console.log('   ✅  Referrals (Tyler → Carlos)');
  console.log('   ✅  Notification Preferences (per-client channel prefs)');
  console.log('');
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

