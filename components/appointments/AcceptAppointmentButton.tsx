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
      className="bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 border border-blue-500/30 text-[10px] sm:text-xs px-2 py-1 rounded font-bold disabled:opacity-50 transition-colors"
      title="Accept Appointment"
    >
      {loading ? '...' : 'Accept'}
    </button>
  );
}
