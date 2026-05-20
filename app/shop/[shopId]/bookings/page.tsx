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
          <p className="text-crm-muted italic text-center py-8 sm:py-12 border border-dashed border-crm-border rounded text-[13px]">No upcoming appointments scheduled.</p>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {Object.keys(groupedAppointments).map((date) => (
              <div key={date} id={`date-${date.replace(/\s+/g, '-')}`} className="scroll-mt-24">
                <h3 className="font-bold text-crm-accent border-b border-crm-border pb-2 mb-3 sm:mb-4 text-lg">{date}</h3>
                <div className="flex flex-col gap-3 sm:gap-4 relative before:hidden sm:before:block before:absolute before:left-[108px] before:top-0 before:bottom-0 before:w-px before:bg-crm-border before:z-0">
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
                      <span className="px-2 py-0.5 text-[11px] uppercase font-bold rounded bg-crm-surface text-crm-text border border-crm-border whitespace-nowrap shadow-sm">Scheduled</span>
                    ) : isAccepted ? (
                      <span className="px-2 py-0.5 text-[11px] uppercase font-bold rounded bg-status-info/10 text-status-info border border-status-info/30 whitespace-nowrap shadow-sm">Accepted</span>
                    ) : isWorkCompleted ? (
                      <span className="px-2 py-0.5 text-[11px] uppercase font-bold rounded bg-crm-primary/10 text-crm-primary border border-crm-primary/30 whitespace-nowrap shadow-sm">Ready for Checkout</span>
                    ) : null;

                    return (
                      <div key={apt.id} className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 bg-crm-surface p-4 sm:p-5 rounded-lg border relative z-10 transition-shadow hover:shadow-md ${isNow ? 'border-status-confirmed shadow-[0_0_15px_rgba(34,197,94,0.1)] ring-1 ring-status-confirmed/50' : 'border-crm-border'}`}>
                        
                        {/* Time Column */}
                        <div className="w-full sm:w-20 flex-shrink-0 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end border-b sm:border-b-0 border-crm-border pb-3 sm:pb-0 text-right">
                          <p className={`font-mono font-bold text-lg leading-none ${isNow ? 'text-status-confirmed' : 'text-crm-text'}`}>
                            {formatInShopTz(apt.startTime, shop.timezone || 'America/New_York')}
                          </p>
                          <p className="text-crm-muted text-[12px] font-medium mt-1">{apt.service.duration} min</p>
                          {isNow && (
                            <div className="mt-0 sm:mt-3 text-[10px] text-status-confirmed font-bold tracking-widest flex items-center gap-1.5 bg-status-confirmed/10 px-2 py-1 rounded-full border border-status-confirmed/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-confirmed animate-pulse"></span> NOW
                            </div>
                          )}
                        </div>

                        {/* Timeline Node (Desktop only) */}
                        <div className="hidden sm:flex absolute left-[108px] top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-crm-surface border-[3px] border-crm-border group-hover:border-crm-primary transition-colors z-20"></div>

                        {/* Details Column */}
                        <div className="flex-1 flex flex-col min-w-0 sm:pl-6">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {apt.userId ? (
                              <ClientNameClickable 
                                shopId={shop.id} 
                                clientId={apt.userId} 
                                clientName={apt.user?.name || "Guest"} 
                                className="font-bold text-[17px] text-crm-text leading-tight truncate hover:text-crm-primary"
                              />
                            ) : (
                              <h4 className="font-bold text-[17px] text-crm-text leading-tight truncate">{apt.user?.name || "Guest"}</h4>
                            )}
                            {statusBadge}
                          </div>
                          
                          <p className="text-crm-muted text-[13px] mb-3">{apt.user?.email || "No email"}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="font-medium text-crm-text text-[13px] bg-crm-bg px-2.5 py-1 rounded-md border border-crm-border">
                              {apt.service.name}
                            </span>
                            <span className="text-crm-muted text-[13px] font-medium">
                              ${apt.service.price.toFixed(2)}
                            </span>
                          </div>

                          <AppointmentNotes 
                            shopId={shop.id} 
                            appointmentId={apt.id} 
                            initialNotes={apt.notes}
                            clientNotes={apt.user?.clientNotes}
                            preferences={apt.user?.preferences}
                            allergies={apt.user?.allergies}
                          />
                        </div>

                        {/* Actions Column */}
                        <div className="w-full sm:w-auto flex flex-row flex-wrap sm:flex-nowrap sm:flex-col justify-end items-end gap-2 border-t sm:border-t-0 sm:border-l border-crm-border pt-4 sm:pt-0 sm:pl-6">
                          {isWorkCompleted && <CheckoutButton shopId={shop.id} appointmentId={apt.id} price={apt.service.price} serviceName={apt.service.name} serviceId={apt.serviceId} shopName={shop.name} clientName={apt.user?.name || apt.user?.email || "Guest"} addons={apt.addons} />}
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
