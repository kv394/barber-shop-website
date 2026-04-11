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
          <label className="block text-sm text-botanical-muted uppercase tracking-wider mb-1">Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle}
            className="w-full border-2 border-b-[6px] border-botanical-border rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border-2 border-b-[6px] border-botanical-border flex-1 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 z-20">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/80"></div>
          <div className="p-5 sm:p-6">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-botanical-muted text-sm sm:text-xs uppercase tracking-widest font-semibold truncate">Total Expenses</h3>
              <span className="text-red-500 text-sm">💸</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-botanical-text break-words leading-tight">${total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {byCategory.map(c => (
            <div key={c.cat} className="bg-botanical-surface p-3 rounded-lg border-2 border-b-[6px] border-botanical-border text-center">
              <p className="text-lg">{catEmojis[c.cat]}</p>
              <p className="text-xs text-botanical-muted">{c.cat}</p>
              <p className="text-sm font-bold text-botanical-text">${c.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Expense Form */}
      <form onSubmit={handleAdd} className="bg-botanical-surface p-4 rounded-lg border-2 border-b-[6px] border-botanical-border mb-6 space-y-3">
        <h3 className="text-sm font-bold text-botanical-text mb-2">+ Add Expense</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" required style={inputStyle}
            className="border-2 border-b-[6px] border-botanical-border rounded p-2 text-sm focus:outline-none focus:border-brand-gold" />
          <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}
            className="border-2 border-b-[6px] border-botanical-border rounded p-2 text-sm focus:outline-none focus:border-brand-gold">
            {CATEGORIES.map(c => <option key={c} value={c}>{catEmojis[c]} {c}</option>)}
          </select>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" style={inputStyle}
            className="border-2 border-b-[6px] border-botanical-border rounded p-2 text-sm focus:outline-none focus:border-brand-gold" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle}
            className="border-2 border-b-[6px] border-botanical-border rounded p-2 text-sm focus:outline-none focus:border-brand-gold [&::-webkit-calendar-picker-indicator]:invert" />
        </div>
        <button type="submit" disabled={adding} className="bg-red-600 hover:bg-red-500 text-botanical-text font-bold py-2 px-6 rounded text-sm disabled:opacity-50 transition-colors">
          {adding ? 'Adding...' : 'Add Expense'}
        </button>
      </form>

      {/* Expense List */}
      {loading ? (
        <p className="text-botanical-muted text-center py-8">Loading...</p>
      ) : expenses.length === 0 ? (
        <p className="text-botanical-muted italic text-center py-8 text-sm border border-dashed border-botanical-border rounded">No expenses recorded for this month.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="bg-botanical-surface p-3 rounded-lg border-2 border-b-[6px] border-botanical-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-lg">{catEmojis[exp.category] || '📦'}</span>
                <div>
                  <p className="text-sm text-botanical-text font-medium">{exp.description || exp.category}</p>
                  <p className="text-sm text-botanical-muted">{new Date(exp.date).toLocaleDateString()} · {exp.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-400">${exp.amount.toFixed(2)}</span>
                <button onClick={() => handleDelete(exp.id)} className="text-botanical-muted hover:text-red-400 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

