'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutButton({ shopId, appointmentId, price, serviceName, serviceId, shopName }: { shopId: string, appointmentId: string, price: number, serviceName?: string, serviceId?: string, shopName?: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    // In a real application, this would redirect to a Stripe Checkout Session
    // or integrate with Square/SumUp hardware via their Web APIs.
    // For this boilerplate, we simulate a successful cash/card terminal transaction.
    
    if (!window.confirm(`Confirm payment of $${price.toFixed(2)} received?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert("Payment marked as complete!");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to process checkout.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Network error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout} 
      disabled={isProcessing}
      className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50 ml-3"
    >
      {isProcessing ? 'Processing...' : 'Checkout'}
    </button>
  );
}
