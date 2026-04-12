'use client';

import { useState, useEffect, useMemo } from 'react';

interface RescheduleModalProps {
  appointmentId: string;
  shopId: string;
  currentDate: string; // ISO string
  currentStaffId: string;
  serviceDuration: number;
  serviceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Staff {
  id: string;
  name: string;
  workingHours: any;
}

interface BookedSlot {
  startTime: string;
  endTime: string;
  staffId: string;
}

export default function RescheduleModal({
  appointmentId,
  shopId,
  currentDate,
  currentStaffId,
  serviceDuration,
  serviceName,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate).toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(currentStaffId);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch staff + bookings when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [staffRes, aptsRes] = await Promise.all([
          fetch(`/api/shops/${shopId}/staff?date=${selectedDate}`, { signal: controller.signal }),
          fetch(`/api/shops/${shopId}/appointments?date=${selectedDate}`, { signal: controller.signal }),
        ]);
        const [staffData, aptsData] = await Promise.all([
          staffRes.ok ? staffRes.json() : [],
          aptsRes.ok ? aptsRes.json() : [],
        ]);
        setAllStaff(staffData);
        setBookedSlots(aptsData);
      } catch (err: any) {
        if (err.name !== 'AbortError') setError('Failed to load availability');
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [selectedDate, shopId]);

  const isStaffFreeAt = (staffId: string, timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const slotStart = new Date(`${selectedDate}T00:00:00Z`);
    slotStart.setUTCHours(h, m, 0, 0);
    const slotEnd = slotStart.getTime() + serviceDuration * 60000;
    return !bookedSlots.some(b => {
      if (b.staffId !== staffId) return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return slotStart.getTime() < bEnd && slotEnd > bStart;
    });
  };

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedStaff || allStaff.length === 0) return [];
    const staff = allStaff.find(s => s.id === selectedStaff);
    if (!staff) return [];

    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
      new Date(selectedDate).getUTCDay()
    ];
    const hours = (staff.workingHours as any)?.[dayOfWeek] || { open: '09:00', close: '17:00' };
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);

    const slots: string[] = [];
    const start = new Date(`${selectedDate}T00:00:00Z`);
    start.setUTCHours(openH, openM, 0, 0);
    const end = new Date(`${selectedDate}T00:00:00Z`);
    end.setUTCHours(closeH, closeM, 0, 0);

    let cursor = new Date(start);
    while (cursor < end) {
      const timeStr = cursor.toUTCString().split(' ')[4].substring(0, 5);
      if (isStaffFreeAt(selectedStaff, timeStr)) {
        slots.push(timeStr);
      }
      cursor = new Date(cursor.getTime() + 30 * 60000);
    }
    return slots;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedStaff, allStaff, bookedSlots]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime || !selectedStaff) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const [hour, minute] = selectedTime.split(':').map(Number);
      const newStart = new Date(selectedDate);
      newStart.setUTCHours(hour, minute, 0, 0);

      const res = await fetch(`/api/my-appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          staffId: selectedStaff,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reschedule');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-botanical-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-botanical-surface rounded-xl p-6 w-full max-w-md border-2 border-b-[6px] border-botanical-border shadow-2xl relative text-left max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-botanical-muted hover:text-botanical-text bg-botanical-surface rounded-full w-8 h-8 flex items-center justify-center">✕</button>

        <h3 className="text-xl font-bold text-botanical-text mb-1">Reschedule Appointment</h3>
        <p className="text-botanical-accent font-semibold mb-6">{serviceName}</p>

        {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded mb-4">{error}</p>}

        <div className="space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm text-botanical-muted mb-2">New Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
              min={new Date().toISOString().split('T')[0]}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-3 text-botanical-text focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Staff */}
          <div>
            <label className="block text-sm text-botanical-muted mb-2">Staff</label>
            {isLoading ? (
              <p className="text-botanical-muted text-sm">Loading...</p>
            ) : (
              <select
                value={selectedStaff}
                onChange={(e) => { setSelectedStaff(e.target.value); setSelectedTime(''); }}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-3 text-botanical-text focus:outline-none focus:border-brand-gold"
              >
                <option value="">— Select staff —</option>
                {allStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name || 'Staff'}</option>
                ))}
              </select>
            )}
          </div>

          {/* Time */}
          {selectedStaff && (
            <div>
              <label className="block text-sm text-botanical-muted mb-2">New Time</label>
              {availableSlots.length > 0 ? (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-3 text-botanical-text focus:outline-none focus:border-brand-gold"
                >
                  <option value="">— Choose a time —</option>
                  {availableSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <p className="text-amber-400 text-sm bg-amber-900/20 p-3 rounded">No slots available for this date/staff.</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-botanical-border">
            <button onClick={onClose} className="flex-1 border-2 border-b-[6px] border-botanical-border text-botanical-text font-semibold py-3 rounded-lg hover:bg-botanical-surface transition-colors">
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              disabled={!selectedTime || isSubmitting}
              className="flex-1 bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

