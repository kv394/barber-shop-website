'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteShopButton({ shopId, shopName, onSuccess, isActive = true }: { shopId: string, shopName: string, onSuccess: () => void, isActive?: boolean }) {
 const [isDeleting, setIsDeleting] = useState(false);
 const router = useRouter();

 const handleDelete = async (e: React.MouseEvent) => {
 e.preventDefault(); 
 
 const isHardDelete = !isActive;
 const actionText = isHardDelete ? 'permanently delete' : 'deactivate';
 const confirmMessage = isHardDelete 
 ? `This is a destructive action. This will PERMANENTLY DELETE the shop, all its services, and all appointments.\n\nTo proceed, please type the ID of the shop: "${shopId}"`
 : `This will deactivate the shop and freeze all activity. Data will be preserved.\n\nTo proceed, please type the ID of the shop: "${shopId}"`;
 
 const confirmId = window.prompt(confirmMessage);
 
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
 className={isHardDelete 
 ? "bg-status-cancelled/20 text-status-cancelled hover:bg-status-cancelled hover:text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50"
 : "bg-status-pending/20 text-status-pending hover:bg-status-pending hover:text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50"
 }
 >
 {isDeleting ? (isHardDelete ? 'Deleting...' : 'Deactivating...') : (isHardDelete ? 'Delete Permanently' : 'Deactivate Shop')}
 </button>
 );
}
