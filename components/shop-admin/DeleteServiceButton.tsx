'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteServiceButton({ shopId, serviceId }: { shopId: string, serviceId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/shops/${shopId}/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Use router.refresh() to tell Next.js to re-fetch the Server Component data
        router.refresh();
      } else {
        try {
            const data = await response.json();
            alert(data.error || "Failed to delete service.");
        } catch(e) {
            alert(`Failed to delete service. Server returned status ${response.status}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected network error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-botanical-text px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
