/**
 * Seed script — creates a demo shop + one dummy user per role category.
 *
 * Roles seeded:
 *   1. SITE_ADMIN   — platform-wide admin (no shop assignment)
 *   2. SHOP_ADMIN    — manages the demo shop
 *   3. STAFF         — barber/stylist at the demo shop
 *   4. CLIENT        — customer who books appointments
 *   5. ATTENDANCE_KIOSK — kiosk device user for clock-in/out
 *
 * Run:
 *   npx tsx prisma/seed.ts
 *
 * Safe to run multiple times — uses upsert so it won't duplicate.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set. Export it first.');
  process.exit(1);
}

const prisma = new PrismaClient();

function barcode(seed: string): string {
  return crypto
    .createHash('sha256')
    .update(`${seed}-${process.env.JWT_SECRET || 'secret'}`)
    .digest('hex')
    .substring(0, 12)
    .toUpperCase();
}

async function main() {
  console.log('🌱  Seeding database…\n');

  // ── 1. Demo Shop ────────────────────────────────────────────────
  const shop = await prisma.shop.upsert({
    where: { id: 'demo-shop-001' },
    update: {},
    create: {
      id: 'demo-shop-001',
      name: 'Downtown Barbers',
      description: 'Premium grooming experience in the heart of the city.',
      template: 'modern',
      customization: {
        primaryColor: '#d4a853',
        secondaryColor: '#1e293b',
        businessHours: {
          monday:    { open: '09:00', close: '18:00' },
          tuesday:   { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday:  { open: '09:00', close: '20:00' },
          friday:    { open: '09:00', close: '20:00' },
          saturday:  { open: '10:00', close: '16:00' },
          sunday:    null,
        },
      },
    },
  });
  console.log(`  ✅  Shop: ${shop.name}  (${shop.id})`);

  // ── 2. Demo Services ───────────────────────────────────────────
  const services = [
    { id: 'svc-haircut', name: 'Classic Haircut', price: 35, duration: 30, type: 'CUSTOMER' as const },
    { id: 'svc-beard',   name: 'Beard Trim',     price: 20, duration: 15, type: 'CUSTOMER' as const },
    { id: 'svc-combo',   name: 'Haircut + Beard', price: 50, duration: 45, type: 'CUSTOMER' as const },
    { id: 'svc-shampoo', name: 'Premium Shampoo', price: 12, duration: 0,  type: 'INTERNAL' as const, brand: 'American Crew' },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: {
        id: svc.id,
        name: svc.name,
        price: svc.price,
        duration: svc.duration,
        type: svc.type,
        shopId: shop.id,
        brand: (svc as any).brand ?? null,
      },
    });
  }
  console.log(`  ✅  Services: ${services.length} created`);

  // ── 3. Users — one per role ────────────────────────────────────

  // SITE_ADMIN — not tied to any shop
  const siteAdmin = await prisma.user.upsert({
    where: { email: 'siteadmin@demo.barbersaas.com' },
    update: {},
    create: {
      id: 'seed-super-admin',
      email: 'siteadmin@demo.barbersaas.com',
      name: 'Alex Super',
      role: 'SITE_ADMIN',
      barcode: barcode('siteadmin@demo.barbersaas.com'),
    },
  });
  console.log(`  ✅  SITE_ADMIN : ${siteAdmin.email}`);

  // SHOP_ADMIN — manages the demo shop
  const shopAdmin = await prisma.user.upsert({
    where: { email: 'shopadmin@demo.barbersaas.com' },
    update: {},
    create: {
      id: 'seed-shop-admin',
      email: 'shopadmin@demo.barbersaas.com',
      name: 'Jordan Shop-Admin',
      role: 'SHOP_ADMIN',
      shopId: shop.id,
      barcode: barcode('shopadmin@demo.barbersaas.com'),
    },
  });
  console.log(`  ✅  SHOP_ADMIN  : ${shopAdmin.email}  → ${shop.name}`);

  // STAFF — barber at the demo shop
  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo.barbersaas.com' },
    update: {},
    create: {
      id: 'seed-staff',
      email: 'staff@demo.barbersaas.com',
      name: 'Taylor Barber',
      role: 'STAFF',
      shopId: shop.id,
      canManageInventory: true,
      barcode: barcode('staff@demo.barbersaas.com'),
      workingHours: {
        monday:    { open: '09:00', close: '17:00' },
        tuesday:   { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday:  { open: '10:00', close: '19:00' },
        friday:    { open: '10:00', close: '19:00' },
        saturday:  { open: '10:00', close: '15:00' },
        sunday:    null,
      },
    },
  });
  console.log(`  ✅  STAFF       : ${staff.email}  → ${shop.name}`);

  // CLIENT — regular customer
  const client = await prisma.user.upsert({
    where: { email: 'client@demo.barbersaas.com' },
    update: {},
    create: {
      id: 'seed-client',
      email: 'client@demo.barbersaas.com',
      name: 'Sam Customer',
      role: 'CLIENT',
      shopId: shop.id,
      phone: '+1-555-0100',
      barcode: barcode('client@demo.barbersaas.com'),
      marketingConsent: true,
      smsConsent: true,
      birthday: new Date('1990-06-15'),
    },
  });
  console.log(`  ✅  CLIENT      : ${client.email}  → ${shop.name}`);

  // ATTENDANCE_KIOSK — tablet at the front desk
  const kiosk = await prisma.user.upsert({
    where: { email: 'kiosk@demo.barbersaas.com' },
    update: {},
    create: {
      id: 'seed-kiosk',
      email: 'kiosk@demo.barbersaas.com',
      name: 'Downtown Kiosk',
      role: 'ATTENDANCE_KIOSK',
      shopId: shop.id,
      barcode: barcode('kiosk@demo.barbersaas.com'),
    },
  });
  console.log(`  ✅  KIOSK       : ${kiosk.email}  → ${shop.name}`);

  // ── 4. Sample appointment (today) ──────────────────────────────
  const now = new Date();
  const aptStart = new Date(now);
  aptStart.setHours(14, 0, 0, 0);
  const aptEnd = new Date(aptStart);
  aptEnd.setMinutes(aptEnd.getMinutes() + 30);

  await prisma.appointment.upsert({
    where: { id: 'seed-apt-001' },
    update: {},
    create: {
      id: 'seed-apt-001',
      startTime: aptStart,
      endTime: aptEnd,
      status: 'SCHEDULED',
      serviceId: 'svc-haircut',
      userId: client.id,
      staffId: staff.id,
      shopId: shop.id,
    },
  });
  console.log(`  ✅  Appointment : ${client.name} with ${staff.name} @ ${aptStart.toLocaleTimeString()}`);

  // ── 5. Sample completed appointment (for reports) ──────────────
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(11, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setMinutes(yesterdayEnd.getMinutes() + 45);

  await prisma.appointment.upsert({
    where: { id: 'seed-apt-002' },
    update: {},
    create: {
      id: 'seed-apt-002',
      startTime: yesterday,
      endTime: yesterdayEnd,
      status: 'COMPLETED',
      serviceId: 'svc-combo',
      userId: client.id,
      staffId: staff.id,
      shopId: shop.id,
      totalAmount: 50,
      tipAmount: 10,
      paymentMethod: 'CARD',
    },
  });
  console.log(`  ✅  Completed   : $50 + $10 tip (yesterday)`);

  // ── Done ───────────────────────────────────────────────────────
  console.log('\n🎉  Seed complete! Here are the login emails:\n');
  console.log('   Role              Email');
  console.log('   ────────────────  ──────────────────────────────────');
  console.log('   SITE_ADMIN       siteadmin@demo.barbersaas.com');
  console.log('   SHOP_ADMIN        shopadmin@demo.barbersaas.com');
  console.log('   STAFF             staff@demo.barbersaas.com');
  console.log('   CLIENT            client@demo.barbersaas.com');
  console.log('   ATTENDANCE_KIOSK  kiosk@demo.barbersaas.com');
  console.log('');
  console.log(`   Shop: "${shop.name}" (ID: ${shop.id})`);
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

