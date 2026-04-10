import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import StaffAvailability from '@/components/shop-admin/StaffAvailability';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

async function getShopData(shopId: string, userId: string, date: string, from: string, to: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null; // Allow SHOP_ADMIN, STAFF, and SUPER_ADMIN

  const shop = data.shop;

  const targetDate = new Date(date);
  const nextDate = new Date(targetDate);
  nextDate.setDate(targetDate.getDate() + 1);

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
          isBooked: !!booking,
        });
      }
      currentSlotTime = new Date(currentSlotTime.getTime() + slotDuration);
    }
    return { ...staff, schedule, isOnLeave: false, using };
  });

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    staff: JSON.parse(JSON.stringify(staffWithSchedule))
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
    return <div className="p-8 text-white">You do not have access to this page.</div>;
  }

  const { shop, shopSlug, userRole, staff } = shopData;

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Staff Availability"
      shopId={shopId}
      userRole={userRole}
      activeTab="staff"
    >
      <StaffAvailability defaultDate={selectedDate} defaultFrom={fromTime} defaultTo={toTime} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {staff.map((staffMember: any) => {
          const isOnLeave = staffMember.isOnLeave;
          const isNotWorking = staffMember.using === 'not-working';
          return (
            <div key={staffMember.id} className="bg-slate-900/70 border border-white/10 rounded-lg p-3 sm:p-4 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h2 className="text-base sm:text-xl font-semibold text-brand-gold truncate">{staffMember.name || staffMember.email || 'Unnamed Staff'}</h2>
                {staffMember.using === 'default' && <span className="text-[10px] sm:text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 sm:py-1 rounded-full shrink-0">Default Hours</span>}
                {staffMember.using === 'shop' && <span className="text-[10px] sm:text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 sm:py-1 rounded-full shrink-0">Shop Hours</span>}
              </div>
              <div className="flex-grow max-h-80 overflow-y-auto pr-1 sm:pr-2 space-y-1">
                {isOnLeave ? (
                  <div className="text-center py-4 h-full flex flex-col justify-center items-center rounded-md bg-red-900/50">
                    <p className="font-bold text-red-300 text-sm sm:text-lg">ON LEAVE</p>
                  </div>
                ) : isNotWorking ? (
                    <div className="text-center py-4 h-full flex flex-col justify-center items-center rounded-md bg-slate-800">
                        <p className="font-bold text-gray-400 text-sm">NOT WORKING</p>
                    </div>
                ) : staffMember.schedule.length > 0 ? (
                  staffMember.schedule.map((slot: any) => (
                    <div key={slot.time} className={`p-2 rounded-md text-xs sm:text-sm flex justify-between items-center ${slot.isBooked ? 'bg-amber-800/60' : 'bg-green-800/40'}`}>
                      <span className="font-mono text-gray-300">{slot.time}</span>
                      {slot.isBooked ? <span className="font-bold text-amber-300">Booked</span> : <span className="font-semibold text-green-300">Available</span>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 h-full flex flex-col justify-center items-center rounded-md bg-slate-800">
                    <p className="text-xs sm:text-sm text-gray-500 italic">No slots in selected range.</p>
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
