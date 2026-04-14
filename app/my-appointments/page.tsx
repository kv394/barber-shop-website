'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MyAppointmentsNav from '@/components/MyAppointmentsNav';
import { formatDateTimeInShopTz } from '@/lib/timezone';

const RescheduleModal = dynamic(() => import('@/components/appointments/RescheduleModal'), { ssr: false });

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  tipAmount: number;
  notes: string | null;
  staffId: string;
  service: { id: string; name: string; price: number; duration: number } | null;
  staff: { name: string } | null;
  shop: { id: string; name: string; timezone: string };
  review: { id: string } | null;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED:  { bg: 'bg-status-info/20',   text: 'text-status-info',   label: 'Upcoming' },
  COMPLETED:  { bg: 'bg-status-confirmed/20',  text: 'text-status-confirmed',  label: 'Completed' },
  CANCELLED:  { bg: 'bg-status-cancelled/20',    text: 'text-status-cancelled',    label: 'Cancelled' },
  NO_SHOW:    { bg: 'bg-amber-900/40',  text: 'text-amber-300',  label: 'No-show' },
};

export default function MyAppointmentsPage() {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [user, setUser] = useState<{ role: string, shopId: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  async function fetchAppointments() {
    try {
      const res = await fetch('/api/my-appointments');
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setUpcoming(data.upcoming || []);
      setPast(data.past || []);
      setUser(data.user || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function handleCancel(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment? This cannot be undone.'
    );
    if (!confirmed) return;

    setCancelling(id);
    setError(null);
    try {
      const res = await fetch(`/api/my-appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel');
      }
      // Refresh the list
      await fetchAppointments();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden flex items-center justify-center bg-botanical-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-botanical-accent animate-pulse font-medium tracking-wide uppercase text-base md:text-lg">Loading Appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <header className="bg-botanical-surface backdrop-blur-md border-b border-botanical-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-botanical-text text-4xl md:text-5xl lg:text-6xl">My Appointments</h1>
            <p className="text-botanical-muted text-base md:text-lg">Manage your upcoming bookings</p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'SITE_ADMIN' ? (
              <Link href="/siteadmin" className="bg-botanical-surface border border-slate-600 text-botanical-text font-bold px-4 py-2 rounded-lg text-sm hover:bg-botanical-surface transition-colors">
                Back to Siteadmin
              </Link>
            ) : user?.shopId && (user?.role === 'SHOP_ADMIN' || user?.role === 'STAFF') ? (
              <Link href={`/shop/${user.shopId}`} className="bg-botanical-surface border border-slate-600 text-botanical-text font-bold px-4 py-2 rounded-lg text-sm hover:bg-botanical-surface transition-colors">
                Back to Dashboard
              </Link>
            ) : null}
            <Link
              href="/shops"
              className="bg-botanical-primary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors"
            >
              Book New
            </Link>
          </div>
        </div>
        {/* Client portal nav (C2) */}
        <MyAppointmentsNav />
      </header>

      {/* Reschedule Modal (C3) */}
      {rescheduleTarget && (
        <RescheduleModal
          appointmentId={rescheduleTarget.id}
          shopId={rescheduleTarget.shop.id}
          currentDate={rescheduleTarget.startTime}
          currentStaffId={rescheduleTarget.staffId}
          serviceDuration={rescheduleTarget.service?.duration || 30}
          serviceName={rescheduleTarget.service?.name || 'Service'}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => { setRescheduleTarget(null); fetchAppointments(); }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {error && (
          <div className="bg-status-cancelled/20 border border-status-cancelled/30 text-status-cancelled px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ═══ Upcoming ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-8 bg-status-info rounded-full" />
            <h2 className="font-bold text-botanical-text text-3xl md:text-4xl">
              Upcoming ({upcoming.length})
            </h2>
          </div>

          {upcoming.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-botanical-border rounded-xl">
              <p className="mb-3 text-base md:text-lg">📅</p>
              <p className="text-botanical-muted text-base md:text-lg">No upcoming appointments</p>
              <Link
                href="/shops"
                className="inline-block mt-4 text-botanical-accent hover:text-botanical-text text-sm font-semibold transition-colors"
              >
                Browse shops to book →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onCancel={handleCancel}
                  onReschedule={() => setRescheduleTarget(apt)}
                  cancelling={cancelling === apt.id}
                  showCancel
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══ Past ═══ */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-8 bg-botanical-border rounded-full" />
            <h2 className="font-bold text-botanical-text text-3xl md:text-4xl">
              Past ({past.length})
            </h2>
          </div>

          {past.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-botanical-border rounded-xl">
              <p className="text-botanical-muted italic text-base md:text-lg">No past appointments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {past.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onCancel={handleCancel}
                  cancelling={false}
                  showCancel={false}
                  showRebook
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AppointmentCard({
  appointment: apt,
  onCancel,
  onReschedule,
  cancelling,
  showCancel,
  showRebook,
}: {
  appointment: Appointment;
  onCancel: (id: string) => void;
  onReschedule?: () => void;
  cancelling: boolean;
  showCancel: boolean;
  showRebook?: boolean;
}) {
  const style = STATUS_STYLES[apt.status] || STATUS_STYLES.SCHEDULED;
  const tz = apt.shop?.timezone || 'America/New_York';
  const shopSlug = apt.shop?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';

  return (
    <div className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl p-4 sm:p-5 hover:border-botanical-border transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Shop name + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-botanical-text text-sm sm:text-base truncate">
              {apt.shop?.name || 'Unknown Shop'}
            </span>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          </div>

          {/* Service + Staff */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-botanical-muted">{apt.service?.name || 'Service'}</span>
            {apt.staff?.name && (
              <>
                <span className="text-botanical-muted">·</span>
                <span className="text-botanical-muted">with {apt.staff.name}</span>
              </>
            )}
          </div>

          {/* Date / Time */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-botanical-muted">📅</span>
            <span className="text-sm font-mono text-botanical-accent">
              {formatDateTimeInShopTz(apt.startTime, tz)}
            </span>
            {apt.service?.duration && (
              <span className="text-xs text-botanical-muted">({apt.service.duration} min)</span>
            )}
          </div>

          {/* Price */}
          {apt.status === 'COMPLETED' && apt.totalAmount > 0 && (
            <div className="flex items-center gap-3 text-xs text-botanical-muted">
              <span>Total: <span className="text-botanical-text font-semibold">${apt.totalAmount.toFixed(2)}</span></span>
              {apt.tipAmount > 0 && <span>Tip: <span className="text-status-confirmed">${apt.tipAmount.toFixed(2)}</span></span>}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="shrink-0 flex flex-col gap-2">
          {showCancel && apt.status === 'SCHEDULED' && (
            <div className="flex gap-2">
              {onReschedule && (
                <button
                  onClick={onReschedule}
                  className="px-4 py-2 text-sm font-semibold bg-status-info/20 text-status-info border border-status-info/30 rounded-lg hover:bg-status-info/40 transition-all"
                >
                  Reschedule
                </button>
              )}
              <button
                onClick={() => onCancel(apt.id)}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-semibold bg-status-cancelled/20 text-status-cancelled border border-status-cancelled/30 rounded-lg hover:bg-status-cancelled/40 hover:text-status-cancelled transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          )}
          {showRebook && apt.service && shopSlug && (
            <Link
              href={`/shops/${shopSlug}?service=${apt.service.id}`}
              className="px-4 py-2 text-sm font-semibold bg-botanical-primary/20 text-botanical-accent border border-brand-gold/30 rounded-lg hover:bg-botanical-primary/40 transition-all text-center"
            >
              Rebook
            </Link>
          )}
          {showRebook && apt.status === 'COMPLETED' && !apt.review && (
            <Link
              href={`/my-appointments/review/${apt.id}`}
              className="px-4 py-2 text-sm font-semibold bg-purple-600/20 text-botanical-accent border border-botanical-accent/30 rounded-lg hover:bg-purple-600/40 transition-all text-center"
            >
              ⭐ Leave Review
            </Link>
          )}
          {apt.review && (
            <span className="px-4 py-2 text-sm text-status-confirmed/70 text-center">✅ Reviewed</span>
          )}
        </div>
      </div>
    </div>
  );
}

