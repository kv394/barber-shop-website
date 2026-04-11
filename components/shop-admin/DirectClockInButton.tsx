'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DirectClockInButton({ shopId, initialIsClockedIn }: { shopId: string, initialIsClockedIn: boolean }) {
  const [clockingIn, setClockingIn] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(initialIsClockedIn);
  const router = useRouter();

  const handleToggle = async () => {
    setClockingIn(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direct: true })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action === 'IN') {
            setIsClockedIn(true);
            alert('Clocked In successfully!');
        } else {
            setIsClockedIn(false);
            alert('Clocked Out successfully!');
        }
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update attendance');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setClockingIn(false);
    }
  };

  return (
    <button 
      onClick={handleToggle} 
      disabled={clockingIn}
      className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 ${
        isClockedIn 
          ? 'bg-red-600 hover:bg-red-500 text-white border-2 border-red-400' 
          : 'bg-green-600 hover:bg-green-500 text-white border-2 border-green-400'
      }`}
    >
      {clockingIn ? 'Processing...' : (isClockedIn ? 'Clock Out' : 'Clock In')}
    </button>
  );
}
