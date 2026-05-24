'use client';

import { useState } from 'react';

export default function ManageBookingClient({ appointment, isPast }: { appointment: any, isPast: boolean }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(appointment.status === 'CANCELLED');
  const [error, setError] = useState('');

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/manage/${appointment.managementToken}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCancelled(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to cancel');
      }
    } catch (e) {
      setError('Network error. Try again.');
    } finally {
      setCancelling(false);
    }
  };

  const apptDate = new Date(appointment.startTime);
  const dateStr = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="w-full max-w-md">
      <div className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden shadow-2xl">
        <div className={`h-1.5 ${cancelled ? 'bg-red-500' : isPast ? 'bg-crm-muted' : 'bg-emerald-500'}`} />
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center">
            {appointment.staff?.imageUrl ? (
              <img src={appointment.staff.imageUrl} alt={appointment.staff.name} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-crm-border object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-crm-border bg-crm-bg flex items-center justify-center text-2xl font-bold">
                {(appointment.staff?.name || '?')[0].toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-black text-crm-text mb-1">{appointment.shop?.name}</h1>
            <p className="text-crm-muted text-sm">with {appointment.staff?.name}</p>
          </div>

          <div className="bg-crm-bg border border-crm-border rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-crm-muted">Service</span>
              <span className="font-bold text-crm-text">{appointment.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-crm-muted">Date</span>
              <span className="font-bold text-crm-text">{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-crm-muted">Time</span>
              <span className="font-bold text-crm-text">{timeStr}</span>
            </div>
            {appointment.servicePrice && (
              <div className="flex justify-between border-t border-crm-border pt-3 mt-3">
                <span className="text-crm-muted">Price</span>
                <span className="font-bold text-crm-text">${appointment.servicePrice}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {cancelled ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-center py-4 rounded-xl font-bold">
                This appointment is cancelled.
              </div>
            ) : isPast ? (
              <div className="bg-crm-bg border border-crm-border text-crm-muted text-center py-4 rounded-xl font-bold">
                This appointment has passed.
              </div>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors border border-red-500/20 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
                <a
                  href={`/sites/${appointment.shop?.id}`}
                  className="block w-full py-4 bg-crm-primary hover:bg-crm-primary/90 text-white font-bold rounded-xl transition-colors text-center"
                >
                  Book Another Appointment
                </a>
                <p className="text-center text-[11px] text-crm-muted px-4">
                  To reschedule, please cancel this appointment and book a new one.
                </p>
              </>
            )}

            {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
