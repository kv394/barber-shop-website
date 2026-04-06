'use client';

import { useState } from 'react';

export default function NoShowButton({ shopId, appointmentId, userName }: { shopId: string; appointmentId: string; userName: string }) {
  const [loading, setLoading] = useState(false);

  const handleNoShow = async () => {
    if (!confirm(`Mark ${userName}'s appointment as No-Show?`)) return;
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
      className="bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs px-2 py-1 rounded font-bold disabled:opacity-50 transition-colors"
      title="Mark as No-Show"
    >
      {loading ? '...' : '🚫'}
    </button>
  );
}

