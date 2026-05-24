'use client';
import { useState } from 'react';
import ClientDetailModal from '@/components/clients/ClientDetailModal';

export default function ClientNameClickable({ shopId, clientId, clientName, className, currency = 'USD' }: { shopId: string, clientId: string, clientName: string, className?: string, currency?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} 
        className={`hover:text-orange-500 transition-colors cursor-pointer text-left ${className}`}
        title="View Client Details"
      >
        {clientName}
      </button>
      {isOpen && (
        <ClientDetailModal 
          shopId={shopId} 
          clientId={clientId} 
          clientName={clientName} 
          onClose={() => setIsOpen(false)} 
          currency={currency}
        />
      )}
    </>
  );
}
