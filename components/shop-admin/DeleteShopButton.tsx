'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteShopButton({ shopId, shopName, onSuccess }: { shopId: string, shopName: string, onSuccess: () => void }) {
 const [isDeleting, setIsDeleting] = useState(false);
 const router = useRouter();

 const handleDelete = async (e: React.MouseEvent) => {
 e.preventDefault(); 
 
 const confirmId = window.prompt(`This is a destructive action. This will permanently delete the shop, all its services, and all appointments.\n\nTo proceed, please type the ID of the shop: "${shopId}"`);
 
 if (confirmId !== shopId) {
 if(confirmId !== null) {
 alert("Shop ID did not match. Deletion cancelled.");
 }
 return;
 }
 
 setIsDeleting(true);
 try {
 const response = await fetch(`/api/shops/${shopId}`, {
 method: 'DELETE',
 headers: {
 'Content-Type': 'application/json',
 }
 });

 if (response.ok) {
 onSuccess();
 router.refresh();
 } else {
 try {
 const data = await response.json();
 alert(data.error || "Failed to delete shop.");
 } catch(e) {
 alert(`Failed to delete shop. Server returned status ${response.status}`);
 }
 setIsDeleting(false);
 }
 } catch (err: any) {
 console.error(err);
 alert(err.message || "An unexpected network error occurred while deleting.");
 setIsDeleting(false);
 }
 };

 return (
 <button 
 onClick={handleDelete} 
 disabled={isDeleting}
 className="bg-status-cancelled/20 text-status-cancelled hover:bg-status-cancelled hover:text-crm-text px-4 py-2 rounded-lg text-[13px] transition-colors disabled:opacity-50"
 >
 {isDeleting ? 'Deleting...' : 'Delete Shop'}
 </button>
 );
}
