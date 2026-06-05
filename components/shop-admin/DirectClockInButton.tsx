'use client';;
import Image from 'next/image';

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
 className={`w-full sm:w-auto px-8 py-4 sm:py-3 rounded-2xl sm:rounded-xl font-black text-lg sm:text-[13px] shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 ${
 isClockedIn 
 ? 'bg-status-cancelled/90 hover:bg-status-cancelled text-crm-text border border-status-cancelled/50' 
 : 'bg-status-confirmed/90 hover:bg-status-confirmed text-crm-text border border-status-confirmed/50'
 }`}
 >
 <span className="text-2xl sm:text-xl">{isClockedIn ? '⏹️' : '⏱️'}</span>
 {clockingIn ? 'Processing...' : (isClockedIn ? 'CLOCK OUT' : 'CLOCK IN')}
 </button>
 );
}
