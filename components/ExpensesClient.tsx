'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = ['RENT', 'SUPPLIES', 'UTILITIES', 'EQUIPMENT', 'MARKETING', 'OTHER'];

export default function ExpensesClient({ shopId }: { shopId: string }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('SUPPLIES');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch(`/api/shops/${shopId}/expenses?month=${month}`);
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, [month]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;
    setAdding(true);
    const res = await fetch(`/api/shops/${shopId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, category, description, date: date || undefined }),
    });
    if (res.ok) {
      setAmount(''); setDescription(''); setDate('');
      fetchExpenses();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/shops/${shopId}/expenses?id=${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  const inputStyle: React.CSSProperties = { colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' };

  const catEmojis: Record<string, string> = { RENT: '🏠', SUPPLIES: '🧴', UTILITIES: '⚡', EQUIPMENT: '🪑', MARKETING: '📣', OTHER: '📦' };

  return (
    <div>
      {/* Month Picker + Total */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle}
            className="w-full border border-white/10 rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 p-4 rounded-xl flex-1 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Expenses</p>
          <p className="text-3xl font-black text-red-400">${total.toFixed(2)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {byCategory.map(c => (
            <div key={c.cat} className="bg-slate-900/50 p-3 rounded-lg border border-white/5 text-center">
              <p className="text-lg">{catEmojis[c.cat]}</p>
              <p className="text-xs text-gray-400">{c.cat}</p>
              <p className="text-sm font-bold text-white">${c.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Form */}
      <form onSubmit={handleAdd} className="bg-slate-900/50 p-4 rounded-lg border border-white/5 mb-6 space-y-3">
        <h3 className="text-sm font-bold text-white mb-2">+ Add Expense</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" required style={inputStyle}
            className="border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-brand-gold" />
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}
            className="border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-brand-gold">
            {CATEGORIES.map(c => <option key={c} value={c}>{catEmojis[c]} {c}</option>)}
          </select>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" style={inputStyle}
            className="border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-brand-gold" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}
            className="border border-white/10 rounded p-2 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <button type="submit" disabled={adding} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded text-sm disabled:opacity-50 transition-colors">
          {adding ? 'Adding...' : 'Add Expense'}
        </button>
      </form>

      {/* Expense List */}
      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading...</p>
      ) : expenses.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8 text-sm border border-dashed border-white/20 rounded">No expenses recorded for this month.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="bg-slate-900/70 p-3 rounded-lg border border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-lg">{catEmojis[exp.category] || '📦'}</span>
                <div>
                  <p className="text-sm text-white font-medium">{exp.description || exp.category}</p>
                  <p className="text-[10px] text-gray-500">{new Date(exp.date).toLocaleDateString()} · {exp.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-400">${exp.amount.toFixed(2)}</span>
                <button onClick={() => handleDelete(exp.id)} className="text-gray-500 hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

