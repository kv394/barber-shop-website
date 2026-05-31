import React from 'react';

export default function CheckoutPaymentMethod({
  paymentMethod,
  setPaymentMethod,
}: {
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
}) {
  return (
    <section>
      <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Payment Method</h3>
      <div className="flex gap-2">
        {(['CASH', 'CARD', 'MOBILE'] as const).map(m => (
          <button
            key={m}
            onClick={() => setPaymentMethod(m)}
            className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
              paymentMethod === m ? 'bg-status-confirmed text-crm-text shadow-lg' : 'bg-crm-surface text-crm-muted hover:text-crm-text'
            }`}
          >
            {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 Mobile'}
          </button>
        ))}
      </div>
    </section>
  );
}
