'use client';;
import Image from 'next/image';

import { useState } from 'react';

export default function RefundButton({
 shopId,
 appointmentId,
 totalAmount,
}: {
 shopId: string;
 appointmentId: string;
 totalAmount: number;
}) {
 const [isRefunding, setIsRefunding] = useState(false);
 const [showForm, setShowForm] = useState(false);
 const [amount, setAmount] = useState(totalAmount.toFixed(2));

 const handleRefund = async () => {
 if (!confirm(`Refund $${parseFloat(amount).toFixed(2)}? This cannot be undone.`)) return;
 setIsRefunding(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}/refund`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ amount: parseFloat(amount) }),
 });
 if (res.ok) {
 window.location.reload();
 } else {
 const data = await res.json();
 alert(data.error || 'Refund failed');
 }
 } catch {
 alert('Refund failed');
 } finally {
 setIsRefunding(false);
 }
 };

 if (showForm) {
 return (
 <div className="flex items-center gap-1">
 <input
 type="number"
 value={amount}
 onChange={(e) => setAmount(e.target.value)}
 step="0.01"
 min="0.01"
 max={totalAmount}
 className="w-20 bg-crm-surface border border-crm-border shadow-sm rounded px-2 py-1 text-[11px] text-crm-text"
 />
 <button onClick={handleRefund} disabled={isRefunding} className="bg-status-pending/80 text-crm-text text-[13px] px-2 py-1 rounded hover:bg-status-pending disabled:opacity-50">
 {isRefunding ? '...' : '💸'}
 </button>
 <button onClick={() => setShowForm(false)} className="text-crm-muted text-[13px] px-1 hover:text-crm-text">✕</button>
 </div>
 );
 }

 return (
 <button
 onClick={() => setShowForm(true)}
 className="text-status-pending text-[13px] hover:text-amber-300 px-2 py-1 bg-amber-900/20 border border-status-pending/20 rounded"
 title="Refund"
 aria-label="Refund payment"
 >
 💸 Refund
 </button>
 );
}

