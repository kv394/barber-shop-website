import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import StaffAvailability from '@/components/shop-admin/StaffAvailability';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import StaffProfileModalWrapper from '@/components/shop-admin/StaffProfileModalWrapper';
import DirectClockInButton from '@/components/shop-admin/DirectClockInButton';
import BlockTimeButton from '@/components/shop-admin/BlockTimeButton';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

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

    if (hoursForDay === null) { // Explicitly not working
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

  // Sort so current user is always first, then alphabetically
  staffWithSchedule.sort((a: any, b: any) => {
    if (a.id === actualUserId) return -1;
    if (b.id === actualUserId) return 1;
    const nameA = (a.name || a.email || '').toLowerCase();
    const nameB = (b.name || b.email || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    staff: JSON.parse(JSON.stringify(staffWithSchedule)),
    isClockedIn: !!activeLog,
    actualUserId
  };
}

export default async function StaffBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ date?: string, from?: string, to?: string }>;
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
      <StaffAvailability defaultDate={selectedDate} defaultFrom={fromTime} defaultTo={toTime} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {staff.map((staffMember: any) => {
          const isOnLeave = staffMember.isOnLeave;
          const isNotWorking = staffMember.using === 'not-working';
          return (
            <div key={staffMember.id} className="bg-crm-bg/70 border border-crm-border shadow-sm rounded-lg p-3 sm:p-4 flex flex-col">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2 gap-2">
                <StaffProfileModalWrapper staff={staffMember}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-crm-surface border border-brand-gold/50 flex items-center justify-center shrink-0">
                      {staffMember.imageUrl ? (
                        <img src={staffMember.imageUrl} alt={staffMember.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px]">👤</span>
                      )}
                    </div>
                    <h2 className="font-semibold text-crm-accent truncate text-xl font-bold">{staffMember.name || staffMember.email || 'Unnamed Staff'}</h2>
                  </div>
                </StaffProfileModalWrapper>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {staffMember.using === 'default' && <span className="text-[13px] sm:text-[11px] bg-amber-900/50 text-amber-300 px-2 py-0.5 sm:py-1 rounded-full">Default Hours</span>}
                  {staffMember.using === 'shop' && <span className="text-[13px] sm:text-[11px] bg-status-info/20 text-status-info px-2 py-0.5 sm:py-1 rounded-full">Shop Hours</span>}
                </div>
              </div>
              <div className="flex-grow max-h-[85vh] sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 space-y-1.5 mt-2 scrollbar-thin">
                {isOnLeave ? (
                  <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-status-cancelled/10 border border-status-cancelled/20">
                    <p className="font-bold text-status-cancelled tracking-widest text-[13px]">ON LEAVE</p>
                  </div>
                ) : isNotWorking ? (
                    <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-crm-surface/50 border border-crm-border border-dashed">
                        <p className="font-bold text-crm-muted tracking-widest text-[13px]">NOT WORKING</p>
                    </div>
                ) : staffMember.schedule.length > 0 ? (
                  staffMember.schedule.map((slot: any) => (
                    <div key={slot.time} className={`p-3 sm:p-2.5 rounded-xl border sm:rounded-md text-[13px] flex justify-between items-center ${slot.isBooked ? 'bg-amber-800/60 border-amber-700/50' : 'bg-status-confirmed/10 border-status-confirmed/20'}`}>
                      <span className={`font-mono font-medium ${slot.isBooked ? 'text-amber-200/70' : 'text-crm-text'}`}>{slot.time}</span>
                      <div className="flex items-center gap-2">
                        {slot.isBooked ? <span className="font-bold text-amber-300 tracking-tight">Booked</span> : <span className="font-semibold text-status-confirmed">Available</span>}
                        {!slot.isBooked && (userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN' || staffMember.id === actualUserId) && (
                          <BlockTimeButton shopId={shopId} staffId={staffMember.id} date={selectedDate} time={slot.isoTime} />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 h-full flex flex-col justify-center items-center rounded-xl bg-crm-surface/50 border border-crm-border border-dashed">
                    <p className="text-crm-muted italic text-[13px]">No slots in selected range.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ShopAdminLayout>
  );
}
