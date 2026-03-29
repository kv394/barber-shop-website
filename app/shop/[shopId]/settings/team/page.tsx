import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import TeamDashboardClient from '@/app/components/TeamDashboardClient';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, date: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== 'SUPER_ADMIN' && user.shopId !== shopId)) return null;

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return null;

  const targetDate = new Date(date);
  const rolesToFetch: ('SHOP_ADMIN' | 'STAFF')[] = user.role === 'SUPER_ADMIN' ? ['SHOP_ADMIN'] : ['SHOP_ADMIN', 'STAFF'];
  const allStaff = await prisma.user.findMany({
    where: { shopId: shopId, role: { in: rolesToFetch } },
    include: {
      staffAppointments: { where: { startTime: { gte: targetDate, lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) } } },
      leaves: { where: { date: targetDate } },
    },
  });

  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getUTCDay()];

  const staffWithSchedule = allStaff.map(staff => {
    const individualHours = (staff.workingHours as any) || {};
    let hoursForDay = individualHours[dayOfWeek];
    const isExplicitlyOff = hoursForDay === null;
    if (isExplicitlyOff) return { ...staff, schedule: [], isOnLeave: false, using: 'not-working', dayOfWeek, openTime: null, closeTime: null, isWorking: false, workingHours: individualHours };
    if (!hoursForDay) hoursForDay = (shop.customization as any)?.businessHours?.[dayOfWeek];
    if (!hoursForDay) return { ...staff, schedule: [], isOnLeave: false, using: 'not-set', dayOfWeek, openTime: '09:00', closeTime: '17:00', isWorking: false, workingHours: individualHours };
    
    const schedule = [];
    const [openHour, openMin] = hoursForDay.open.split(':').map(Number);
    const [closeHour, closeMin] = hoursForDay.close.split(':').map(Number);
    let currentSlotTime = new Date(targetDate);
    currentSlotTime.setUTCHours(openHour, openMin, 0, 0);
    const closingTime = new Date(targetDate);
    closingTime.setUTCHours(closeHour, closeMin, 0, 0);
    while (currentSlotTime < closingTime) {
      const slotEndTime = new Date(currentSlotTime.getTime() + 30 * 60000);
      const booking = staff.staffAppointments.find(apt => new Date(apt.startTime) < slotEndTime && new Date(apt.endTime) > currentSlotTime);
      const onLeave = staff.leaves.find(l => new Date(l.startTime) < slotEndTime && new Date(l.endTime) > currentSlotTime);
      schedule.push({
        time: currentSlotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }),
        isBooked: !!booking,
        isOnLeave: !!onLeave,
      });
      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30);
    }
    return { ...staff, schedule, isOnLeave: staff.leaves.length > 0, dayOfWeek, openTime: hoursForDay.open, closeTime: hoursForDay.close, isWorking: true, workingHours: individualHours };
  });

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    userRole: user.role, 
    staff: JSON.parse(JSON.stringify(staffWithSchedule)) 
  };
}

async function inviteUser(formData: FormData) {
  'use server';
  const email = formData.get('email') as string;
  const role = formData.get('role') as 'SHOP_ADMIN' | 'STAFF';
  const shopId = formData.get('shopId') as string;
  if (!email || !role || !shopId) return;

  const userBarcode = crypto.createHash('sha256').update(`${email}-${process.env.JWT_SECRET || 'secret'}`).digest('hex').substring(0, 12).toUpperCase();
  await prisma.user.upsert({
    where: { email },
    update: { role, shopId },
    create: {
      id: `invited_${crypto.randomBytes(8).toString('hex')}`,
      email,
      role,
      shopId,
      barcode: userBarcode,
    },
  });
  revalidatePath(`/shop/${shopId}/settings/team`);
}

async function addLeave(formData: FormData) {
    'use server';
    const staffId = formData.get('staffId') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const shopId = formData.get('shopId') as string;
    if (!staffId || !date || !startTime || !endTime || !shopId) return;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setUTCHours(startHour, startMinute, 0, 0);

    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endDate = new Date(date);
    endDate.setUTCHours(endHour, endMinute, 0, 0);

    await prisma.leave.create({
        data: {
            userId: staffId,
            shopId,
            date: new Date(date),
            startTime: startDate,
            endTime: endDate,
        },
    });
    revalidatePath(`/shop/${shopId}/settings/team?date=${date}`);
}

async function removeLeave(formData: FormData) {
    'use server';
    const staffId = formData.get('staffId') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const shopId = formData.get('shopId') as string;
    if (!staffId || !date || !startTime || !endTime || !shopId) return;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setUTCHours(startHour, startMinute, 0, 0);

    const [endHour, endMinute] = endTime.split(':').map(Number);
    const endDate = new Date(date);
    endDate.setUTCHours(endHour, endMinute, 0, 0);

    // Delete all leaves for this staff member on this date that overlap the selected range
    await prisma.leave.deleteMany({
        where: {
            userId: staffId,
            shopId: shopId,
            date: new Date(date),
            startTime: { lt: endDate },
            endTime: { gt: startDate },
        },
    });
    revalidatePath(`/shop/${shopId}/settings/team?date=${date}`);
}

async function updateDayHours(formData: FormData) {
    'use server';
    const staffId = formData.get('staffId') as string;
    const shopId = formData.get('shopId') as string;
    const dayOfWeek = formData.get('dayOfWeek') as string;
    const isWorking = formData.get('isWorking') === 'true';
    const openTime = formData.get('openTime') as string;
    const closeTime = formData.get('closeTime') as string;
    const date = formData.get('date') as string;
    if (!staffId || !shopId || !dayOfWeek) return;

    const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { workingHours: true } });
    const currentHours = (staff?.workingHours as any) || {};

    if (isWorking && openTime && closeTime) {
        currentHours[dayOfWeek] = { open: openTime, close: closeTime };
    } else {
        currentHours[dayOfWeek] = null;
    }

    await prisma.user.update({
        where: { id: staffId },
        data: { workingHours: currentHours },
    });
    revalidatePath(`/shop/${shopId}/settings/team?date=${date}`);
}

export default async function TeamDashboardPage({ params, searchParams }: { params: { shopId: string }, searchParams: { date?: string }}) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];
  const pageData = await getPageData(params.shopId, userId, selectedDate);

  if (!pageData) return <div className="p-8 text-white">Access Denied.</div>;

  const { shop, userRole, staff } = pageData;
  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  
  // Actually, check if the shop already has an admin. A SUPER_ADMIN only sees SHOP_ADMIN members but wait, 
  // user.findMany was updated to fetch `['SHOP_ADMIN', 'STAFF']` or `['SHOP_ADMIN']`. 
  // Let's ensure accurate counting for `SHOP_ADMIN`:
  const canAddShopAdmin = userRole === 'SUPER_ADMIN' && !staff.some((s: any) => s.role === 'SHOP_ADMIN');

  return (
    <ShopAdminLayout shopName={shop.name} shopSlug={shopSlug} pageTitle="Team Dashboard" shopId={params.shopId} userRole={userRole} activeTab="team">

      {/* ═══ Invite Section ═══ */}
      <div className="mb-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-gold via-brand-gold/60 to-transparent" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-xl">✉️</div>
            <div>
              <h3 className="text-lg font-bold text-white">Invite Team Member</h3>
              <p className="text-xs text-gray-500">Add staff or admins to your shop</p>
            </div>
          </div>

          <form action={inviteUser} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <input type="hidden" name="shopId" value={shop.id} />
            <div className="md:col-span-6">
              <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">📧 Email</label>
              <input type="email" name="email" required placeholder="team@example.com"
                className="w-full p-2.5 rounded-lg border border-slate-600 bg-slate-800/80 text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">👤 Role</label>
              <select name="role" defaultValue={userRole === 'SUPER_ADMIN' ? 'SHOP_ADMIN' : 'STAFF'}
                style={{ colorScheme: 'dark' }}
                className="w-full p-2.5 rounded-lg border border-slate-600 bg-slate-800/80 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all">
                {userRole === 'SHOP_ADMIN' && <option value="STAFF">Staff</option>}
                {userRole === 'SUPER_ADMIN' && (
                  <>
                    <option value="SHOP_ADMIN">Shop Admin</option>
                    <option value="ATTENDANCE_KIOSK">Attendance Kiosk</option>
                  </>
                )}
              </select>
            </div>
            <div className="md:col-span-3">
              <button type="submit" disabled={userRole === 'SUPER_ADMIN' && !canAddShopAdmin}
                className="w-full bg-brand-gold text-brand-dark font-bold py-2.5 px-6 rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-brand-gold/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Invite Member
              </button>
            </div>
          </form>

          {!canAddShopAdmin && userRole === 'SUPER_ADMIN' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-500/20">
              <span>⚠️</span>
              <span>A Shop Admin already exists. Remove them to assign a new one.</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Date Picker + Staff Cards (client-side refresh) ═══ */}
      <TeamDashboardClient
        shopId={params.shopId}
        initialDate={selectedDate}
        initialStaff={staff}
        addLeaveAction={addLeave}
        removeLeaveAction={removeLeave}
        updateDayHoursAction={updateDayHours}
      />
    </ShopAdminLayout>
  );
}
