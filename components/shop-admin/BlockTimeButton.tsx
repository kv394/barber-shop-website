'use client';;
import Image from 'next/image';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BlockTimeButton({ shopId, staffId, date, time, className }: { shopId: string, staffId: string, date: string, time: string, className?: string }) {
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const handleBlock = async () => {
 setLoading(true);

 try {
 // Create a start date combining date and time
 const startTimeObj = new Date(`${date}T${time}:00Z`);
 const endTimeObj = new Date(startTimeObj.getTime() + 30 * 60000); // 30 mins

 const res = await fetch(`/api/shops/${shopId}/appointments/block`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 staffId,
 startTime: startTimeObj.toISOString(),
 endTime: endTimeObj.toISOString(),
 notes: 'Blocked Time'
 })
 });

 if (res.ok) {
 router.refresh();
 } else {
 const data = await res.json();
 alert(data.error || 'Failed to block time');
 }
 } catch (err) {
 alert('Network error');
 } finally {
 setLoading(false);
 }
 };

 return (
 <button 
 onClick={handleBlock} 
 disabled={loading}
 className={className || "ml-2 px-2 py-1 text-[13px] bg-crm-surface hover:bg-crm-border text-crm-muted rounded border border-crm-border shadow-sm uppercase font-bold tracking-wider disabled:opacity-50 transition-colors"}
 title="Block this time slot"
 >
 {loading ? '...' : 'Block'}
 </button>
 );
}
