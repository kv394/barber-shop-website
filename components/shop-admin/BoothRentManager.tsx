'use client';

import { useState, useEffect, useCallback } from 'react';

const PAYMENT_METHODS = ['Cash', 'Zelle', 'Venmo', 'CashApp', 'Card', 'Bank Transfer', 'Other'];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function getPeriodDates(interval: string): { start: string; end: string } {
  const now = new Date();
  if (interval === 'WEEKLY') {
    // Start: next Monday
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + daysUntilMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  } else {
    // Monthly: next calendar month
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }
}

interface Renter {
  id: string;
  name: string | null;
  email: string;
  boothRentAmount: number | null;
  boothRentInterval: string | null;
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  user?: { id: string; name: string | null; email: string };
}

export default function BoothRentManager({
  shopId,
  renters,
  isRenterView,
  currentUserId,
}: {
  shopId: string;
  renters: Renter[];
  isRenterView: boolean;
  currentUserId?: string;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRenter, setExpandedRenter] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/booth-rent?t=${Date.now()}`);
      if (res.ok) setPayments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const generateInvoice = async (renter: Renter) => {
    if (!renter.boothRentAmount || !renter.boothRentInterval) {
      alert('This renter has no rent amount configured. Edit their profile first.');
      return;
    }
    setGenerating(renter.id);
    try {
      const { start, end } = getPeriodDates(renter.boothRentInterval);
      const res = await fetch(`/api/shops/${shopId}/booth-rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: renter.id,
          amount: renter.boothRentAmount,
          periodStart: start,
          periodEnd: end,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate invoice');
      await fetchPayments();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGenerating(null);
    }
  };

  const markAsPaid = async (paymentId: string) => {
    setMarkingPaid(paymentId);
    try {
      const method = paymentMethods[paymentId] || 'Cash';
      const res = await fetch(`/api/shops/${shopId}/booth-rent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status: 'COMPLETED', paymentMethod: method }),
      });
      if (!res.ok) throw new Error('Failed to mark as paid');
      await fetchPayments();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setMarkingPaid(null);
    }
  };

  // --- Renter self-service view ---
  if (isRenterView) {
    const myPayments = payments.filter(p => p.userId === currentUserId).sort(
      (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    );
    const outstanding = myPayments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

    return (
      <div className="space-y-6">
        {/* Outstanding Banner */}
        {outstanding > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-3xl">💳</span>
            <div>
              <p className="font-bold text-amber-800 text-lg">{fmtCurrency(outstanding)} Outstanding</p>
              <p className="text-amber-700 text-[13px]">You have unpaid booth rent. Please settle with your shop owner.</p>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent" />
          <div className="p-6">
            <h3 className="font-bold text-crm-text text-lg mb-4">My Rent History</h3>
            {loading ? (
              <p className="text-crm-muted text-[13px]">Loading...</p>
            ) : myPayments.length === 0 ? (
              <p className="text-crm-muted italic text-[13px]">No rent records yet.</p>
            ) : (
              <div className="space-y-3">
                {myPayments.map(p => {
                  const isOverdue = p.status === 'PENDING' && new Date(p.periodEnd) < new Date();
                  const statusColor = p.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isOverdue
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';
                  const statusLabel = p.status === 'COMPLETED' ? '✓ Paid' : isOverdue ? '⚠ Overdue' : '⏳ Pending';

                  return (
                    <div key={p.id} className="flex flex-wrap justify-between items-center gap-3 p-4 bg-crm-bg/50 rounded-xl border border-crm-border">
                      <div>
                        <p className="font-bold text-crm-text">{fmtCurrency(p.amount)}</p>
                        <p className="text-crm-muted text-[13px]">{fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}</p>
                        {p.paidAt && <p className="text-[11px] text-crm-muted">Paid {fmtDate(p.paidAt)}{p.paymentMethod ? ` via ${p.paymentMethod}` : ''}</p>}
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Admin management view ---
  return (
    <div className="space-y-6">
      {renters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-crm-surface/50 rounded-2xl border border-dashed border-crm-border">
          <span className="text-4xl mb-3">🏠</span>
          <h3 className="font-bold text-crm-text text-lg mb-1">No Booth Renters</h3>
          <p className="text-crm-muted text-[13px] max-w-xs">
            Invite team members with the "Booth Renter" role from Settings → Team.
          </p>
        </div>
      ) : (
        renters.map(renter => {
          const renterPayments = payments.filter(p => p.userId === renter.id).sort(
            (a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
          );
          const pendingTotal = renterPayments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
          const isExpanded = expandedRenter === renter.id;

          return (
            <div key={renter.id} className="bg-crm-surface border border-crm-border rounded-2xl overflow-hidden shadow-sm">
              <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400/60 to-transparent" />
              <div className="p-5">
                {/* Renter Header */}
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-crm-text text-lg">{renter.name || renter.email.split('@')[0]}</h3>
                      <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Booth Renter</span>
                    </div>
                    <p className="text-crm-muted text-[13px]">{renter.email}</p>
                    {renter.boothRentAmount ? (
                      <p className="text-[13px] font-semibold text-crm-text mt-1">
                        💳 {fmtCurrency(renter.boothRentAmount)} / {renter.boothRentInterval === 'WEEKLY' ? 'week' : 'month'}
                      </p>
                    ) : (
                      <p className="text-[13px] text-amber-600 mt-1">⚠️ No rent rate set — edit profile to configure</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {pendingTotal > 0 && (
                      <span className="text-[13px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        {fmtCurrency(pendingTotal)} outstanding
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateInvoice(renter)}
                        disabled={generating === renter.id || !renter.boothRentAmount}
                        className="text-[13px] font-semibold px-3 py-1.5 rounded-lg bg-crm-primary text-white hover:bg-crm-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generating === renter.id ? 'Generating…' : '+ Generate Invoice'}
                      </button>
                      <button
                        onClick={() => setExpandedRenter(isExpanded ? null : renter.id)}
                        className="text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-crm-border text-crm-text hover:border-crm-primary transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'View History'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment History (expanded) */}
                {isExpanded && (
                  <div className="border-t border-crm-border pt-4 space-y-3">
                    <p className="text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-2">Payment Records</p>
                    {loading ? (
                      <p className="text-crm-muted text-[13px]">Loading…</p>
                    ) : renterPayments.length === 0 ? (
                      <p className="text-crm-muted italic text-[13px]">No payment records yet. Generate an invoice to get started.</p>
                    ) : (
                      renterPayments.map(p => {
                        const isOverdue = p.status === 'PENDING' && new Date(p.periodEnd) < new Date();
                        const statusColor = p.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isOverdue
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200';
                        const statusLabel = p.status === 'COMPLETED' ? '✓ Paid' : isOverdue ? '⚠ Overdue' : '⏳ Pending';

                        return (
                          <div key={p.id} className="flex flex-wrap justify-between items-center gap-3 p-3 bg-crm-bg/50 rounded-xl border border-crm-border">
                            <div>
                              <p className="font-bold text-crm-text">{fmtCurrency(p.amount)}</p>
                              <p className="text-crm-muted text-[13px]">{fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}</p>
                              {p.paidAt && (
                                <p className="text-[11px] text-crm-muted">Collected {fmtDate(p.paidAt)}{p.paymentMethod ? ` via ${p.paymentMethod}` : ''}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusColor}`}>
                                {statusLabel}
                              </span>
                              {p.status === 'PENDING' && (
                                <div className="flex items-center gap-1">
                                  <select
                                    value={paymentMethods[p.id] || 'Cash'}
                                    onChange={e => setPaymentMethods(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    className="text-[11px] bg-crm-surface border border-crm-border rounded px-2 py-1 text-crm-text focus:outline-none"
                                  >
                                    {PAYMENT_METHODS.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => markAsPaid(p.id)}
                                    disabled={markingPaid === p.id}
                                    className="text-[11px] font-bold px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                  >
                                    {markingPaid === p.id ? '…' : 'Mark Paid'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
