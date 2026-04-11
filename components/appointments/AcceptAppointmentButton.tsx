'use client';

import { useState } from 'react';

export default function AcceptAppointmentButton({ shopId, appointmentId, userName }: { shopId: string; appointmentId: string; userName: string }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!confirm(`Accept ${userName}'s appointment?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      if (res.ok) window.location.reload();
      else alert('Failed to update');
    } catch {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      title="Accept Booking"
    >
      {loading ? '...' : 'Accept'}
    </button>
  );
}
