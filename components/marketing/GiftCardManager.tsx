'use client';

import { useState, useEffect } from 'react';
import { fmtPrice } from '@/lib/formatters';

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

export default function GiftCardManager({ shopId, currency }: { shopId: string, currency: string }) {
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
 <p className="text-crm-muted uppercase text-[13px]">Total Sold</p>
 <p className="font-bold text-crm-accent text-xl font-bold">{fmtPrice(totalSold, currency)}</p>
 </div>
 <div>
 <p className="text-crm-muted uppercase text-[13px]">Outstanding</p>
 <p className="font-bold text-status-confirmed text-xl font-bold">{fmtPrice(totalValue, currency)}</p>
 </div>
 <div>
 <p className="text-crm-muted uppercase text-[13px]">Cards Issued</p>
 <p className="font-bold text-crm-text text-xl font-bold">{cards.length}</p>
 </div>
 </div>
 <button onClick={() => setShowForm(!showForm)} className="bg-crm-primary text-white font-bold px-4 py-2 rounded-lg text-[13px] hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors">
 {showForm ? 'Cancel' : '+ Create Gift Card'}
 </button>
 </div>

 {showForm && (
 <div className="bg-crm-surface p-6 rounded-lg border border-crm-border shadow-sm space-y-4">
 {error && <p className="text-status-cancelled text-[13px]">{error}</p>}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-crm-muted mb-1 text-[13px]">Amount ($) *</label>
 <input type="number" min="5" step="5" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo" />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 text-[13px]">Recipient Name</label>
 <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="John Doe" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-indigo" />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 text-[13px]">Recipient Email (sends card)</label>
 <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="recipient@email.com" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-indigo" />
 </div>
 <div>
 <label className="block text-crm-muted mb-1 text-[13px]">Purchaser Email</label>
 <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="buyer@email.com" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-crm-text text-[13px] placeholder-gray-600 focus:outline-none focus:border-brand-indigo" />
 </div>
 </div>
 <button onClick={handleCreate} disabled={creating || !amount} className="bg-crm-primary text-white font-bold px-6 py-2 rounded-lg text-[13px] hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50">
 {creating ? 'Creating…' : 'Create & Send Gift Card'}
 </button>
 </div>
 )}

 {loading ? (
 <p className="text-crm-muted text-center py-8 animate-pulse text-[13px]">Loading…</p>
 ) : cards.length === 0 ? (
 <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded text-[13px]">No gift cards created yet.</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-[13px]">
 <thead>
 <tr className="border-b border-crm-border text-crm-muted text-[11px] uppercase">
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
 <tr key={card.id} className="border-b border-crm-border hover:bg-crm-surface">
 <td className="p-3 font-mono text-crm-accent font-bold tracking-wider text-[11px]">{card.code}</td>
 <td className="p-3 text-crm-muted">{card.recipientName || card.recipientEmail || '—'}</td>
 <td className="p-3 text-right text-crm-text">{fmtPrice(card.initialBalance, currency)}</td>
 <td className="p-3 text-right font-semibold text-status-confirmed">{fmtPrice(card.currentBalance, currency)}</td>
 <td className="p-3 text-center">
 <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${card.status === 'ACTIVE' ? 'bg-status-confirmed/20 text-status-confirmed' : card.status === 'REDEEMED' ? 'bg-status-info/20 text-status-info' : 'bg-crm-surface/40 text-crm-muted'}`}>
 {card.status}
 </span>
 </td>
 <td className="p-3 text-right text-crm-muted text-[11px]">{new Date(card.createdAt).toLocaleDateString()}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}

