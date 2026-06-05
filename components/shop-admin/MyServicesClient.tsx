'use client';;
import Image from 'next/image';

import { useState, useEffect, useCallback } from 'react';

interface RenterService {
 id: string;
 name: string;
 description: string | null;
 price: number;
 duration: number;
 isActive: boolean;
}

export default function MyServicesClient({ renterId }: { renterId: string }) {
 const [services, setServices] = useState<RenterService[]>([]);
 const [loading, setLoading] = useState(true);
 const [showForm, setShowForm] = useState(false);
 const [editing, setEditing] = useState<RenterService | null>(null);
 const [saving, setSaving] = useState(false);

 const [form, setForm] = useState({ name: '', description: '', price: '', duration: '30' });

 const fetchServices = useCallback(async () => {
 setLoading(true);
 const res = await fetch(`/api/renter/${renterId}/services`);
 if (res.ok) setServices(await res.json());
 setLoading(false);
 }, [renterId]);

 useEffect(() => { fetchServices(); }, [fetchServices]);

 const openNew = () => {
 setEditing(null);
 setForm({ name: '', description: '', price: '', duration: '30' });
 setShowForm(true);
 };

 const openEdit = (s: RenterService) => {
 setEditing(s);
 setForm({ name: s.name, description: s.description || '', price: String(s.price), duration: String(s.duration) });
 setShowForm(true);
 };

 const save = async () => {
 if (!form.name || !form.price || !form.duration) return;
 setSaving(true);
 const method = editing ? 'PATCH' : 'POST';
 const body = editing
 ? { serviceId: editing.id, ...form, price: parseFloat(form.price), duration: parseInt(form.duration) }
 : { ...form, price: parseFloat(form.price), duration: parseInt(form.duration) };

 const res = await fetch(`/api/renter/${renterId}/services`, {
 method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
 });
 if (res.ok) { await fetchServices(); setShowForm(false); }
 setSaving(false);
 };

 const toggle = async (s: RenterService) => {
 await fetch(`/api/renter/${renterId}/services`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ serviceId: s.id, isActive: !s.isActive }),
 });
 fetchServices();
 };

 const remove = async (s: RenterService) => {
 if (!confirm(`Delete "${s.name}"?`)) return;
 await fetch(`/api/renter/${renterId}/services?serviceId=${s.id}`, { method: 'DELETE' });
 fetchServices();
 };

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold text-crm-text">My Services</h2>
 <p className="text-crm-muted text-[13px]">Services clients can book directly with you</p>
 </div>
 <button
 onClick={openNew}
 className="px-4 py-2 bg-crm-primary text-white rounded-xl text-[13px] font-bold hover:bg-crm-primary/90 transition-colors"
 >
 + Add Service
 </button>
 </div>

 {/* Form */}
 {showForm && (
 <div className="bg-crm-surface border border-crm-border rounded-2xl p-5 space-y-4">
 <h3 className="font-bold text-crm-text">{editing ? 'Edit Service' : 'New Service'}</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Name *</label>
 <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
 placeholder="e.g. Fade Cut"
 className="w-full bg-crm-bg border border-crm-border rounded-xl px-3 py-2.5 text-crm-text text-[13px] focus:outline-none focus:border-crm-primary"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Duration (min) *</label>
 <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
 placeholder="30"
 className="w-full bg-crm-bg border border-crm-border rounded-xl px-3 py-2.5 text-crm-text text-[13px] focus:outline-none focus:border-crm-primary"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Price *</label>
 <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
 placeholder="35.00" step="0.01"
 className="w-full bg-crm-bg border border-crm-border rounded-xl px-3 py-2.5 text-crm-text text-[13px] focus:outline-none focus:border-crm-primary"
 />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Description</label>
 <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
 placeholder="Optional description"
 className="w-full bg-crm-bg border border-crm-border rounded-xl px-3 py-2.5 text-crm-text text-[13px] focus:outline-none focus:border-crm-primary"
 />
 </div>
 </div>
 <div className="flex gap-2 justify-end">
 <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-crm-border rounded-xl text-[13px] text-crm-muted hover:text-crm-text transition-colors">Cancel</button>
 <button onClick={save} disabled={saving} className="px-4 py-2 bg-crm-primary text-white rounded-xl text-[13px] font-bold hover:bg-crm-primary/90 disabled:opacity-50">
 {saving ? 'Saving…' : 'Save'}
 </button>
 </div>
 </div>
 )}

 {/* Service List */}
 {loading ? (
 <p className="text-crm-muted text-[13px]">Loading…</p>
 ) : services.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 bg-crm-surface/50 rounded-2xl border border-dashed border-crm-border text-center">
 <span className="text-3xl mb-3">✂️</span>
 <p className="font-bold text-crm-text mb-1">No services yet</p>
 <p className="text-crm-muted text-[13px]">Add your first service so clients can book with you</p>
 </div>
 ) : (
 <div className="space-y-3">
 {services.map(s => (
 <div key={s.id} className={`bg-crm-surface border border-crm-border rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 ${!s.isActive ? 'opacity-50' : ''}`}>
 <div>
 <p className="font-bold text-crm-text">{s.name}</p>
 {s.description && <p className="text-crm-muted text-[13px]">{s.description}</p>}
 <p className="text-crm-muted text-[12px] mt-0.5">{s.duration} min</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-black text-crm-primary text-lg">${s.price.toFixed(2)}</span>
 <button onClick={() => openEdit(s)} className="text-[12px] px-2.5 py-1 border border-crm-border rounded-lg text-crm-muted hover:text-crm-text transition-colors">Edit</button>
 <button onClick={() => toggle(s)} className={`text-[12px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${s.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-crm-bg text-crm-muted border border-crm-border'}`}>
 {s.isActive ? 'Active' : 'Hidden'}
 </button>
 <button onClick={() => remove(s)} className="text-[12px] text-red-500 hover:text-red-700 transition-colors">✕</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
