'use client';
import { useEffect, useState } from 'react';

export default function FormBuilder({ shopId }: { shopId: string }) {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => fetch(`/api/shops/${shopId}/forms`).then(r => r.json())
    .then(d => setForms(Array.isArray(d) ? d : [])).finally(() => setLoading(false));

  useEffect(() => { load(); }, [shopId]);

  const addForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    await fetch(`/api/shops/${shopId}/forms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content, isRequired }),
    });
    setName('');
    setContent('');
    setIsRequired(false);
    setMsg('Form added!');
    await load();
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this form?')) return;
    await fetch(`/api/shops/${shopId}/forms/${id}`, { method: 'DELETE' });
    setForms(prev => prev.filter(f => f.id !== id));
  };

  if (loading) return <div className="animate-pulse text-botanical-muted py-4">Loading forms…</div>;

  return (
    <div className="bg-botanical-surface border border-white/5 rounded-xl p-6">
      <h3 className="text-lg font-bold text-botanical-text mb-2">📝 Digital Intake Forms</h3>
      <p className="text-sm text-botanical-muted mb-6">
        Create waivers, consultation forms, and medical histories. Clients will be prompted to sign these before their appointment.
      </p>

      {msg && <div className="mb-4 p-2 bg-green-900/30 border border-green-500/30 text-green-300 rounded text-sm">{msg}</div>}

      <form onSubmit={addForm} className="mb-8 space-y-4">
        <div>
          <label className="block text-xs text-botanical-muted mb-1">Form Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Laser Hair Removal Waiver" 
            className="w-full bg-black/40 border border-botanical-border rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs text-botanical-muted mb-1">Form Content / Questions</label>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Enter your form terms, or list questions separated by newlines." 
            rows={4}
            className="w-full bg-black/40 border border-botanical-border rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
            required 
          />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="isRequired" 
            checked={isRequired} 
            onChange={e => setIsRequired(e.target.checked)} 
            className="accent-brand-gold w-4 h-4"
          />
          <label htmlFor="isRequired" className="text-sm text-botanical-text">Require digital signature before appointment</label>
        </div>
        <button 
          type="submit" 
          disabled={saving || !name.trim() || !content.trim()} 
          className="px-4 py-2 bg-botanical-primary text-white rounded text-sm font-bold hover:bg-white transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Form'}
        </button>
      </form>

      <h4 className="text-botanical-text font-medium mb-3">Existing Forms</h4>
      {forms.length === 0 ? (
        <p className="text-botanical-muted text-sm py-2">No forms created yet.</p>
      ) : (
        <div className="space-y-3">
          {forms.map(f => (
            <div key={f.id} className="p-4 bg-black/20 rounded-lg border border-white/5 flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-botanical-text font-medium text-sm">{f.name}</h5>
                  {f.isRequired && <span className="text-[10px] uppercase font-bold tracking-wider bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">Required</span>}
                </div>
                <p className="text-xs text-botanical-muted line-clamp-2">{f.content}</p>
              </div>
              <button 
                onClick={() => remove(f.id)} 
                className="text-red-400 hover:text-red-300 text-xs font-medium shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
