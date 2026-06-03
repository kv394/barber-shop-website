import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import TeamDashboardClient from '@/components/shop-admin/TeamDashboardClient';
import InviteFormClient from '@/components/shop-admin/InviteFormClient';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

import crypto from 'crypto';
import { cacheService } from '@/lib/cache';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, date: string) {
 const data = await getShopLayoutData(userId, shopId);
 if (!data) return null;

 const shop = data.shop;
 const targetDate = new Date(date);
 
 // Site Admins manage SHOP_ADMINs and ATTENDANCE_KIOSKs. 
 // Shop Admins manage STAFF and BOOTH_RENTERs.
 const rolesToFetch: any[] = data.isSiteAdmin ? ['SHOP_ADMIN', 'ATTENDANCE_KIOSK'] : ['SHOP_ADMIN', 'STAFF', 'BOOTH_RENTER'];
 
 const [allStaff, kioskUser] = await Promise.all([
 prisma.user.findMany({
 where: {
 OR: [
 { shopId: shopId, role: { in: rolesToFetch } },
 { shopAccesses: { some: { shopId: shopId, role: { in: rolesToFetch } } } }
 ]
 },
 include: {
 staffAppointments: { where: { startTime: { gte: targetDate, lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) } } },
 leaves: { where: { date: targetDate } },
 timeLogs: { where: { clockIn: { gte: targetDate, lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) } }, orderBy: { clockIn: 'desc' }, take: 1 },
 shopAccesses: { where: { shopId } }
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

async function inviteUser(_prevState: any, formData: FormData): Promise<{ success: boolean; error?: string }> {
 'use server';
 const email = (formData.get('email') as string)?.trim().toLowerCase();
 const role = formData.get('role') as 'SHOP_ADMIN' | 'STAFF' | 'BOOTH_RENTER' | 'ATTENDANCE_KIOSK';
 const shopId = formData.get('shopId') as string;
 if (!email || !role || !shopId) return { success: false, error: 'Missing required fields.' };

 // SECURITY: Verify the caller is authorized to invite users to this shop
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) return { success: false, error: 'Not authenticated.' };
 const caller = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: user?.email || '' }] } });
 if (!caller) return { success: false, error: 'Not authorized.' };
 
 let callerHasAccess = false;
 if (caller.role === 'SITE_ADMIN') {
 callerHasAccess = true;
 } else if (caller.role === 'SHOP_ADMIN') {
 if (caller.shopId === shopId) {
 callerHasAccess = true;
 } else {
 const access = await prisma.shopAccess.findFirst({ where: { userId: caller.id, shopId, role: 'SHOP_ADMIN' } });
 if (access) callerHasAccess = true;
 }
 }

 if (!callerHasAccess) return { success: false, error: 'Not authorized.' };
 // Only SITE_ADMIN can assign SHOP_ADMIN or ATTENDANCE_KIOSK roles
 if ((role === 'SHOP_ADMIN' || role === 'ATTENDANCE_KIOSK') && caller.role !== 'SITE_ADMIN') return { success: false, error: 'Only Site Admins can assign this role.' };
 // BOOTH_RENTER can be assigned by SHOP_ADMIN or SITE_ADMIN
 if (role !== 'STAFF' && role !== 'BOOTH_RENTER' && role !== 'SHOP_ADMIN' && role !== 'ATTENDANCE_KIOSK') return { success: false, error: 'Invalid role.' };

 const existingUser = await prisma.user.findUnique({ where: { email }, include: { shop: { select: { name: true } } } });
 if (existingUser) {
  if (existingUser.shopId === shopId) {
  // Already in this shop — just update role
  await prisma.user.update({ where: { email }, data: { role } });
  } else if (existingUser.shopId === null) {
  // User has no primary shop — set this as primary.
  await prisma.user.update({ where: { email }, data: { role, shopId } });
  } else {
   // User belongs to another shop — block unless caller is SITE_ADMIN
   if (caller.role !== 'SITE_ADMIN') {
   const otherShopName = existingUser.shop?.name || 'another shop';
   return { success: false, error: `This email is already associated with "${otherShopName}". The user must be removed from that shop first before they can be added here.` };
   }
   await prisma.shopAccess.upsert({
   where: { userId_shopId: { userId: existingUser.id, shopId } },
   update: { role },
   create: { userId: existingUser.id, shopId, role }
   });
  }
 await cacheService.invalidatePattern(`shop_layout:${existingUser.email}:*`);
 } else {
  // Create Supabase auth account using service role so the user can log in
  const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const tempPassword = crypto.randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: tempPassword,
  email_confirm: true,
  });

  const newUserId = authData?.user?.id || `invited_${crypto.randomBytes(8).toString('hex')}`;

  if (authError) {
  console.error('[INVITE] Failed to create Supabase auth user:', authError.message);
  }

  const userBarcode = crypto.createHash('sha256').update(`${email}-${process.env.JWT_SECRET || 'secret'}`).digest('hex').substring(0, 12).toUpperCase();
  await prisma.user.create({
  data: {
  id: newUserId,
  email,
  role,
  shopId,
  barcode: userBarcode,
  }
  });

  // Send password reset email so user can set their own password
  if (!authError) {
  await supabaseAdmin.auth.admin.generateLink({
   type: 'recovery',
   email,
  });
  }
 }

  // Send invite email to the new or existing user
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });
  emailService.sendInvite({
  to: email,
  shopName: shop?.name || 'a shop',
  role,
  invitedBy: caller.name || caller.email || undefined,
  }).catch(err => console.error('[INVITE EMAIL]', err));

  revalidatePath(`/shop/${shopId}/settings/team`);
  return { success: true };
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
 
 let callerHasAccess = false;
 if (caller.role === 'SITE_ADMIN') {
 callerHasAccess = true;
 } else if (caller.role === 'SHOP_ADMIN') {
 if (caller.shopId === shopId) {
 callerHasAccess = true;
 } else {
 const access = await prisma.shopAccess.findFirst({ where: { userId: caller.id, shopId, role: 'SHOP_ADMIN' } });
 if (access) callerHasAccess = true;
 }
 }

 if (!callerHasAccess) return;

 const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
 if (targetUser?.shopId === shopId) {
 await prisma.user.update({
 where: { id: targetUserId },
 data: { shopId: null, role: 'CLIENT' }
 });
 }

 await prisma.shopAccess.deleteMany({
 where: { userId: targetUserId, shopId }
 });

 if (targetUser) {
 await cacheService.invalidatePattern(`shop_layout:${targetUser.email || targetUser.id}:*`);
 }

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
 const targetStaff = await prisma.user.findUnique({ where: { id: staffId }, include: { shopAccesses: { where: { shopId } } } });
 if (!targetStaff || (targetStaff.shopId !== shopId && targetStaff.shopAccesses.length === 0)) return;

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
 const targetStaff = await prisma.user.findUnique({ where: { id: staffId }, include: { shopAccesses: { where: { shopId } } } });
 if (!targetStaff || (targetStaff.shopId !== shopId && targetStaff.shopAccesses.length === 0)) return;

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
 const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { workingHours: true, shopId: true, shopAccesses: { where: { shopId } } } });
 if (!staff || (staff.shopId !== shopId && staff.shopAccesses.length === 0)) return;
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

 if (!pageData) return <div className="p-8 text-crm-text">Access Denied.</div>;

 const { shop, shopSlug, userRole, staff, kioskUser } = pageData;

 const canAddShopAdmin = userRole === 'SITE_ADMIN' && !staff.some((s: any) => s.role === 'SHOP_ADMIN');

 const teamTabs = [
 { id: 'team', label: 'Team & Availability', href: `/shop/${shopId}/settings/team` },
 { id: 'portfolio', label: 'Portfolio', href: `/shop/${shopId}/portfolio` }
 ];

 return (
 <ShopAdminLayout shopName={shop.name} shopSlug={shopSlug} pageTitle={userRole === 'SITE_ADMIN' ? 'Assign Shop Admin & Kiosk' : undefined} shopId={shopId} userRole={userRole}>

 {kioskUser && (
 <div className="bg-crm-primary/10 border border-crm-primary/30 p-5 rounded-2xl shadow-lg mb-8">
 <h3 className="text-crm-primary font-bold mb-2 flex items-center gap-2 text-lg"><span>📱</span> Tablet Kiosk Setup</h3>
 <p className="text-crm-muted mb-4 text-[13px]">To set up the front desk attendance tablet, sign up for a new account on that device using this exact email:</p>
 <div className="bg-crm-surface p-3 rounded-lg text-center mb-3 border border-crm-border shadow-sm"><code className="text-crm-primary font-mono font-bold tracking-wider">{kioskUser.email}</code></div>
 <p className="text-blue-700 text-[13px]">Once an account is created with this email, that account will instantly inherit kiosk privileges for this shop.</p>
 </div>
 )}

 {/* ═══ Invite Section ═══ */}
 <div className="mb-8 bg-crm-surface rounded-2xl border border-crm-border shadow-xl overflow-hidden">
 <div className="h-1 bg-gradient-to-r from-crm-primary via-crm-primary/60 to-transparent" />
 <div className="p-6">
 <div className="flex items-start gap-4 mb-6">
 <div className="w-12 h-12 shrink-0 mt-0.5 rounded-2xl bg-crm-primary/10 flex items-center justify-center text-2xl">✉️</div>
 <div>
 <h3 className="font-bold text-crm-text text-lg">Invite Team Member</h3>
 <p className="text-crm-muted text-[13px]">Invite a new user, or add an existing user to this location</p>
 </div>
 </div>

 <InviteFormClient
  inviteAction={inviteUser}
  shopId={shop.id}
  userRole={userRole}
  canAddShopAdmin={canAddShopAdmin}
 />

 {!canAddShopAdmin && userRole === 'SITE_ADMIN' && (
 <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
 <span>⚠️</span>
 <span>A Shop Admin already exists. Remove them to assign a new one.</span>
 </div>
 )}
 </div>
 </div>

 {userRole === 'SITE_ADMIN' ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {staff.map((staffMember: any) => (
 <div key={staffMember.id} className="bg-crm-surface border border-crm-border shadow-sm rounded-2xl p-5 flex flex-col shadow-lg">
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-4">
 <div>
 <h2 className="font-bold text-crm-text mb-1 flex items-center gap-2 text-xl">
 {staffMember.name || staffMember.email.split('@')[0]}
 <span className={`text-[11px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${staffMember.role === 'SHOP_ADMIN' ? 'bg-crm-primary/10 text-crm-primary border border-crm-primary/20' : 'bg-crm-primary/10 text-blue-700 border border-crm-primary/30'} hover:opacity-90`}>
 {staffMember.role.replace('_', ' ')}
 </span>
 </h2>
 <p className="text-crm-muted text-[13px]">{staffMember.email}</p>
 </div>
 </div>
 <form action={removeUser} className="mt-auto">
 <input type="hidden" name="userId" value={staffMember.id} />
 <input type="hidden" name="shopId" value={shop.id} />
 <button type="submit" className="w-full text-[11px] text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 py-2 rounded-lg transition-colors border border-red-200">
 Remove from Shop
 </button>
 </form>
 </div>
 ))}
 {staff.length === 0 && (
 <p className="text-crm-muted italic text-[13px]">No assigned admins or kiosks.</p>
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
 removeUserAction={removeUser}
 />
 )}
 </ShopAdminLayout>
 );
}
