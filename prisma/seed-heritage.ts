/**
 * Seed sample staff, services & inventory for Heritage Haircuts.
 *
 * Run:
 *   npx tsx prisma/seed-heritage.ts
 *
 * Safe to run multiple times — uses upsert.
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import crypto from 'crypto';
import { config } from 'dotenv';
import { resolve } from 'path';

// Auto-load .env then .env.local from the project root
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local'), override: false });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set. Add it to .env or export it first.');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SHOP_ID = 'cmn9kj24n0000lqzc7kcsmpst';

function barcode(seed: string): string {
  return crypto
    .createHash('sha256')
    .update(`${seed}-${process.env.JWT_SECRET || 'secret'}`)
    .digest('hex')
    .substring(0, 12)
    .toUpperCase();
}

async function main() {
  console.log('🌱  Seeding Heritage Haircuts…\n');

  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID } });
  if (!shop) {
    console.error('❌  Shop not found! ID:', SHOP_ID);
    process.exit(1);
  }
  console.log(`  📍  Shop: ${shop.name}  (${shop.id})\n`);

  // ── Update shop with business hours ────────────────────────────
  await prisma.shop.update({
    where: { id: SHOP_ID },
    data: {
      description: 'Classic barbershop experience with a modern twist. Serving the community since 2018.',
      customization: {
        ...(shop.customization as any || {}),
        primaryColor: '#c8a45e',
        secondaryColor: '#1a1a2e',
        businessHours: {
          monday:    { open: '09:00', close: '19:00' },
          tuesday:   { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday:  { open: '09:00', close: '21:00' },
          friday:    { open: '09:00', close: '21:00' },
          saturday:  { open: '08:00', close: '17:00' },
          sunday:    null,
        },
      },
    },
  });
  console.log('  ✅  Shop customization updated\n');

  // ══════════════════════════════════════════════════════════════
  //  STAFF (3 barbers + 1 receptionist)
  // ══════════════════════════════════════════════════════════════
  const staffList = [
    {
      id: 'heritage-staff-marcus',
      email: 'marcus@heritage-haircuts.com',
      name: 'Marcus Johnson',
      workingHours: {
        monday:    { open: '09:00', close: '17:00' },
        tuesday:   { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday:  { open: '11:00', close: '21:00' },
        friday:    { open: '11:00', close: '21:00' },
        saturday:  { open: '08:00', close: '14:00' },
        sunday:    null,
      },
    },
    {
      id: 'heritage-staff-deshawn',
      email: 'deshawn@heritage-haircuts.com',
      name: 'DeShawn Williams',
      workingHours: {
        monday:    { open: '10:00', close: '18:00' },
        tuesday:   { open: '10:00', close: '18:00' },
        wednesday: null,
        thursday:  { open: '10:00', close: '20:00' },
        friday:    { open: '10:00', close: '20:00' },
        saturday:  { open: '09:00', close: '17:00' },
        sunday:    null,
      },
    },
    {
      id: 'heritage-staff-elena',
      email: 'elena@heritage-haircuts.com',
      name: 'Elena Ramirez',
      workingHours: {
        monday:    { open: '09:00', close: '17:00' },
        tuesday:   null,
        wednesday: { open: '09:00', close: '17:00' },
        thursday:  { open: '09:00', close: '19:00' },
        friday:    { open: '09:00', close: '19:00' },
        saturday:  { open: '10:00', close: '16:00' },
        sunday:    null,
      },
    },
    {
      id: 'heritage-staff-jasmine',
      email: 'jasmine@heritage-haircuts.com',
      name: 'Jasmine Patel',
      workingHours: {
        monday:    { open: '09:00', close: '19:00' },
        tuesday:   { open: '09:00', close: '19:00' },
        wednesday: { open: '09:00', close: '19:00' },
        thursday:  { open: '09:00', close: '21:00' },
        friday:    { open: '09:00', close: '21:00' },
        saturday:  { open: '08:00', close: '17:00' },
        sunday:    null,
      },
    },
  ];

  console.log('  👥  Staff:');
  for (const s of staffList) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, workingHours: s.workingHours },
      create: {
        id: s.id,
        email: s.email,
        name: s.name,
        role: 'STAFF',
        shopId: SHOP_ID,
        canManageInventory: true,
        barcode: barcode(s.email),
        workingHours: s.workingHours,
      },
    });
    console.log(`      ✅  ${user.name} (${user.email})`);
  }

  // ══════════════════════════════════════════════════════════════
  //  CUSTOMER SERVICES
  // ══════════════════════════════════════════════════════════════
  const customerServices = [
    { id: 'hh-svc-mens-cut',       name: 'Men\'s Haircut',          price: 35,  duration: 30, desc: 'Classic scissor or clipper cut, styled to perfection.' },
    { id: 'hh-svc-kids-cut',       name: 'Kids Haircut (12 & under)', price: 25, duration: 25, desc: 'Gentle cuts for the little ones.' },
    { id: 'hh-svc-beard-trim',     name: 'Beard Trim & Shape',      price: 20,  duration: 15, desc: 'Precision beard grooming with hot towel finish.' },
    { id: 'hh-svc-cut-beard',      name: 'Haircut + Beard Combo',   price: 50,  duration: 45, desc: 'Full haircut and beard trim — our most popular package.' },
    { id: 'hh-svc-fade',           name: 'Skin Fade',               price: 40,  duration: 35, desc: 'Sharp skin fade with crisp line-up.' },
    { id: 'hh-svc-lineup',         name: 'Line-Up / Edge-Up',       price: 15,  duration: 10, desc: 'Quick clean-up around hairline and edges.' },
    { id: 'hh-svc-shave',          name: 'Straight Razor Shave',    price: 35,  duration: 30, desc: 'Traditional hot-towel straight razor shave.' },
    { id: 'hh-svc-facial',         name: 'Gentleman\'s Facial',     price: 55,  duration: 45, desc: 'Deep cleanse, exfoliation, mask, and moisturizer.' },
    { id: 'hh-svc-color',          name: 'Hair Coloring',           price: 65,  duration: 60, desc: 'Full color or grey blending for a fresh look.' },
    { id: 'hh-svc-braids',         name: 'Braids / Cornrows',       price: 80,  duration: 90, desc: 'Custom braid styles. Duration varies by complexity.' },
    { id: 'hh-svc-design',         name: 'Hair Design / Pattern',   price: 45,  duration: 40, desc: 'Custom razor designs and patterns cut into the hair.' },
    { id: 'hh-svc-royale',         name: 'The Heritage Royale',     price: 95,  duration: 75, desc: 'Premium package: haircut + shave + facial + styling. The full experience.' },
  ];

  console.log('\n  💇  Customer Services:');
  for (const svc of customerServices) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: { name: svc.name, price: svc.price, duration: svc.duration, description: svc.desc },
      create: {
        id: svc.id,
        name: svc.name,
        description: svc.desc,
        price: svc.price,
        duration: svc.duration,
        type: 'CUSTOMER',
        shopId: SHOP_ID,
      },
    });
    console.log(`      ✅  ${svc.name}  — $${svc.price} / ${svc.duration}min`);
  }

  // ══════════════════════════════════════════════════════════════
  //  INTERNAL INVENTORY (products used in-house)
  // ══════════════════════════════════════════════════════════════
  const inventoryItems = [
    { id: 'hh-inv-pomade',        name: 'Suavecito Pomade (Original)',  price: 14.99, brand: 'Suavecito',       stock: 36,  reorder: 10 },
    { id: 'hh-inv-pomade-firme',  name: 'Suavecito Firme Hold',        price: 15.99, brand: 'Suavecito',       stock: 24,  reorder: 8 },
    { id: 'hh-inv-clippers-oil',  name: 'Clipper Oil',                 price: 6.99,  brand: 'Wahl',            stock: 12,  reorder: 4 },
    { id: 'hh-inv-shampoo',       name: 'Tea Tree Shampoo 33oz',       price: 32.00, brand: 'Paul Mitchell',   stock: 8,   reorder: 3 },
    { id: 'hh-inv-conditioner',   name: 'Tea Tree Conditioner 33oz',   price: 34.00, brand: 'Paul Mitchell',   stock: 6,   reorder: 3 },
    { id: 'hh-inv-aftershave',    name: 'Clubman Aftershave Lotion',   price: 9.50,  brand: 'Clubman Pinaud',  stock: 18,  reorder: 6 },
    { id: 'hh-inv-gel',           name: 'Eco Styler Gel (Black)',       price: 7.99,  brand: 'Eco Styler',      stock: 20,  reorder: 8 },
    { id: 'hh-inv-blade',         name: 'Feather Razor Blades (20pk)', price: 12.50, brand: 'Feather',         stock: 15,  reorder: 5 },
    { id: 'hh-inv-towel',         name: 'Barber Towels (12-pack)',     price: 18.00, brand: 'Generic',         stock: 10,  reorder: 3 },
    { id: 'hh-inv-cape',          name: 'Cutting Cape (Black)',        price: 22.00, brand: 'Barber Pro',      stock: 5,   reorder: 2 },
    { id: 'hh-inv-spray',         name: 'Barber Spray Bottle 16oz',   price: 4.99,  brand: 'Generic',         stock: 8,   reorder: 3 },
    { id: 'hh-inv-beard-oil',     name: 'Beard Oil (Sandalwood)',      price: 19.99, brand: 'Honest Amish',    stock: 14,  reorder: 5 },
    { id: 'hh-inv-wax',           name: 'Hair Wax (Matte)',           price: 16.99, brand: 'By Vilain',       stock: 22,  reorder: 8 },
    { id: 'hh-inv-disinfectant',  name: 'Barbicide Disinfectant 64oz', price: 16.00, brand: 'Barbicide',       stock: 4,   reorder: 2 },
    { id: 'hh-inv-neck-strip',    name: 'Neck Strips (5-roll box)',   price: 8.50,  brand: 'Generic',         stock: 6,   reorder: 2 },
  ];

  console.log('\n  📦  Inventory Items:');
  for (const item of inventoryItems) {
    await prisma.service.upsert({
      where: { id: item.id },
      update: { name: item.name, price: item.price, brand: item.brand },
      create: {
        id: item.id,
        name: item.name,
        price: item.price,
        duration: 0,
        type: 'INTERNAL',
        shopId: SHOP_ID,
        brand: item.brand,
        itemType: 'Supply',
      },
    });
    console.log(`      ✅  ${item.name}  — $${item.price} | Stock: ${item.stock} | Brand: ${item.brand}`);
  }

  // ══════════════════════════════════════════════════════════════
  //  SAMPLE CLIENTS
  // ══════════════════════════════════════════════════════════════
  const clients = [
    { id: 'hh-client-mike',   email: 'mike.chen@email.com',      name: 'Mike Chen',       phone: '+1-555-0201' },
    { id: 'hh-client-james',  email: 'james.brooks@email.com',   name: 'James Brooks',    phone: '+1-555-0202' },
    { id: 'hh-client-omar',   email: 'omar.hassan@email.com',    name: 'Omar Hassan',     phone: '+1-555-0203' },
    { id: 'hh-client-tyler',  email: 'tyler.wright@email.com',   name: 'Tyler Wright',    phone: '+1-555-0204' },
    { id: 'hh-client-carlos', email: 'carlos.mendez@email.com',  name: 'Carlos Mendez',   phone: '+1-555-0205' },
    { id: 'hh-client-david',  email: 'david.kim@email.com',      name: 'David Kim',       phone: '+1-555-0206' },
  ];

  console.log('\n  🧑  Sample Clients:');
  for (const c of clients) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { name: c.name },
      create: {
        id: c.id,
        email: c.email,
        name: c.name,
        role: 'CLIENT',
        shopId: SHOP_ID,
        barcode: barcode(c.email),
        marketingConsent: true,
      },
    });
    await prisma.shopClient.upsert({
      where: { userId_shopId: { userId: user.id, shopId: SHOP_ID } },
      create: { userId: user.id, shopId: SHOP_ID, phone: c.phone },
      update: { phone: c.phone }
    });
    console.log(`      ✅  ${user.name} (${user.email})`);
  }

  // ══════════════════════════════════════════════════════════════
  //  SAMPLE APPOINTMENTS (today + upcoming)
  // ══════════════════════════════════════════════════════════════
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  const appointments = [
    // Today — completed
    { id: 'hh-apt-01', clientId: 'hh-client-mike',   staffId: 'heritage-staff-marcus',  serviceId: 'hh-svc-fade',      hoursFromNow: -3, status: 'COMPLETED' as const, total: 40, tip: 8 },
    { id: 'hh-apt-02', clientId: 'hh-client-james',  staffId: 'heritage-staff-deshawn', serviceId: 'hh-svc-cut-beard', hoursFromNow: -2, status: 'COMPLETED' as const, total: 50, tip: 10 },
    // Today — scheduled (upcoming)
    { id: 'hh-apt-03', clientId: 'hh-client-omar',   staffId: 'heritage-staff-elena',   serviceId: 'hh-svc-color',     hoursFromNow: 1,  status: 'SCHEDULED' as const, total: 0, tip: 0 },
    { id: 'hh-apt-04', clientId: 'hh-client-tyler',  staffId: 'heritage-staff-marcus',  serviceId: 'hh-svc-royale',    hoursFromNow: 2,  status: 'SCHEDULED' as const, total: 0, tip: 0 },
    { id: 'hh-apt-05', clientId: 'hh-client-carlos', staffId: 'heritage-staff-deshawn', serviceId: 'hh-svc-mens-cut',  hoursFromNow: 3,  status: 'SCHEDULED' as const, total: 0, tip: 0 },
    // Yesterday — completed (for reports)
    { id: 'hh-apt-06', clientId: 'hh-client-david',  staffId: 'heritage-staff-marcus',  serviceId: 'hh-svc-shave',     hoursFromNow: -27, status: 'COMPLETED' as const, total: 35, tip: 7 },
    { id: 'hh-apt-07', clientId: 'hh-client-mike',   staffId: 'heritage-staff-elena',   serviceId: 'hh-svc-facial',    hoursFromNow: -26, status: 'COMPLETED' as const, total: 55, tip: 12 },
    { id: 'hh-apt-08', clientId: 'hh-client-omar',   staffId: 'heritage-staff-deshawn', serviceId: 'hh-svc-braids',    hoursFromNow: -25, status: 'COMPLETED' as const, total: 80, tip: 15 },
  ];

  console.log('\n  📅  Appointments:');
  for (const apt of appointments) {
    const svc = customerServices.find(s => s.id === apt.serviceId);
    const startTime = new Date(now.getTime() + apt.hoursFromNow * 60 * 60 * 1000);
    startTime.setMinutes(0, 0, 0);
    const endTime = new Date(startTime.getTime() + (svc?.duration || 30) * 60 * 1000);

    await prisma.appointment.upsert({
      where: { id: apt.id },
      update: {},
      create: {
        id: apt.id,
        startTime,
        endTime,
        status: apt.status,
        serviceId: apt.serviceId,
        userId: apt.clientId,
        staffId: apt.staffId,
        shopId: SHOP_ID,
        totalAmount: apt.total,
        tipAmount: apt.tip,
        paymentMethod: apt.status === 'COMPLETED' ? 'CARD' : null,
      },
    });
    const staffName = staffList.find(s => s.id === apt.staffId)?.name || apt.staffId;
    const clientName = clients.find(c => c.id === apt.clientId)?.name || apt.clientId;
    const statusEmoji = apt.status === 'COMPLETED' ? '✅' : '🕐';
    console.log(`      ${statusEmoji}  ${clientName} → ${staffName} | ${svc?.name} | ${apt.status}${apt.total > 0 ? ` | $${apt.total} + $${apt.tip} tip` : ''}`);
  }

  // ══════════════════════════════════════════════════════════════
  //  COMMISSION RULES
  // ══════════════════════════════════════════════════════════════
  console.log('\n  💰  Commission Rules:');
  const commissionRules = [
    { id: 'hh-comm-marcus-svc',  staffId: 'heritage-staff-marcus',  serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 55 },
    { id: 'hh-comm-deshawn-svc', staffId: 'heritage-staff-deshawn', serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 50 },
    { id: 'hh-comm-elena-svc',   staffId: 'heritage-staff-elena',   serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 50 },
    { id: 'hh-comm-jasmine-svc', staffId: 'heritage-staff-jasmine', serviceId: null, rateType: 'PERCENTAGE' as const, rateValue: 45 },
  ];

  for (const cr of commissionRules) {
    await prisma.commissionRule.upsert({
      where: { id: cr.id },
      update: { rateValue: cr.rateValue },
      create: { id: cr.id, shopId: SHOP_ID, staffId: cr.staffId, serviceId: cr.serviceId, rateType: cr.rateType, rateValue: cr.rateValue },
    });
    console.log(`      ✅  Staff ${cr.staffId.replace('heritage-staff-', '')}: ${cr.rateValue}% commission`);
  }

  // Also set per-user commission rates
  for (const [id, rate] of [
    ['heritage-staff-marcus', 55], ['heritage-staff-deshawn', 50], ['heritage-staff-elena', 50], ['heritage-staff-jasmine', 45],
  ] as [string, number][]) {
    await prisma.user.update({ where: { id }, data: { commissionRateService: rate, commissionRateProduct: 10 } });
  }

  // ══════════════════════════════════════════════════════════════
  //  DONE
  // ══════════════════════════════════════════════════════════════
  console.log('\n🎉  Heritage Haircuts seed complete!\n');
  console.log('   Summary:');
  console.log(`   ─────────────────────────────────`);
  console.log(`   Staff:              ${staffList.length} barbers`);
  console.log(`   Customer Services:  ${customerServices.length}`);
  console.log(`   Inventory Items:    ${inventoryItems.length}`);
  console.log(`   Sample Clients:     ${clients.length}`);
  console.log(`   Appointments:       ${appointments.length} (${appointments.filter(a => a.status === 'COMPLETED').length} completed, ${appointments.filter(a => a.status === 'SCHEDULED').length} upcoming)`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

