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

  if (loading) return <div className="animate-pulse text-botanical-muted py-4">Loading resources…</div>;

  return (
    <div className="bg-botanical-surface border border-botanical-border shadow-sm rounded-xl p-6">
      <h3 className="font-bold text-botanical-text mb-2 text-2xl md:text-3xl">🪑 Shop Resources</h3>
      <p className="text-botanical-muted mb-6 text-base md:text-lg">
        Add physical resources like pedicure chairs, laser machines, or massage rooms. Appointments can be configured to require these resources.
      </p>

      {msg && <div className="mb-4 p-2 bg-green-900/30 border border-green-500/30 text-green-300 rounded text-sm">{msg}</div>}

      <form onSubmit={addResource} className="flex gap-3 mb-6">
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Resource Name (e.g. Chair 1, Room A)" 
          className="flex-1 bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
          required 
        />
        <select 
          value={type} 
          onChange={e => setType(e.target.value)} 
          className="w-40 bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold"
        >
          <option value="CHAIR">Chair / Station</option>
          <option value="ROOM">Room</option>
          <option value="MACHINE">Machine / Device</option>
        </select>
        <button 
          type="submit" 
          disabled={saving || !name.trim()} 
          className="px-4 py-2 bg-botanical-primary text-white rounded text-sm font-bold hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      {resources.length === 0 ? (
        <p className="text-botanical-muted text-center py-4 text-base md:text-lg">No resources added yet.</p>
      ) : (
        <div className="space-y-2">
          {resources.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-botanical-surface rounded-lg border border-botanical-border shadow-sm">
              <div className="flex flex-col">
                <span className="text-botanical-text font-medium">{r.name}</span>
                <span className="text-xs text-botanical-muted uppercase tracking-wider">{r.type}</span>
              </div>
              <button 
                onClick={() => remove(r.id)} 
                className="text-red-400 hover:text-red-300 text-sm font-medium"
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
