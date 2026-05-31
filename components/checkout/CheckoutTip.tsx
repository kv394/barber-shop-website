import React from 'react';
import { fmtPrice, getCurrencySymbol } from '@/lib/formatters';

export default function CheckoutTip({
  tipAmount,
  setTipAmount,
  customTip,
  setCustomTip,
  currency,
}: {
  tipAmount: number;
  setTipAmount: (amt: number) => void;
  customTip: string;
  setCustomTip: (val: string) => void;
  currency: string;
}) {
  const TIP_PRESETS = [0, 2, 5, 10];
  return (
    <section>
      <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Tip</h3>
      <div className="flex gap-2 flex-wrap">
        {TIP_PRESETS.map(t => (
          <button
            key={t}
            onClick={() => { setTipAmount(t); setCustomTip(''); }}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
              tipAmount === t && customTip === ''
                ? 'bg-crm-primary text-white'
                : 'bg-crm-surface text-crm-muted hover:bg-crm-surface'
            }`}
          >
            {t === 0 ? 'No Tip' : fmtPrice(t, currency)}
          </button>
        ))}
        <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 border transition-colors ${customTip ? 'bg-crm-primary/10 border-brand-indigo/40' : 'bg-crm-surface border-transparent'} hover:opacity-90 text-white`}>
          <span className="text-crm-muted text-[13px]">{getCurrencySymbol(currency)}</span>
          <input
            type="number" min={0} step={0.5}
            value={customTip}
            onChange={e => {
              setCustomTip(e.target.value);
              setTipAmount(parseFloat(e.target.value) || 0);
            }}
            placeholder="Custom"
            className="w-16 bg-transparent text-crm-text text-[13px] focus:outline-none placeholder-gray-600"
          />
        </div>
      </div>
    </section>
  );
}
