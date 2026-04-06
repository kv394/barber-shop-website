/**
 * Seed realistic bookings (appointments) and live waitlist for Heritage Haircuts.
 *
 * Run:
 *   npx tsx prisma/seed-heritage-bookings.ts
 *
 * Adds:
 *  - 14 days of past completed appointments (revenue data for reports)
 *  - Today's schedule (morning completed, afternoon upcoming)
 *  - 7 days of future bookings
 *  - 6 live waitlist entries for today
 *
 * Safe to re-run — skips existing IDs, clears & rebuilds today's waitlist.
 */

import { PrismaClient } from '@prisma/client';

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local'), override: false });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error('❌  DATABASE_URL not set'); process.exit(1); }


const prisma = new PrismaClient();

const SHOP_ID = 'cmn9kj24n0000lqzc7kcsmpst';

// ── Known IDs ──────────────────────────────────────────────────
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

// Service durations (minutes)
const SVC = {
  mens:    { id: 'hh-svc-mens-cut',   duration: 30,  price: 35 },
  kids:    { id: 'hh-svc-kids-cut',   duration: 25,  price: 25 },
  beard:   { id: 'hh-svc-beard-trim', duration: 15,  price: 20 },
  combo:   { id: 'hh-svc-cut-beard',  duration: 45,  price: 50 },
  fade:    { id: 'hh-svc-fade',       duration: 35,  price: 40 },
  lineup:  { id: 'hh-svc-lineup',     duration: 10,  price: 15 },
  shave:   { id: 'hh-svc-shave',      duration: 30,  price: 35 },
  facial:  { id: 'hh-svc-facial',     duration: 45,  price: 55 },
  color:   { id: 'hh-svc-color',      duration: 60,  price: 65 },
  braids:  { id: 'hh-svc-braids',     duration: 90,  price: 80 },
  design:  { id: 'hh-svc-design',     duration: 40,  price: 45 },
  royale:  { id: 'hh-svc-royale',     duration: 75,  price: 95 },
};

/** Build a Date for a given offset from today, at a specific hour:minute */
function dt(daysOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function endTime(start: Date, durationMins: number): Date {
  return new Date(start.getTime() + durationMins * 60_000);
}

// ── Appointment definitions ────────────────────────────────────
//   id prefix 'hb-' (heritage bookings) to avoid clashing with seed-heritage.ts
type AptDef = {
  id: string;
  clientId: string;
  staffId: string;
  svc: { id: string; duration: number; price: number };
  start: Date;
  status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'NO_SHOW';
  tip?: number;
  paymentMethod?: string;
  discount?: number;
};

const appointments: AptDef[] = [
  // ─── 14 days ago ───────────────────────────────────────────────
  { id: 'hb-d14-01', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-14, 9),     status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d14-02', clientId: CLIENTS.james,  staffId: STAFF.deshawn, svc: SVC.combo,  start: dt(-14, 10),    status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },
  { id: 'hb-d14-03', clientId: CLIENTS.omar,   staffId: STAFF.elena,   svc: SVC.color,  start: dt(-14, 11),    status: 'COMPLETED', tip: 15, paymentMethod: 'CASH' },
  { id: 'hb-d14-04', clientId: CLIENTS.david,  staffId: STAFF.marcus,  svc: SVC.shave,  start: dt(-14, 14),    status: 'COMPLETED', tip: 7,  paymentMethod: 'CARD' },

  // ─── 13 days ago ───────────────────────────────────────────────
  { id: 'hb-d13-01', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.royale, start: dt(-13, 10),    status: 'COMPLETED', tip: 20, paymentMethod: 'CARD' },
  { id: 'hb-d13-02', clientId: CLIENTS.carlos, staffId: STAFF.deshawn, svc: SVC.mens,   start: dt(-13, 11, 30),status: 'COMPLETED', tip: 5,  paymentMethod: 'CASH' },
  { id: 'hb-d13-03', clientId: CLIENTS.mike,   staffId: STAFF.elena,   svc: SVC.facial, start: dt(-13, 14),    status: 'COMPLETED', tip: 12, paymentMethod: 'CARD' },

  // ─── 11 days ago ───────────────────────────────────────────────
  { id: 'hb-d11-01', clientId: CLIENTS.james,  staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-11, 9),     status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d11-02', clientId: CLIENTS.omar,   staffId: STAFF.deshawn, svc: SVC.braids, start: dt(-11, 10),    status: 'COMPLETED', tip: 20, paymentMethod: 'CASH' },
  { id: 'hb-d11-03', clientId: CLIENTS.david,  staffId: STAFF.elena,   svc: SVC.shave,  start: dt(-11, 13),    status: 'NO_SHOW',   tip: 0 },
  { id: 'hb-d11-04', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.combo,  start: dt(-11, 15),    status: 'COMPLETED', tip: 10, paymentMethod: 'MOBILE' },

  // ─── 10 days ago ───────────────────────────────────────────────
  { id: 'hb-d10-01', clientId: CLIENTS.carlos, staffId: STAFF.marcus,  svc: SVC.design, start: dt(-10, 9, 30), status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },
  { id: 'hb-d10-02', clientId: CLIENTS.mike,   staffId: STAFF.deshawn, svc: SVC.combo,  start: dt(-10, 11),    status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },
  { id: 'hb-d10-03', clientId: CLIENTS.james,  staffId: STAFF.elena,   svc: SVC.color,  start: dt(-10, 13),    status: 'COMPLETED', tip: 12, paymentMethod: 'CARD' },

  // ─── 8 days ago ────────────────────────────────────────────────
  { id: 'hb-d08-01', clientId: CLIENTS.omar,   staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-8, 9),      status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d08-02', clientId: CLIENTS.tyler,  staffId: STAFF.deshawn, svc: SVC.braids, start: dt(-8, 10),     status: 'CANCELLED', tip: 0 },
  { id: 'hb-d08-03', clientId: CLIENTS.david,  staffId: STAFF.marcus,  svc: SVC.shave,  start: dt(-8, 13),     status: 'COMPLETED', tip: 7,  paymentMethod: 'CASH' },
  { id: 'hb-d08-04', clientId: CLIENTS.carlos, staffId: STAFF.elena,   svc: SVC.facial, start: dt(-8, 15),     status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },

  // ─── 7 days ago ────────────────────────────────────────────────
  { id: 'hb-d07-01', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-7, 9),      status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d07-02', clientId: CLIENTS.james,  staffId: STAFF.deshawn, svc: SVC.mens,   start: dt(-7, 10, 30), status: 'COMPLETED', tip: 5,  paymentMethod: 'CARD' },
  { id: 'hb-d07-03', clientId: CLIENTS.omar,   staffId: STAFF.elena,   svc: SVC.color,  start: dt(-7, 12),     status: 'COMPLETED', tip: 15, paymentMethod: 'CARD' },
  { id: 'hb-d07-04', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.royale, start: dt(-7, 14),     status: 'COMPLETED', tip: 20, paymentMethod: 'CARD' },
  { id: 'hb-d07-05', clientId: CLIENTS.david,  staffId: STAFF.deshawn, svc: SVC.beard,  start: dt(-7, 16),     status: 'COMPLETED', tip: 5,  paymentMethod: 'CASH' },

  // ─── 5 days ago ────────────────────────────────────────────────
  { id: 'hb-d05-01', clientId: CLIENTS.carlos, staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-5, 9),      status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d05-02', clientId: CLIENTS.mike,   staffId: STAFF.elena,   svc: SVC.facial, start: dt(-5, 10),     status: 'COMPLETED', tip: 12, paymentMethod: 'CARD' },
  { id: 'hb-d05-03', clientId: CLIENTS.james,  staffId: STAFF.deshawn, svc: SVC.combo,  start: dt(-5, 11, 30), status: 'COMPLETED', tip: 10, paymentMethod: 'MOBILE' },
  { id: 'hb-d05-04', clientId: CLIENTS.omar,   staffId: STAFF.marcus,  svc: SVC.design, start: dt(-5, 14),     status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },

  // ─── 3 days ago ────────────────────────────────────────────────
  { id: 'hb-d03-01', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.combo,  start: dt(-3, 9, 30),  status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },
  { id: 'hb-d03-02', clientId: CLIENTS.david,  staffId: STAFF.deshawn, svc: SVC.shave,  start: dt(-3, 11),     status: 'COMPLETED', tip: 7,  paymentMethod: 'CASH' },
  { id: 'hb-d03-03', clientId: CLIENTS.carlos, staffId: STAFF.elena,   svc: SVC.color,  start: dt(-3, 13),     status: 'COMPLETED', tip: 15, paymentMethod: 'CARD' },
  { id: 'hb-d03-04', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.lineup, start: dt(-3, 16, 30), status: 'COMPLETED', tip: 3,  paymentMethod: 'CASH' },

  // ─── 2 days ago ────────────────────────────────────────────────
  { id: 'hb-d02-01', clientId: CLIENTS.james,  staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-2, 9),      status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d02-02', clientId: CLIENTS.omar,   staffId: STAFF.deshawn, svc: SVC.braids, start: dt(-2, 10),     status: 'COMPLETED', tip: 15, paymentMethod: 'CARD' },
  { id: 'hb-d02-03', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.royale, start: dt(-2, 14),     status: 'COMPLETED', tip: 20, paymentMethod: 'CARD', discount: 10 },

  // ─── Yesterday ─────────────────────────────────────────────────
  { id: 'hb-d01-01', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(-1, 9),      status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d01-02', clientId: CLIENTS.david,  staffId: STAFF.deshawn, svc: SVC.shave,  start: dt(-1, 10, 30), status: 'COMPLETED', tip: 7,  paymentMethod: 'CASH' },
  { id: 'hb-d01-03', clientId: CLIENTS.carlos, staffId: STAFF.elena,   svc: SVC.mens,   start: dt(-1, 11),     status: 'COMPLETED', tip: 5,  paymentMethod: 'CARD' },
  { id: 'hb-d01-04', clientId: CLIENTS.james,  staffId: STAFF.marcus,  svc: SVC.combo,  start: dt(-1, 14),     status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },
  { id: 'hb-d01-05', clientId: CLIENTS.omar,   staffId: STAFF.deshawn, svc: SVC.design, start: dt(-1, 16),     status: 'COMPLETED', tip: 8,  paymentMethod: 'MOBILE' },

  // ─── TODAY — morning completed ─────────────────────────────────
  { id: 'hb-d00-01', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(0, 9),       status: 'COMPLETED', tip: 8,  paymentMethod: 'CARD' },
  { id: 'hb-d00-02', clientId: CLIENTS.james,  staffId: STAFF.deshawn, svc: SVC.combo,  start: dt(0, 9, 30),   status: 'COMPLETED', tip: 10, paymentMethod: 'CARD' },
  { id: 'hb-d00-03', clientId: CLIENTS.david,  staffId: STAFF.elena,   svc: SVC.facial, start: dt(0, 10),      status: 'COMPLETED', tip: 12, paymentMethod: 'CARD' },

  // ─── TODAY — afternoon scheduled ──────────────────────────────
  { id: 'hb-d00-04', clientId: CLIENTS.omar,   staffId: STAFF.marcus,  svc: SVC.braids, start: dt(0, 13),      status: 'SCHEDULED' },
  { id: 'hb-d00-05', clientId: CLIENTS.tyler,  staffId: STAFF.deshawn, svc: SVC.royale, start: dt(0, 14),      status: 'SCHEDULED' },
  { id: 'hb-d00-06', clientId: CLIENTS.carlos, staffId: STAFF.elena,   svc: SVC.color,  start: dt(0, 15),      status: 'SCHEDULED' },
  { id: 'hb-d00-07', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.lineup, start: dt(0, 17),      status: 'SCHEDULED' },

  // ─── Tomorrow ──────────────────────────────────────────────────
  { id: 'hb-d+1-01', clientId: CLIENTS.james,  staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(1, 9),       status: 'SCHEDULED' },
  { id: 'hb-d+1-02', clientId: CLIENTS.david,  staffId: STAFF.deshawn, svc: SVC.shave,  start: dt(1, 10),      status: 'SCHEDULED' },
  { id: 'hb-d+1-03', clientId: CLIENTS.omar,   staffId: STAFF.elena,   svc: SVC.color,  start: dt(1, 11),      status: 'SCHEDULED' },
  { id: 'hb-d+1-04', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.combo,  start: dt(1, 14),      status: 'SCHEDULED' },
  { id: 'hb-d+1-05', clientId: CLIENTS.carlos, staffId: STAFF.deshawn, svc: SVC.mens,   start: dt(1, 15, 30),  status: 'SCHEDULED' },

  // ─── 2 days ahead ──────────────────────────────────────────────
  { id: 'hb-d+2-01', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.royale, start: dt(2, 10),      status: 'SCHEDULED' },
  { id: 'hb-d+2-02', clientId: CLIENTS.james,  staffId: STAFF.elena,   svc: SVC.facial, start: dt(2, 11),      status: 'SCHEDULED' },
  { id: 'hb-d+2-03', clientId: CLIENTS.carlos, staffId: STAFF.deshawn, svc: SVC.braids, start: dt(2, 13),      status: 'SCHEDULED' },

  // ─── 3 days ahead ──────────────────────────────────────────────
  { id: 'hb-d+3-01', clientId: CLIENTS.omar,   staffId: STAFF.marcus,  svc: SVC.fade,   start: dt(3, 9),       status: 'SCHEDULED' },
  { id: 'hb-d+3-02', clientId: CLIENTS.tyler,  staffId: STAFF.deshawn, svc: SVC.combo,  start: dt(3, 11),      status: 'SCHEDULED' },
  { id: 'hb-d+3-03', clientId: CLIENTS.david,  staffId: STAFF.elena,   svc: SVC.color,  start: dt(3, 14),      status: 'SCHEDULED' },

  // ─── 4 days ahead ──────────────────────────────────────────────
  { id: 'hb-d+4-01', clientId: CLIENTS.mike,   staffId: STAFF.marcus,  svc: SVC.combo,  start: dt(4, 10),      status: 'SCHEDULED' },
  { id: 'hb-d+4-02', clientId: CLIENTS.james,  staffId: STAFF.deshawn, svc: SVC.mens,   start: dt(4, 11),      status: 'SCHEDULED' },

  // ─── 5 days ahead ──────────────────────────────────────────────
  { id: 'hb-d+5-01', clientId: CLIENTS.carlos, staffId: STAFF.marcus,  svc: SVC.design, start: dt(5, 9, 30),   status: 'SCHEDULED' },
  { id: 'hb-d+5-02', clientId: CLIENTS.omar,   staffId: STAFF.elena,   svc: SVC.facial, start: dt(5, 11),      status: 'SCHEDULED' },

  // ─── 7 days ahead ──────────────────────────────────────────────
  { id: 'hb-d+7-01', clientId: CLIENTS.tyler,  staffId: STAFF.marcus,  svc: SVC.royale, start: dt(7, 10),      status: 'SCHEDULED' },
  { id: 'hb-d+7-02', clientId: CLIENTS.david,  staffId: STAFF.deshawn, svc: SVC.shave,  start: dt(7, 11, 30),  status: 'SCHEDULED' },
  { id: 'hb-d+7-03', clientId: CLIENTS.mike,   staffId: STAFF.elena,   svc: SVC.color,  start: dt(7, 13),      status: 'SCHEDULED' },
];

// ── Waitlist definitions ───────────────────────────────────────
const waitlistEntries = [
  { clientName: 'Jordan Lee',      clientPhone: '+1 (404) 555-0301', serviceId: SVC.fade.id,   staffId: STAFF.marcus,  position: 1, status: 'WAITING' },
  { clientName: 'Sam Ortega',      clientPhone: '+1 (770) 555-0302', serviceId: SVC.mens.id,   staffId: null,          position: 2, status: 'WAITING' },
  { clientName: 'Kevin Jackson',   clientPhone: '+1 (678) 555-0303', serviceId: SVC.lineup.id, staffId: STAFF.deshawn, position: 3, status: 'WAITING' },
  { clientName: 'Malik Thompson',  clientPhone: '+1 (404) 555-0304', serviceId: SVC.combo.id,  staffId: STAFF.marcus,  position: 4, status: 'WAITING' },
  { clientName: 'Ryan Cho',        clientPhone: '+1 (770) 555-0305', serviceId: SVC.beard.id,  staffId: null,          position: 5, status: 'WAITING' },
  { clientName: 'Andre Williams',  clientPhone: '+1 (678) 555-0306', serviceId: SVC.fade.id,   staffId: STAFF.elena,   position: 6, status: 'WAITING' },
];

// ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding bookings & waitlist for Heritage Haircuts…\n');

  const shop = await prisma.shop.findUnique({ where: { id: SHOP_ID } });
  if (!shop) { console.error('❌  Shop not found'); process.exit(1); }
  console.log(`  📍  Shop: ${shop.name}\n`);

  // ── APPOINTMENTS ──────────────────────────────────────────────
  console.log('  📅  Appointments:');
  let created = 0, skipped = 0;

  for (const apt of appointments) {
    const start = apt.start;
    const end   = endTime(start, apt.svc.duration);
    const total = apt.svc.price - (apt.discount || 0);

    const existing = await prisma.appointment.findUnique({ where: { id: apt.id } });
    if (existing) { skipped++; continue; }

    await prisma.appointment.create({
      data: {
        id:            apt.id,
        startTime:     start,
        endTime:       end,
        status:        apt.status,
        serviceId:     apt.svc.id,
        userId:        apt.clientId,
        staffId:       apt.staffId,
        shopId:        SHOP_ID,
        totalAmount:   apt.status === 'COMPLETED' ? total : 0,
        tipAmount:     apt.tip || 0,
        discount:      apt.discount || 0,
        paymentMethod: apt.paymentMethod || null,
        subtotal:      apt.status === 'COMPLETED' ? apt.svc.price : 0,
      },
    });
    created++;

    const dayLabel = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeLabel = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const icon = apt.status === 'COMPLETED' ? '✅' : apt.status === 'CANCELLED' ? '❌' : apt.status === 'NO_SHOW' ? '👻' : '🕐';
    console.log(`      ${icon}  [${dayLabel} ${timeLabel}]  ${apt.svc.id.replace('hh-svc-', '')}  →  staff:${apt.staffId.replace('heritage-staff-', '')}  ${apt.status === 'COMPLETED' ? `$${total}+$${apt.tip || 0}tip` : apt.status}`);
  }

  console.log(`\n      ➜  Created: ${created}  |  Skipped (already exist): ${skipped}\n`);

  // ── WAITLIST ──────────────────────────────────────────────────
  console.log('  📋  Waitlist (clearing today\'s entries and rebuilding):');

  // Delete all non-terminal entries so we get a clean list
  await prisma.waitlist.deleteMany({
    where: { shopId: SHOP_ID, status: { in: ['WAITING', 'SERVING'] } },
  });

  await prisma.waitlist.createMany({
    data: waitlistEntries.map(w => ({
      clientName:  w.clientName,
      clientPhone: w.clientPhone,
      serviceId:   w.serviceId,
      staffId:     w.staffId,
      position:    w.position,
      status:      w.status,
      shopId:      SHOP_ID,
    })),
  });

  for (const w of waitlistEntries) {
    const svcName = Object.values(SVC).find(s => s.id === w.serviceId)?.id.replace('hh-svc-', '') || '';
    const staffName = w.staffId ? w.staffId.replace('heritage-staff-', '') : 'any';
    console.log(`      #${w.position}  ${w.clientName}  (${w.clientPhone})  →  ${svcName}  /  ${staffName}`);
  }

  // ── SUMMARY ───────────────────────────────────────────────────
  const totalApts = await prisma.appointment.count({ where: { shopId: SHOP_ID } });
  const completedApts = await prisma.appointment.count({ where: { shopId: SHOP_ID, status: 'COMPLETED' } });
  const scheduledApts = await prisma.appointment.count({ where: { shopId: SHOP_ID, status: 'SCHEDULED' } });
  const cancelledApts = await prisma.appointment.count({ where: { shopId: SHOP_ID, status: 'CANCELLED' } });
  const noShowApts    = await prisma.appointment.count({ where: { shopId: SHOP_ID, status: 'NO_SHOW' } });
  const waitCount     = await prisma.waitlist.count({ where: { shopId: SHOP_ID, status: 'WAITING' } });

  console.log('\n🎉  Booking seed complete!\n');
  console.log('   ─────────────────────────────────────────────');
  console.log(`   Total appointments:  ${totalApts}`);
  console.log(`     ✅ Completed:      ${completedApts}`);
  console.log(`     🕐 Scheduled:      ${scheduledApts}`);
  console.log(`     ❌ Cancelled:      ${cancelledApts}`);
  console.log(`     👻 No-show:        ${noShowApts}`);
  console.log(`   📋 Waitlist (live):  ${waitCount}`);
  console.log('');
}

main()
  .catch(e => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

