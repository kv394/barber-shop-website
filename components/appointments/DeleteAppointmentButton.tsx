'use client';;
import Image from 'next/image';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAppointmentButton({ shopId, appointmentId, userName }: { shopId: string, appointmentId: string, userName: string }) {
 const [isDeleting, setIsDeleting] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const router = useRouter();

 const handleDelete = async () => {
 setShowConfirm(false);
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
 <>
 <button 
 onClick={() => setShowConfirm(true)} 
 disabled={isDeleting}
 className="text-status-cancelled hover:text-status-cancelled text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
 aria-label="Cancel appointment"
 >
 {isDeleting ? 'Canceling...' : 'Cancel'}
 </button>

 {showConfirm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
 <h3 className="font-bold text-lg text-crm-text mb-2">Cancel Appointment?</h3>
 <p className="text-crm-muted text-sm mb-6">Are you sure you want to cancel the appointment for {userName}? This action cannot be undone.</p>
 <div className="flex gap-3">
 <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-crm-border text-crm-text font-medium hover:bg-crm-surface">Keep It</button>
 <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">Yes, Cancel</button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
