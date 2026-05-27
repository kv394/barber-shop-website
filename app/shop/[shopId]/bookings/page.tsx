import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import { formatDateInShopTz, formatInShopTz, getTodayInShopTz, toShopTzDayBounds } from '@/lib/timezone';
import { fmtPrice } from '@/lib/formatters';
import Link from 'next/link';
import DeleteAppointmentButton from '@/components/appointments/DeleteAppointmentButton';
import CheckoutButton from '@/components/checkout/CheckoutButton';
import NoShowButton from '@/components/appointments/NoShowButton';
import AppointmentNotes from '@/components/appointments/AppointmentNotes';
import BookingDatePicker from '@/components/appointments/BookingDatePicker';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import AcceptAppointmentButton from '@/components/appointments/AcceptAppointmentButton';
import CompleteWorkButton from '@/components/appointments/CompleteWorkButton';
import ClientNameClickable from '@/components/clients/ClientNameClickable';
import AddBookingWrapper from '@/components/appointments/AddBookingWrapper';

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
      ...(data.userRole === 'STAFF' || data.userRole === 'BOOTH_RENTER' ? { staffId: data.user.id } : {})
    },
    include: {
      service: { select: { name: true, price: true, duration: true } },
      user: { select: { name: true, email: true, shopClients: { where: { shopId }, select: { clientNotes: true, allergies: true, preferences: true } } } },
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
                <h1 className="font-bold text-status-cancelled mb-4 text-2xl">Access Denied</h1>
                <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
            </div>
        </div>
      )
    }

    const groupedAppointments = appointments.reduce((acc: any, curr: any) => {
        const dateKey = formatDateInShopTz(curr.startTime, shop.timezone || 'America/New_York');
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
            <h2 className="font-bold text-crm-text text-xl">Upcoming Bookings</h2>
            <BookingDatePicker dates={Object.keys(groupedAppointments)} />
          </div>
          <AddBookingWrapper shopId={shopId} />
        </div>

        {Object.keys(groupedAppointments).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
            <span className="text-4xl mb-4 opacity-50 drop-shadow-md">📅</span>
            <h2 className="text-xl font-bold text-crm-text mb-2">No upcoming bookings</h2>
            <p className="text-crm-muted text-[14px] max-w-[250px] mx-auto font-medium">
              You don't have any appointments scheduled for this period.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-10">
            {Object.keys(groupedAppointments).map((date) => (
              <div key={date} id={`date-${date.replace(/\s+/g, '-')}`} className="scroll-mt-24">
                <h3 className="font-black text-crm-primary border-b border-white/10 pb-3 mb-4 sm:mb-6 text-xl tracking-wide flex items-center gap-2">
                  <span className="text-2xl">🗓️</span> {date}
                </h3>
                <div className="flex flex-col gap-4 sm:gap-6 relative before:hidden sm:before:block before:absolute before:left-[108px] before:top-0 before:bottom-0 before:w-px before:bg-white/10 before:z-0">
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
                      <span className="px-2.5 py-1 text-[10px] uppercase font-black rounded-lg bg-white/10 text-white/70 border border-white/10 whitespace-nowrap shadow-inner tracking-widest">Scheduled</span>
                    ) : isAccepted ? (
                      <span className="px-2.5 py-1 text-[10px] uppercase font-black rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 whitespace-nowrap shadow-inner tracking-widest">Accepted</span>
                    ) : isWorkCompleted ? (
                      <span className="px-2.5 py-1 text-[10px] uppercase font-black rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap shadow-inner tracking-widest">Ready for Checkout</span>
                    ) : null;

                    return (
                      <div key={apt.id} className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white/40 p-5 sm:p-6 rounded-2xl border relative z-10 transition-all hover:bg-white/60 ${isNow ? 'border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-brand-gold/50' : 'border-white/20'}`}>
                        
                        {/* Time Column */}
                        <div className="w-full sm:w-20 flex-shrink-0 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end border-b sm:border-b-0 border-white/20 pb-4 sm:pb-0 text-right">
                          <p className={`font-mono font-black text-xl leading-none tracking-tight ${isNow ? 'text-brand-gold drop-shadow-md' : 'text-crm-text'}`}>
                            {formatInShopTz(apt.startTime, shop.timezone || 'America/New_York')}
                          </p>
                          <p className="text-crm-muted text-[12px] font-bold uppercase tracking-widest mt-2">{apt.service.duration} min</p>
                          {isNow && (
                            <div className="mt-0 sm:mt-4 text-[10px] text-brand-gold font-black tracking-widest flex items-center gap-1.5 bg-brand-gold/10 px-2.5 py-1 rounded-full border border-brand-gold/20 shadow-inner">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse shadow-[0_0_5px_rgba(212,175,55,1)]"></span> NOW
                            </div>
                          )}
                        </div>

                        {/* Timeline Node (Desktop only) */}
                        <div className={`hidden sm:flex absolute left-[108px] top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-[3px] transition-colors z-20 ${isNow ? 'bg-brand-gold border-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]' : 'bg-white border-white/50 group-hover:border-crm-primary'}`}></div>

                        {/* Details Column */}
                        <div className="flex-1 flex flex-col min-w-0 sm:pl-6">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            {apt.userId ? (
                              <ClientNameClickable 
                                shopId={shop.id} 
                                clientId={apt.userId} 
                                clientName={apt.user?.name || "Guest"} 
                                className="font-black text-[20px] text-crm-text leading-tight truncate hover:text-crm-primary transition-colors drop-shadow-sm"
                                currency={shop.currency}
                              />
                            ) : (
                              <h4 className="font-black text-[20px] text-crm-text leading-tight truncate drop-shadow-sm">{apt.user?.name || "Guest"}</h4>
                            )}
                            {statusBadge}
                          </div>
                          
                          <p className="text-crm-muted text-[14px] font-medium mb-4">{apt.user?.email || "No email"}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="font-bold text-crm-text text-[13px] bg-white/50 px-3 py-1.5 rounded-lg border border-white/20 shadow-inner">
                              {apt.service.name}
                            </span>
                            <span className="text-brand-gold text-[14px] font-black tracking-wide">
                              {fmtPrice(apt.service.price, shop.currency)}
                            </span>
                          </div>

                          <div className="bg-crm-bg/50 rounded-xl p-4 border border-white/20 shadow-inner">
                            <AppointmentNotes 
                              shopId={shop.id} 
                              appointmentId={apt.id} 
                              initialNotes={apt.notes}
                              clientNotes={apt.user?.shopClients?.[0]?.clientNotes}
                              preferences={apt.user?.shopClients?.[0]?.preferences}
                              allergies={apt.user?.shopClients?.[0]?.allergies}
                            />
                          </div>
                        </div>

                        {/* Actions Column */}
                        <div className="w-full sm:w-auto flex flex-row flex-wrap sm:flex-nowrap sm:flex-col justify-end items-end gap-3 border-t sm:border-t-0 sm:border-l border-white/20 pt-5 sm:pt-0 sm:pl-6">
                          {isWorkCompleted && <CheckoutButton shopId={shop.id} appointmentId={apt.id} price={apt.service.price} serviceName={apt.service.name} serviceId={apt.serviceId} shopName={shop.name} clientName={apt.user?.name || apt.user?.email || "Guest"} addons={apt.addons} currency={shop.currency} />}
                          {isAccepted && <CompleteWorkButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                          {isScheduled && <AcceptAppointmentButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                          {isActive && <NoShowButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                          {isActive && <DeleteAppointmentButton shopId={shop.id} appointmentId={apt.id} userName={apt.user?.name || apt.user?.email || "Guest"} />}
                        </div>
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
    return <div className="text-crm-text p-12"><h1 className="text-2xl font-bold">Error compiling</h1><pre>{error.stack || error.toString()}</pre></div>;
  }
}
