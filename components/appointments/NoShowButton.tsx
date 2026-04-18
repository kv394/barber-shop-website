'use client';

import { useState } from 'react';

export default function NoShowButton({ shopId, appointmentId, userName }: { shopId: string; appointmentId: string; userName: string }) {
  const [loading, setLoading] = useState(false);

  const handleNoShow = async () => {
    if (!confirm(`Mark ${userName}'s appointment as No-Show?\n\nIf they have a card on file, they will automatically be charged a 50% cancellation fee.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NO_SHOW' }),
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
      onClick={handleNoShow}
      disabled={loading}
      className="text-status-pending hover:text-status-pending text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50 transition-colors mr-2"
      title="Mark as No-Show"
    >
      {loading ? '...' : 'No-Show'}
    </button>
  );
}

