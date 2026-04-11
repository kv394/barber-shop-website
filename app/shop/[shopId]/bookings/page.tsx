import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import { formatDateInShopTz, formatInShopTz, getTodayInShopTz, toShopTzDayBounds } from '@/lib/timezone';
import Link from 'next/link';
import DeleteAppointmentButton from '@/components/appointments/DeleteAppointmentButton';
import CheckoutButton from '@/components/checkout/CheckoutButton';
import NoShowButton from '@/components/appointments/NoShowButton';
import AppointmentNotes from '@/components/appointments/AppointmentNotes';
import BookingDatePicker from '@/components/appointments/BookingDatePicker';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import AcceptAppointmentButton from '@/components/appointments/AcceptAppointmentButton';
import CompleteWorkButton from '@/components/appointments/CompleteWorkButton';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return { shop: null, userRole: null, appointments: [] };

  // Use shop timezone for "today"
  const shopTz = data.shop.timezone || 'America/New_York';
  const todayStr = getTodayInShopTz(shopTz);
  const { startOfDay: today } = toShopTzDayBounds(todayStr, shopTz);

  const nextMonth = new Date(today);
  nextMonth.setDate(nextMonth.getDate() + 30);

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: shopId,
      startTime: { gte: today, lte: nextMonth },
      ...(data.userRole === 'STAFF' ? { staffId: data.user.id } : {})
    },
    include: {
      service: { select: { name: true, price: true, duration: true } },
      user: { select: { name: true, email: true, clientNotes: true, allergies: true, preferences: true } },
      staff: { select: { name: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 500,
  });

  return { 
    shop: data.shop, 
    userRole: data.userRole,
    shopSlug: data.shopSlug,
    appointments: JSON.parse(JSON.stringify(appointments))
  };
}

export default async function BookingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  try {
    const { shop, userRole, appointments } = await getPageData(shopId, userId);

    if (!shop) {
      return (
        <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-botanical-muted">You do not have permission to view this page.</p>
            </div>
        </div>
      )
    }

    const groupedAppointments = appointments.reduce((acc: any, curr: any) => {
        const dateKey = new Date(curr.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(curr);
        return acc;
    }, {});

    const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    return (
      <ShopAdminLayout
        shopName={shop.name}
        shopSlug={shopSlug}
        pageTitle="Manage Appointments"
        shopId={shopId}
        userRole={userRole as string}
        activeTab="bookings"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-botanical-text">Upcoming Bookings</h2>
            <BookingDatePicker dates={Object.keys(groupedAppointments)} />
          </div>
          <Link href={`/shops/${shopSlug}`} target="_blank" className="bg-botanical-primary text-white font-bold px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap shadow-lg">+ Add Booking</Link>
        </div>

        {Object.keys(groupedAppointments).length === 0 ? (
          <p className="text-botanical-muted italic text-center py-8 sm:py-12 text-sm border border-dashed border-botanical-border rounded">No upcoming appointments scheduled.</p>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {Object.keys(groupedAppointments).map((date) => (
              <div key={date} id={`date-${date.replace(/\s+/g, '-')}`} className="scroll-mt-24">
                <h3 className="text-base sm:text-xl font-bold text-botanical-accent border-b border-botanical-border pb-2 mb-3 sm:mb-4">{date}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {groupedAppointments[date].map((apt: any) => {
                    const start = new Date(apt.startTime);
                    const end = new Date(apt.endTime);
                    const isNow = new Date() >= start && new Date() <= end;
                    const isCompleted = apt.status === 'COMPLETED';
                    const isNoShow = apt.status === 'NO_SHOW';
                    const isCancelled = apt.status === 'CANCELLED';
                    const isScheduled = apt.status === 'SCHEDULED';
                    const isAccepted = apt.status === 'ACCEPTED';
                    const isWorkCompleted = apt.status === 'WORK_COMPLETED';
                    const isActive = isScheduled || isAccepted || isWorkCompleted;

                    const statusBadge = isScheduled ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-botanical-surface text-botanical-text border border-slate-600 whitespace-nowrap">Scheduled</span>
                    ) : isAccepted ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-blue-900/50 text-blue-300 border border-blue-500/30 whitespace-nowrap">Accepted</span>
                    ) : isWorkCompleted ? (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-botanical-primary/20 text-botanical-accent border border-brand-gold/30 whitespace-nowrap">Ready for Checkout</span>
                    ) : null;

                    return (
                      <div key={apt.id} className={`bg-botanical-surface p-5 rounded-lg border ${isNow ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-botanical-border'}`}>
                                           <div className="flex justify-between items-start mb-3 gap-2">
                                               <div className="flex flex-col items-start gap-1">
                                                   <div className="flex flex-wrap items-center gap-2">
                                                       <h4 className="font-bold text-lg leading-tight">{apt.user?.name || "Guest"}</h4>
                                                       {statusBadge}
                                                   </div>
                                                   <p className="text-xs text-botanical-muted">{apt.user?.email || "No email"}</p>
                                               </div>
                                               <div className="text-right">
                                                   <p className="font-mono text-botanical-accent">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                   <p className="text-[10px] sm:text-xs text-botanical-muted">{apt.service.duration} mins</p>
                                               </div>
                                           </div>
                                           <div className="pt-2 sm:pt-3 border-t border-botanical-border flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                                               <div>
                                                   <p className="font-semibold text-sm text-botanical-muted">{apt.service.name}</p>
                                                   <p className="text-xs sm:text-sm text-botanical-muted">${apt.service.price.toFixed(2)}</p>
                                               </div>
                                               <div className="flex flex-wrap items-center justify-end gap-4 shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
                                                 {isActive && <NoShowButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                                                 {isActive && <DeleteAppointmentButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                                                 {isScheduled && <AcceptAppointmentButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                                                 {isAccepted && <CompleteWorkButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                                                 {isWorkCompleted && <CheckoutButton shopId={shop.id} appointmentId={apt.id} price={apt.service.price} serviceName={apt.service.name} serviceId={apt.serviceId} shopName={shop.name} />}
                                               </div>
                                           </div>
                                           {isNow && (isScheduled || isAccepted) && (
                                             <div className="mt-3 text-xs text-green-400 font-bold tracking-widest uppercase flex items-center gap-2">
                                               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> IN PROGRESS
                                             </div>
                                           )}
                                           <AppointmentNotes 
                                              shopId={shop.id} 
                                              appointmentId={apt.id} 
                                              initialNotes={apt.notes}
                                              clientNotes={apt.user?.clientNotes}
                                              preferences={apt.user?.preferences}
                                              allergies={apt.user?.allergies}
                                            />
                                         </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ShopAdminLayout>
    );
  } catch (error: any) {
    return <div className="text-botanical-text p-12"><h1>Error compiling</h1><pre>{error.stack || error.toString()}</pre></div>;
  }
}
