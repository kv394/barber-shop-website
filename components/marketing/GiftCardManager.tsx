'use client';

import { useState, useEffect } from 'react';

interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  recipientEmail: string | null;
  recipientName: string | null;
  purchaserEmail: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function GiftCardManager({ shopId }: { shopId: string }) {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('50');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchCards = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/gift-cards`);
      if (res.ok) setCards(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCards(); }, []);

  const handleCreate = async () => {
    setCreating(true); setError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/gift-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), recipientEmail, recipientName, purchaserEmail, expiresInDays: 365 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false); setAmount('50'); setRecipientEmail(''); setRecipientName(''); setPurchaserEmail('');
      fetchCards();
    } catch (e: any) { setError(e.message); }
    finally { setCreating(false); }
  };

  const totalValue = cards.filter(c => c.status === 'ACTIVE').reduce((s, c) => s + c.currentBalance, 0);
  const totalSold = cards.reduce((s, c) => s + c.initialBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-botanical-muted uppercase">Total Sold</p>
            <p className="text-2xl font-bold text-botanical-accent">${totalSold.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-botanical-muted uppercase">Outstanding</p>
            <p className="text-2xl font-bold text-green-400">${totalValue.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-botanical-muted uppercase">Cards Issued</p>
            <p className="text-2xl font-bold text-botanical-text">{cards.length}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-botanical-primary text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors">
          {showForm ? 'Cancel' : '+ Create Gift Card'}
        </button>
      </div>

      {showForm && (
        <div className="bg-botanical-surface p-6 rounded-lg border border-botanical-border shadow-sm space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-botanical-muted mb-1">Amount ($) *</label>
              <input type="number" min="5" step="5" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" />
            </div>
            <div>
              <label className="block text-xs text-botanical-muted mb-1">Recipient Name</label>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="John Doe" className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-botanical-text text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
            </div>
            <div>
              <label className="block text-xs text-botanical-muted mb-1">Recipient Email (sends card)</label>
              <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="recipient@email.com" className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-botanical-text text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
            </div>
            <div>
              <label className="block text-xs text-botanical-muted mb-1">Purchaser Email</label>
              <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="buyer@email.com" className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-botanical-text text-sm placeholder-gray-600 focus:outline-none focus:border-brand-gold" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !amount} className="bg-botanical-primary text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors disabled:opacity-50">
            {creating ? 'Creating…' : 'Create & Send Gift Card'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-botanical-muted text-center py-8 animate-pulse">Loading…</p>
      ) : cards.length === 0 ? (
        <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded">No gift cards created yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-botanical-border text-botanical-muted text-xs uppercase">
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Recipient</th>
                <th className="text-right p-3">Value</th>
                <th className="text-right p-3">Balance</th>
                <th className="text-center p-3">Status</th>
                <th className="text-right p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card.id} className="border-b border-botanical-border hover:bg-botanical-surface">
                  <td className="p-3 font-mono text-botanical-accent font-bold tracking-wider text-xs">{card.code}</td>
                  <td className="p-3 text-botanical-muted">{card.recipientName || card.recipientEmail || '—'}</td>
                  <td className="p-3 text-right text-botanical-text">${card.initialBalance.toFixed(2)}</td>
                  <td className="p-3 text-right font-semibold text-green-400">${card.currentBalance.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${card.status === 'ACTIVE' ? 'bg-green-900/40 text-green-300' : card.status === 'REDEEMED' ? 'bg-blue-900/40 text-blue-300' : 'bg-botanical-surface/40 text-botanical-muted'}`}>
                      {card.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-botanical-muted text-xs">{new Date(card.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

