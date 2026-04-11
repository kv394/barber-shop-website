'use client';

import { useState } from 'react';

export default function CompleteWorkButton({ shopId, appointmentId, userName }: { shopId: string; appointmentId: string; userName: string }) {
  const [loading, setLoading] = useState(false);

  const handleCompleteWork = async () => {
    if (!confirm(`Mark ${userName}'s appointment as complete?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'WORK_COMPLETED' }),
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
      onClick={handleCompleteWork}
      disabled={loading}
      className="bg-green-900/50 hover:bg-green-800/50 text-green-300 border border-green-500/30 text-[10px] sm:text-xs px-2 py-1 rounded font-bold disabled:opacity-50 transition-colors"
      title="Complete Work"
    >
      {loading ? '...' : 'Complete Work'}
    </button>
  );
}
