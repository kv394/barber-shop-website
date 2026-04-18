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
      className="bg-crm-primary text-white text-[11px] font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap hover:opacity-90"
      title="Complete Work"
    >
      {loading ? '...' : 'Complete Work'}
    </button>
  );
}
