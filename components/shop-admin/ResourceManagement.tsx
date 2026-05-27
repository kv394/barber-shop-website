'use client';
import { useEffect, useState } from 'react';

export default function ResourceManagement({ shopId }: { shopId: string }) {
 const [resources, setResources] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [name, setName] = useState('');
 const [type, setType] = useState('CHAIR');
 const [saving, setSaving] = useState(false);
 const [msg, setMsg] = useState('');

 const load = () => fetch(`/api/shops/${shopId}/resources`).then(r => r.json())
 .then(d => setResources(Array.isArray(d) ? d : [])).finally(() => setLoading(false));

 useEffect(() => { load(); }, [shopId]);

 const addResource = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) return;
 setSaving(true);
 await fetch(`/api/shops/${shopId}/resources`, {
 method: 'POST', headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, type }),
 });
 setName('');
 setMsg('Resource added!');
 await load();
 setSaving(false);
 setTimeout(() => setMsg(''), 3000);
 };

 const remove = async (id: string) => {
 if (!confirm('Delete this resource?')) return;
 await fetch(`/api/shops/${shopId}/resources/${id}`, { method: 'DELETE' });
 setResources(prev => prev.filter(r => r.id !== id));
 };

 if (loading) return <div className="animate-pulse text-crm-muted py-4">Loading resources…</div>;

 return (
 <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6">
 <p className="text-crm-muted mb-6 text-[13px]">
 Add physical resources like pedicure chairs, laser machines, or massage rooms. Appointments can be configured to require these resources.
 </p>

 {msg && <div className="mb-4 p-2 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded text-[13px]">{msg}</div>}

 <form onSubmit={addResource} className="flex gap-3 mb-6">
 <input 
 type="text" 
 value={name} 
 onChange={e => setName(e.target.value)} 
 placeholder="Resource Name (e.g. Chair 1, Room A)" 
 className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" 
 required 
 />
 <select 
 value={type} 
 onChange={e => setType(e.target.value)} 
 className="w-40 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold"
 >
 <option value="CHAIR">Chair / Station</option>
 <option value="ROOM">Room</option>
 <option value="MACHINE">Machine / Device</option>
 </select>
 <button 
 type="submit" 
 disabled={saving || !name.trim()} 
 className="px-4 py-2 bg-crm-primary text-white rounded text-[13px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50"
 >
 {saving ? 'Adding...' : 'Add'}
 </button>
 </form>

 {resources.length === 0 ? (
 <p className="text-crm-muted text-center py-4 text-[13px]">No resources added yet.</p>
 ) : (
 <div className="space-y-2">
 {resources.map(r => (
 <div key={r.id} className="flex items-center justify-between p-3 bg-crm-surface rounded-lg border border-crm-border shadow-sm">
 <div className="flex flex-col">
 <span className="text-crm-text font-medium">{r.name}</span>
 <span className="text-[11px] text-crm-muted uppercase tracking-wider">{r.type}</span>
 </div>
 <button 
 onClick={() => remove(r.id)} 
 className="text-status-cancelled hover:text-status-cancelled text-[13px] font-medium"
 >
 Remove
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
