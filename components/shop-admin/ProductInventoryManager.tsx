'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductInventoryManager({ 
  shopId, 
  productId, 
  currentCount,
  lowStockThreshold = 5,
  mediumStockThreshold = 10
}: { 
  shopId: string, 
  productId: string, 
  currentCount: number,
  lowStockThreshold?: number,
  mediumStockThreshold?: number
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const handleUpdate = async (newCount: number) => {
    if (newCount < 0) {
      alert("Inventory count cannot be negative.");
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/shops/${shopId}/products/${productId}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update inventory.");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating inventory.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdd = () => {
    handleUpdate(currentCount + quantity);
  };

  const handleSet = () => {
    handleUpdate(quantity);
  };

  let colorClass = 'text-green-400';
  if (currentCount <= lowStockThreshold) {
      colorClass = 'text-red-500 font-bold';
  } else if (currentCount <= mediumStockThreshold) {
      colorClass = 'text-amber-400';
  }

  return (
    <div className="flex items-center space-x-2 bg-botanical-surface p-1 rounded-lg">
      <span className={`text-lg w-12 text-center font-mono font-bold ${colorClass}`}>
        {currentCount}
      </span>
      
      <input 
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
        className="w-16 bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded-md p-1 text-center text-botanical-text focus:outline-none focus:ring-2 focus:ring-botanical-primary"
        min="0"
      />

      <button 
        onClick={handleAdd} 
        disabled={isUpdating}
        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-botanical-text rounded-md font-semibold disabled:opacity-50"
      >
        Add
      </button>
      
      <button 
        onClick={handleSet} 
        disabled={isUpdating}
        className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-botanical-text rounded-md font-semibold disabled:opacity-50"
      >
        Set
      </button>
    </div>
  );
}
