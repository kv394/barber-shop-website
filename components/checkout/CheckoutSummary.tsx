import React from 'react';
import { fmtPrice } from '@/lib/formatters';

export default function CheckoutSummary({
  subtotal,
  effectiveDiscount,
  tipAmount,
  finalTotal,
  currency,
}: {
  subtotal: number;
  effectiveDiscount: number;
  tipAmount: number;
  finalTotal: number;
  currency: string;
}) {
  return (
    <section className="bg-crm-surface rounded-xl p-4 space-y-1.5 border border-crm-border shadow-sm">
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[13px] text-crm-muted">
        <span>Subtotal</span><span>{fmtPrice(subtotal, currency)}</span>
      </div>
      {effectiveDiscount > 0 && (
        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[13px] text-status-cancelled">
          <span>Discount</span><span>−{fmtPrice(effectiveDiscount, currency)}</span>
        </div>
      )}
      {tipAmount > 0 && (
        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[13px] text-status-pending">
          <span>Tip</span><span>+{fmtPrice(tipAmount, currency)}</span>
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-xl font-black text-crm-text border-t border-crm-border pt-2 mt-1">
        <span>Total</span>
        <span className="text-crm-accent">{fmtPrice(finalTotal, currency)}</span>
      </div>
    </section>
  );
}
