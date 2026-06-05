import Image from 'next/image';
import React from 'react';
import { getCurrencySymbol } from '@/lib/formatters';

export default function CheckoutDiscount({
  discount,
  setDiscount,
  subtotal,
  setIsScanningDiscount,
  discountMessage,
  currency,
}: {
  discount: number;
  setDiscount: (val: number) => void;
  subtotal: number;
  setIsScanningDiscount: (val: boolean) => void;
  discountMessage: { text: string, type: 'success' | 'error' } | null;
  currency: string;
}) {
  return (
    <section>
      <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Discount</h3>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-crm-surface rounded-lg px-3 py-2 w-36 border border-transparent focus-within:border-brand-indigo/40 transition-colors shadow-sm">
          <span className="text-crm-muted text-[13px]">{getCurrencySymbol(currency)}</span>
          <input
            type="number" min={0} step={0.5} max={subtotal}
            value={discount || ''}
            onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full bg-transparent text-crm-text text-[13px] focus:outline-none placeholder-gray-600"
          />
        </div>
        <button
          onClick={() => setIsScanningDiscount(true)}
          className="px-4 py-2 bg-crm-surface shadow-sm border border-crm-border rounded-lg text-[13px] font-semibold text-crm-text hover:bg-crm-primary/10 hover:text-crm-primary hover:border-crm-primary/40 transition-colors flex items-center gap-2"
        >
          📷 Scan QR
        </button>
      </div>
      {discountMessage && (
        <p className={`mt-2 text-[12px] font-semibold ${discountMessage.type === 'success' ? 'text-status-confirmed' : 'text-status-cancelled'}`}>
          {discountMessage.type === 'success' ? '✅ ' : '❌ '}{discountMessage.text}
        </p>
      )}
    </section>
  );
}
