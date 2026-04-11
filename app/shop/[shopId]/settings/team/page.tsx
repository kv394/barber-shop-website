import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import TeamDashboardClient from '@/components/shop-admin/TeamDashboardClient';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, date: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null;

  const shop = data.shop;
  const targetDate = new Date(date);
  
  // Super Admins manage SHOP_ADMINs and ATTENDANCE_KIOSKs. 
  // Shop Admins manage STAFF.
  const rolesToFetch: any[] = data.isSuperAdmin ? ['SHOP_ADMIN', 'ATTENDANCE_KIOSK'] : ['SHOP_ADMIN', 'STAFF'];
  
  const [allStaff, kioskUser] = await Promise.all([
    prisma.user.findMany({
      where: { shopId: shopId, role: { in: rolesToFetch } },
      include: {
        staffAppointments: { where: { startTime: { gte: targetDate, lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) } } },
        leaves: { where: { date: targetDate } },
        timeLogs: { where: { clockIn: { gte: targetDate, lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) } }, orderBy: { clockIn: 'desc' }, take: 1 }
      },
    }),
    prisma.user.findFirst({
      where: { shopId, role: 'ATTENDANCE_KIOSK' }
    })
  ]);

  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getUTCDay()];

  const staffWithSchedule = allStaff.map((staff: any) => {
    // Skip schedule calculation for Kiosks
    if (staff.role === 'ATTENDANCE_KIOSK') {
       return { ...staff, schedule: [], isOnLeave: false, using: 'not-working' };
    }

    const individualHours = (staff.workingHours as any) || {};
    let hoursForDay = individualHours[dayOfWeek];
    const isExplicitlyOff = hoursForDay === null;
    
    // Check if clocked in today (has a log, but no clockOut time)
    const latestLog = staff.timeLogs?.[0];
    const isClockedIn = latestLog && !latestLog.clockOut;

    if (isExplicitlyOff) return { ...staff, schedule: [], isOnLeave: false, using: 'not-working', dayOfWeek, openTime: null, closeTime: null, isWorking: false, workingHours: individualHours, isClockedIn };
    if (!hoursForDay) hoursForDay = (shop.customization as any)?.businessHours?.[dayOfWeek];
    if (!hoursForDay) return { ...staff, schedule: [], isOnLeave: false, using: 'not-set', dayOfWeek, openTime: '09:00', closeTime: '17:00', isWorking: false, workingHours: individualHours, isClockedIn };
    
    const schedule = [];
    const [openHour, openMin] = hoursForDay.open.split(':').map(Number);
    const [closeHour, closeMin] = hoursForDay.close.split(':').map(Number);
    let currentSlotTime = new Date(targetDate);
    currentSlotTime.setUTCHours(openHour, openMin, 0, 0);
    const closingTime = new Date(targetDate);
    closingTime.setUTCHours(closeHour, closeMin, 0, 0);
    while (currentSlotTime < closingTime) {
      const slotEndTime = new Date(currentSlotTime.getTime() + 30 * 60000);
      const booking = staff.staffAppointments.find((apt: any) => new Date(apt.startTime) < slotEndTime && new Date(apt.endTime) > currentSlotTime);
      const onLeave = staff.leaves.find((l: any) => new Date(l.startTime) < slotEndTime && new Date(l.endTime) > currentSlotTime);
      schedule.push({
        time: currentSlotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }),
        isBooked: !!booking,
        isOnLeave: !!onLeave,
      });
      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30);
    }
    return { ...staff, schedule, isOnLeave: staff.leaves.length > 0, dayOfWeek, openTime: hoursForDay.open, closeTime: hoursForDay.close, isWorking: true, workingHours: individualHours, isClockedIn };
  });

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    staff: JSON.parse(JSON.stringify(staffWithSchedule)),
    kioskUser: kioskUser ? JSON.parse(JSON.stringify(kioskUser)) : null
  };
}

async function inviteUser(formData: FormData) {
  'use server';
  const email = formData.get('email') as string;
  const role = formData.get('role') as 'SHOP_ADMIN' | 'STAFF' | 'ATTENDANCE_KIOSK';
  const shopId = formData.get('shopId') as string;
  if (!email || !role || !shopId) return;

  // SECURITY: Verify the caller is authorized to invite users to this shop
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return;
  const caller = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: user?.email || '' }] } });
  if (!caller) return;
  if (caller.role !== 'SUPER_ADMIN' && (caller.role !== 'SHOP_ADMIN' || caller.shopId !== shopId)) return;
  // Only SUPER_ADMIN can assign SHOP_ADMIN or ATTENDANCE_KIOSK roles
  if ((role === 'SHOP_ADMIN' || role === 'ATTENDANCE_KIOSK') && caller.role !== 'SUPER_ADMIN') return;

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

async function removeUser(formData: FormData) {
  'use server';
  const targetUserId = formData.get('userId') as string;
  const shopId = formData.get('shopId') as string;
  if (!targetUserId || !shopId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return;
  const caller = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: user?.email || '' }] } });
  if (!caller) return;
  if (caller.role !== 'SUPER_ADMIN' && (caller.role !== 'SHOP_ADMIN' || caller.shopId !== shopId)) return;

  await prisma.user.update({
    where: { id: targetUserId },
    data: { shopId: null, role: 'CLIENT' }
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

    // SECURITY: Verify caller is authorized
    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
    if (!userId) return;
    const data = await getShopLayoutData(userId, shopId);
    if (!data) return;
    // SECURITY: Verify target staff belongs to this shop
    const targetStaff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!targetStaff || targetStaff.shopId !== shopId) return;

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

    // SECURITY: Verify caller is authorized
    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
    if (!userId) return;
    const data = await getShopLayoutData(userId, shopId);
    if (!data) return;
    // SECURITY: Verify target staff belongs to this shop
    const targetStaff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!targetStaff || targetStaff.shopId !== shopId) return;

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

    // SECURITY: Verify caller is authorized (admin of this shop)
    const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
    if (!userId) return;
    const data = await getShopLayoutData(userId, shopId);
    if (!data || data.isStaff) return; // Only admins can change staff hours

    // SECURITY: Verify target staff belongs to this shop
    const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { workingHours: true, shopId: true } });
    if (!staff || staff.shopId !== shopId) return;
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

export default async function TeamDashboardPage({ params, searchParams }: { params: Promise<{ shopId: string }>, searchParams: Promise<{ date?: string }>}) {
  const { shopId } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/sign-in');

  const selectedDate = resolvedSearchParams.date || new Date().toISOString().split('T')[0];
  const pageData = await getPageData(shopId, userId, selectedDate);

  if (!pageData) return <div className="p-8 text-white">Access Denied.</div>;

  const { shop, shopSlug, userRole, staff, kioskUser } = pageData;

  const canAddShopAdmin = userRole === 'SUPER_ADMIN' && !staff.some((s: any) => s.role === 'SHOP_ADMIN');

  return (
    <ShopAdminLayout shopName={shop.name} shopSlug={shopSlug} pageTitle={userRole === 'SUPER_ADMIN' ? 'Assign Shop Admin & Kiosk' : 'Team & Availability'} shopId={shopId} userRole={userRole} activeTab="team">

      {kioskUser && (
         <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-2xl shadow-lg mb-8">
             <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><span>📱</span> Tablet Kiosk Setup</h3>
             <p className="text-sm text-gray-300 mb-4">To set up the front desk attendance tablet, sign up for a new account on that device using this exact email:</p>
             <div className="bg-black/50 p-3 rounded-lg text-center mb-3 border border-white/5"><code className="text-brand-gold font-mono font-bold tracking-wider">{kioskUser.email}</code></div>
             <p className="text-xs text-blue-300">Once an account is created with this email, that account will instantly inherit kiosk privileges for this shop.</p>
         </div>
      )}

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

      {userRole === 'SUPER_ADMIN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((staffMember: any) => (
            <div key={staffMember.id} className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {staffMember.name || staffMember.email.split('@')[0]}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${staffMember.role === 'SHOP_ADMIN' ? 'bg-brand-gold/20 text-brand-gold' : 'bg-blue-500/20 text-blue-400'}`}>
                      {staffMember.role.replace('_', ' ')}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500">{staffMember.email}</p>
                </div>
              </div>
              <form action={removeUser} className="mt-auto">
                <input type="hidden" name="userId" value={staffMember.id} />
                <input type="hidden" name="shopId" value={shop.id} />
                <button type="submit" className="w-full text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded-lg transition-colors border border-red-500/20">
                  Remove from Shop
                </button>
              </form>
            </div>
          ))}
          {staff.length === 0 && (
            <p className="text-gray-500 italic">No assigned admins or kiosks.</p>
          )}
        </div>
      ) : (
        /* ═══ Date Picker + Staff Cards (client-side refresh) ═══ */
        <TeamDashboardClient
          shopId={shopId}
          initialDate={selectedDate}
          initialStaff={staff}
          addLeaveAction={addLeave}
          removeLeaveAction={removeLeave}
          updateDayHoursAction={updateDayHours}
        />
      )}
    </ShopAdminLayout>
  );
}
