import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import StaffAvailability from '@/components/shop-admin/StaffAvailability';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { serialize } from '@/lib/serialize';

async function getShopData(shopId: string, userId: string, date: string, from: string, to: string) {
 const data = await getShopLayoutData(userId, shopId);
 if (!data) return null; // Allow SHOP_ADMIN, STAFF, and SITE_ADMIN

 const shop = data.shop;

 const targetDate = new Date(date);
 const nextDate = new Date(targetDate);
 nextDate.setDate(targetDate.getDate() + 1);

 // Check if current user is clocked in
 const currentUserObj = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: userId }] } });
 const actualUserId = currentUserObj?.id || userId;

 const activeLog = await prisma.timeLog.findFirst({
 where: {
 userId: actualUserId,
 shopId: shopId,
 clockOut: null,
 },
 });

 const staffMembers = await prisma.user.findMany({
 where: { shopId: shopId, role: 'STAFF' },
 include: {
 staffAppointments: {
 where: { startTime: { gte: targetDate, lt: nextDate } },
 },
 leaves: {
 where: { date: targetDate },
 },
 },
 });

 const shopHours = (shop.customization as any)?.businessHours || {};
 const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getUTCDay()];

 const staffWithSchedule = staffMembers.map((staff: any) => {
 if (staff.leaves.length > 0) {
 return { ...staff, schedule: [], isOnLeave: true, using: 'leave' };
 }

 const individualHours = (staff.workingHours as any) || {};
 let hoursForDay = individualHours[dayOfWeek];
 let using = 'individual';

 if (hoursForDay === null) {
 return { ...staff, schedule: [], isOnLeave: false, using: 'not-working' };
 }

 if (!hoursForDay) {
 hoursForDay = shopHours[dayOfWeek];
 using = 'shop';
 }

 if (!hoursForDay) {
 hoursForDay = { open: '09:00', close: '17:00' };
 using = 'default';
 }

 const schedule = [];
 const [openHour, openMin] = hoursForDay.open.split(':').map(Number);
 const [closeHour, closeMin] = hoursForDay.close.split(':').map(Number);

 let currentSlotTime = new Date(targetDate);
 currentSlotTime.setUTCHours(openHour, openMin, 0, 0);

 const closingTime = new Date(targetDate);
 closingTime.setUTCHours(closeHour, closeMin, 0, 0);

 const slotDuration = 30 * 60000;

 const [fromHour, fromMin] = from.split(':').map(Number);
 const [toHour, toMin] = to.split(':').map(Number);

 while (currentSlotTime < closingTime) {
 const slotHour = currentSlotTime.getUTCHours();
 const slotMin = currentSlotTime.getUTCMinutes();

 if (slotHour > toHour || (slotHour === toHour && slotMin >= toMin)) break;

 if (slotHour >= fromHour && (slotHour > fromHour || slotMin >= fromMin)) {
 const slotEndTime = new Date(currentSlotTime.getTime() + slotDuration);
 const booking = staff.staffAppointments.find((apt: any) => {
 const aptStart = new Date(apt.startTime);
 const aptEnd = new Date(apt.endTime);
 return currentSlotTime < aptEnd && slotEndTime > aptStart;
 });
 schedule.push({
 time: currentSlotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }),
 isoTime: `${currentSlotTime.getUTCHours().toString().padStart(2, '0')}:${currentSlotTime.getUTCMinutes().toString().padStart(2, '0')}`,
 isBooked: !!booking,
 });
 }
 currentSlotTime = new Date(currentSlotTime.getTime() + slotDuration);
 }
 return { ...staff, schedule, isOnLeave: false, using };
 });

 staffWithSchedule.sort((a: any, b: any) => {
 if (a.id === actualUserId) return -1;
 if (b.id === actualUserId) return 1;
 const nameA = (a.name || a.email || '').toLowerCase();
 const nameB = (b.name || b.email || '').toLowerCase();
 return nameA.localeCompare(nameB);
 });

 return {
 shop: serialize(shop),
 shopSlug: data.shopSlug,
 userRole: data.userRole,
 staff: serialize(staffWithSchedule),
 isClockedIn: !!activeLog,
 actualUserId,
 };
}

export default async function StaffBookingPage({
 params,
 searchParams,
}: {
 params: Promise<{ shopId: string }>;
 searchParams: Promise<{ date?: string; from?: string; to?: string }>;
}) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 const userId = user?.id;
 if (!userId) redirect('/sign-in');

 const { shopId } = await params;
 const resolvedSearchParams = await searchParams;
 const selectedDate = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
 const fromTime = resolvedSearchParams.from || '00:00';
 const toTime = resolvedSearchParams.to || '23:59';

 const shopData = await getShopData(shopId, userId, selectedDate, fromTime, toTime);

 if (!shopData) {
 return <div className="p-8 text-crm-text">You do not have access to this page.</div>;
 }

 const { shop, shopSlug, userRole, staff, isClockedIn, actualUserId } = shopData;

 return (
 <ShopAdminLayout
 shopName={shop.name}
 shopSlug={shopSlug}
 pageTitle="Staff Availability"
 shopId={shopId}
 userRole={userRole}
 activeTab="staff"
 >
 <div className="flex justify-end mb-4">
 {userRole === 'SHOP_ADMIN' && (
 <a href={`/shop/${shopId}/settings/team`} className="bg-crm-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-status-pending transition-colors">
 + Onboard Staff
 </a>
 )}
 </div>
 <StaffAvailability defaultDate={selectedDate} defaultFrom={fromTime} defaultTo={toTime} staff={staff} />
 </ShopAdminLayout>
 );
}
