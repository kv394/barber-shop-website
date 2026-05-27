'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAppointmentButton({ shopId, appointmentId, userName }: { shopId: string, appointmentId: string, userName: string }) {
 const [isDeleting, setIsDeleting] = useState(false);
 const router = useRouter();

 const handleDelete = async () => {
 if (!window.confirm(`Are you sure you want to cancel the appointment for ${userName}?`)) {
 return;
 }

 setIsDeleting(true);
 try {
 const response = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}`, {
 method: 'DELETE',
 headers: { 'Content-Type': 'application/json' },
 });

 if (response.ok) {
 router.refresh();
 } else {
 const data = await response.json();
 alert(data.error || "Failed to cancel appointment.");
 }
 } catch (err: any) {
 console.error(err);
 alert("Network error occurred.");
 } finally {
 setIsDeleting(false);
 }
 };

 return (
 <button 
 onClick={handleDelete} 
 disabled={isDeleting}
 className="text-status-cancelled hover:text-status-cancelled text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
 aria-label="Cancel appointment"
 >
 {isDeleting ? 'Canceling...' : 'Cancel'}
 </button>
 );
}
