'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteLocationButton({ shopId, shopName }: { shopId: string, shopName: string }) {
 const [isDeleting, setIsDeleting] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [confirmText, setConfirmText] = useState('');
 const router = useRouter();

 const handleDelete = async () => {
 if (confirmText !== shopName) {
 alert('Please type the exact location name to confirm.');
 return;
 }

 setIsDeleting(true);
 try {
 const res = await fetch(`/api/shops/${shopId}`, {
 method: 'DELETE',
 });

 if (!res.ok) {
 const data = await res.json();
 throw new Error(data.error || 'Failed to delete location');
 }

 alert('Location deleted successfully');
 // Hard refresh to clear caches and redirect to shop list or root
 window.location.href = '/shop';
 } catch (error: any) {
 console.error(error);
 alert(error.message || 'An error occurred while deleting the location');
 setIsDeleting(false);
 setShowConfirm(false);
 setConfirmText('');
 }
 };

 if (!showConfirm) {
 return (
 <button 
 onClick={() => setShowConfirm(true)}
 className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 font-bold transition-colors text-sm"
 >
 Delete Location
 </button>
 );
 }

 return (
 <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-crm-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6">
 <h3 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h3>
 <p className="text-crm-text text-sm mb-4">
 This action will permanently delete the location <strong>{shopName}</strong> and all of its associated data (appointments, clients, services, etc). This cannot be undone.
 </p>
 <p className="text-crm-text text-sm mb-2 font-bold">
 Please type <strong>{shopName}</strong> to confirm.
 </p>
 <input 
 type="text" 
 value={confirmText}
 onChange={(e) => setConfirmText(e.target.value)}
 className="w-full bg-crm-bg border border-crm-border rounded-lg p-2.5 text-crm-text focus:ring-2 focus:ring-red-500 outline-none transition-all mb-6"
 placeholder={shopName}
 />
 <div className="flex gap-3">
 <button 
 onClick={() => { setShowConfirm(false); setConfirmText(''); }}
 disabled={isDeleting}
 className="flex-1 bg-crm-bg hover:bg-gray-200 text-crm-text font-bold py-2.5 rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button 
 onClick={handleDelete}
 disabled={isDeleting || confirmText !== shopName}
 className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
 >
 {isDeleting ? 'Deleting...' : 'Permanently Delete'}
 </button>
 </div>
 </div>
 </div>
 );
}
