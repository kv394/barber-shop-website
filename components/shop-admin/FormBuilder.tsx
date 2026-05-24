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

  if (loading) return <div className="animate-pulse text-crm-muted py-4">Loading forms…</div>;

  return (
    <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6">
      <p className="text-crm-muted mb-6 text-[13px]">
        Create waivers, consultation forms, and medical histories. Clients will be prompted to sign these before their appointment.
      </p>

      {msg && <div className="mb-4 p-2 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded text-[13px]">{msg}</div>}

      <form onSubmit={addForm} className="mb-8 space-y-4">
        <div>
          <label className="block text-crm-muted mb-1 text-[13px]">Form Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Laser Hair Removal Waiver" 
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" 
            required 
          />
        </div>
        <div>
          <label className="block text-crm-muted mb-1 text-[13px]">Form Content / Questions</label>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Enter your form terms, or list questions separated by newlines." 
            rows={4}
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold" 
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
          <label htmlFor="isRequired" className="text-crm-text text-[13px]">Require digital signature before appointment</label>
        </div>
        <button 
          type="submit" 
          disabled={saving || !name.trim() || !content.trim()} 
          className="px-4 py-2 bg-crm-primary text-white rounded text-[13px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create Form'}
        </button>
      </form>

      <h4 className="text-crm-text font-medium mb-3 text-base font-semibold">Existing Forms</h4>
      {forms.length === 0 ? (
        <p className="text-crm-muted py-2 text-[13px]">No forms created yet.</p>
      ) : (
        <div className="space-y-3">
          {forms.map(f => (
            <div key={f.id} className="p-4 bg-crm-surface rounded-lg border border-crm-border shadow-sm flex flex-wrap justify-between gap-x-2 gap-y-2 items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-crm-text font-medium text-[13px]">{f.name}</h5>
                  {f.isRequired && <span className="text-[13px] uppercase font-bold tracking-wider bg-status-cancelled/20 text-status-cancelled px-1.5 py-0.5 rounded">Required</span>}
                </div>
                <p className="text-crm-muted line-clamp-2 text-[13px]">{f.content}</p>
              </div>
              <button 
                onClick={() => remove(f.id)} 
                className="text-status-cancelled hover:text-status-cancelled text-[11px] font-medium shrink-0"
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
