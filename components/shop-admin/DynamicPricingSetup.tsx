'use client';;
import Image from 'next/image';

import { useEffect, useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DynamicPricingSetup({ shopId }: { shopId: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'SURGE',
    adjustmentType: 'PERCENTAGE',
    adjustmentValue: 10,
    daysOfWeek: [0, 6],
    startTime: '',
    endTime: ''
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/dynamic-pricing`);
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [shopId]);

  const toggleDay = (dayIndex: number) => {
    setForm(prev => {
      const exists = prev.daysOfWeek.includes(dayIndex);
      if (exists) {
        return { ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== dayIndex) };
      } else {
        return { ...prev, daysOfWeek: [...prev.daysOfWeek, dayIndex].sort() };
      }
    });
  };

  const handleCreate = async () => {
    if (!form.name) return alert('Name is required');
    try {
      const res = await fetch(`/api/shops/${shopId}/dynamic-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Rule created successfully!');
        setForm({ name: '', type: 'SURGE', adjustmentType: 'PERCENTAGE', adjustmentValue: 10, daysOfWeek: [0, 6], startTime: '', endTime: '' });
        fetchRules();
        setTimeout(() => setMsg(''), 3000);
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (e: any) {
      alert('Error creating rule');
    }
  };

  const toggleActive = async (ruleId: string, currentActive: boolean) => {
    try {
      await fetch(`/api/shops/${shopId}/dynamic-pricing/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchRules();
    } catch (e) {
      alert('Error updating rule');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await fetch(`/api/shops/${shopId}/dynamic-pricing/${ruleId}`, { method: 'DELETE' });
      fetchRules();
    } catch (e) {
      alert('Error deleting rule');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-crm-text mb-2">Create New Pricing Rule</h3>
        <p className="text-crm-muted text-[13px] mb-4">Set up surge pricing for busy times or discounts for off-peak hours.</p>
        
        {msg && <div className="mb-4 p-2 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded text-[13px]">{msg}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="block text-[13px] text-crm-muted mb-1">Rule Name</p>
            <input 
              type="text" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo"
              placeholder="e.g. Weekend Surge"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[13px] text-crm-muted mb-1">Type</label>
              <select 
                value={form.type} 
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo"
              >
                <option value="SURGE">Surge (Increase)</option>
                <option value="DISCOUNT">Discount (Decrease)</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-crm-muted mb-1">Amount Type</label>
              <select 
                value={form.adjustmentType} 
                onChange={e => setForm({...form, adjustmentType: e.target.value})}
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-crm-muted mb-1">Value</label>
            <input 
              type="number" 
              min={0}
              value={form.adjustmentValue} 
              onChange={e => setForm({...form, adjustmentValue: parseFloat(e.target.value) || 0})} 
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo"
            />
          </div>
          
          <div>
            <label className="block text-[13px] text-crm-muted mb-1">Time Range (Optional)</label>
            <div className="flex items-center gap-2">
              <input 
                type="time" 
                value={form.startTime} 
                onChange={e => setForm({...form, startTime: e.target.value})} 
                className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo"
              />
              <span className="text-crm-muted">to</span>
              <input 
                type="time" 
                value={form.endTime} 
                onChange={e => setForm({...form, endTime: e.target.value})} 
                className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[13px] text-crm-muted mb-2">Days of Week</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => toggleDay(idx)}
                className={`px-3 py-1.5 rounded-full text-[13px] border ${
                  form.daysOfWeek.includes(idx) 
                    ? 'bg-brand-indigo text-white border-brand-indigo' 
                    : 'bg-crm-surface text-crm-muted border-crm-border hover:border-brand-indigo'
                } transition-colors`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleCreate}
          className="px-4 py-2 bg-crm-primary text-white rounded text-[13px] font-medium hover:opacity-90 transition"
        >
          Create Rule
        </button>
      </div>

      <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-crm-text mb-4">Active Rules</h3>
        {loading ? (
          <div className="animate-pulse text-crm-muted py-4">Loading rules…</div>
        ) : rules.length === 0 ? (
          <p className="text-crm-muted text-[13px]">No pricing rules configured yet.</p>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-crm-border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-crm-text text-[14px]">{rule.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      rule.type === 'SURGE' ? 'bg-status-danger/10 text-status-danger' : 'bg-status-confirmed/10 text-status-confirmed'
                    }`}>
                      {rule.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      rule.isActive ? 'bg-status-confirmed/10 text-status-confirmed' : 'bg-crm-muted/20 text-crm-muted'
                    }`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-[13px] text-crm-muted">
                    {rule.adjustmentType === 'PERCENTAGE' ? `${rule.adjustmentValue}%` : `$${rule.adjustmentValue}`} • 
                    {rule.daysOfWeek && rule.daysOfWeek !== '[]' ? (() => {
                      try {
                        const days = JSON.parse(rule.daysOfWeek);
                        return ` Days: ${days.map((d: number) => DAYS[d]).join(', ')}`;
                      } catch(e) { return ' All Days'; }
                    })() : ' All Days'}
                    {(rule.startTime || rule.endTime) && ` • ${rule.startTime || 'Start'} - ${rule.endTime || 'End'}`}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleActive(rule.id, rule.isActive)}
                    className="px-3 py-1.5 border border-crm-border text-crm-text rounded text-[13px] hover:bg-crm-border/50 transition"
                  >
                    {rule.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    onClick={() => handleDelete(rule.id)}
                    className="px-3 py-1.5 border border-status-danger/30 text-status-danger rounded text-[13px] hover:bg-status-danger/10 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
