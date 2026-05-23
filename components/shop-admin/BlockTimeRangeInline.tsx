'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BlockTimeRangeInlineProps {
  shopId: string;
  staffId: string;
  date: string;
}

export default function BlockTimeRangeInline({ shopId, staffId, date }: BlockTimeRangeInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBlockRange = async () => {
    if (!startTime || !endTime) {
      alert('Please select both start and end times');
      return;
    }
    
    setLoading(true);

    try {
      // Create a start date combining date and time
      const startTimeObj = new Date(`${date}T${startTime}:00Z`);
      const endTimeObj = new Date(`${date}T${endTime}:00Z`);
      
      if (endTimeObj <= startTimeObj) {
        alert('End time must be after start time');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/shops/${shopId}/appointments/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          startTime: startTimeObj.toISOString(),
          endTime: endTimeObj.toISOString(),
          notes: 'Blocked Time Range'
        })
      });

      if (res.ok) {
        setIsOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to block time range');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mt-1 mb-2 py-1.5 text-[12px] bg-crm-surface hover:bg-crm-border text-crm-text font-semibold rounded border border-crm-border border-dashed transition-colors flex items-center justify-center gap-1"
      >
        <span>➕</span> Block Time Range
      </button>
    );
  }

  return (
    <div className="bg-crm-surface/80 border border-crm-border p-3 rounded-lg mb-3 shadow-sm text-[12px]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-crm-accent uppercase tracking-wider text-[11px]">Block Range</h4>
        <button onClick={() => setIsOpen(false)} className="text-crm-muted hover:text-crm-text">✕</button>
      </div>
      <div className="flex gap-2 mb-2 items-center">
        <input 
          type="time" 
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="flex-1 p-1.5 rounded border border-crm-border bg-white text-crm-text focus:outline-none focus:ring-1 focus:ring-crm-primary"
        />
        <span className="text-crm-muted">to</span>
        <input 
          type="time" 
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          className="flex-1 p-1.5 rounded border border-crm-border bg-white text-crm-text focus:outline-none focus:ring-1 focus:ring-crm-primary"
        />
      </div>
      <button 
        onClick={handleBlockRange}
        disabled={loading}
        className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
      >
        {loading ? 'Blocking...' : 'Confirm Block'}
      </button>
    </div>
  );
}
