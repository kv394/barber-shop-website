'use client';

import { useState, useEffect } from 'react';

export default function TemplatesClientPage({ shopId, isSuperAdmin }: { shopId: string, isSuperAdmin: boolean }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [shopId]);

  const handleApply = async (t: any) => {
    setApplying(t.id);
    try {
      const res = await fetch(`/api/shops/${shopId}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: t.name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert('Template applied successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApplying(null);
    }
  };

  const fetchTemplates = () => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/templates`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
        setLoading(false);
      });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, prompt, model }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTemplates([data, ...templates] as any);
      setName('');
      setDescription('');
      setPrompt('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, templateShopId: string | null) => {
    if (!isSuperAdmin && templateShopId !== shopId) {
      alert("You can only delete templates created by your shop.");
      return;
    }
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTemplates(templates.map(t => t.id === editingTemplate.id ? data : t));
      setEditingTemplate(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditClick = (t: any) => {
    if (!isSuperAdmin && t.shopId !== shopId) {
      alert("You can only edit templates created by your shop.");
      return;
    }
    setEditingTemplate(t);
  };

  return (
    <div className="text-white">
      <div className="bg-slate-800 p-6 rounded-xl border border-white/10 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate New Template with Gemini</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Template Identifier (e.g. neon-dark)</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Prompt for Gemini</label>
            <textarea required value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" placeholder="Describe the layout, colors, elements, styling... Handlebars syntax will be used for injection." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">AI Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Reliable)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced & High Quality)</option>
            </select>
          </div>
          <button disabled={generating} type="submit" className="bg-brand-gold hover:bg-yellow-500 text-black px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
            {generating ? 'Generating via Gemini...' : 'Generate Template'}
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4">Available Templates</h2>
      {loading ? <p className="text-gray-400">Loading templates...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => {
            const isOwner = isSuperAdmin || t.shopId === shopId;
            return (
              <div key={t.id} className="bg-slate-800 p-4 rounded-xl border border-white/10 flex flex-col relative overflow-hidden">
                {!t.shopId && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">GLOBAL</div>
                )}
                {t.shopId === shopId && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">YOURS</div>
                )}

                <div className="flex justify-between items-start mb-2 mt-2">
                  <h3 className="text-lg font-bold text-brand-gold">{t.name}</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4 flex-grow">{t.description}</p>
                <div className="text-xs text-gray-500 overflow-hidden h-24 relative bg-slate-900 p-2 rounded mb-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none"></div>
                  <pre className="whitespace-pre-wrap">{t.htmlCode}</pre>
                </div>
                
                <div className="flex space-x-2 pt-2 border-t border-slate-700">
                  <a href={`/superadmin/templates/${t.id}/preview`} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-500/20 text-gray-300 px-3 py-1.5 rounded hover:bg-gray-500/40 transition text-center flex-1">Preview</a>
                  <button onClick={() => handleApply(t)} disabled={applying === t.id} className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded hover:bg-green-500/40 transition flex-1 disabled:opacity-50">{applying === t.id ? 'Applying...' : 'Apply'}</button>
                  {isOwner && (
                    <>
                      <button onClick={() => handleEditClick(t)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-500/40 transition flex-1">Edit</button>
                      <button onClick={() => handleDelete(t.id, t.shopId)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded hover:bg-red-500/40 transition flex-1">Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {templates.length === 0 && <p className="text-gray-400">No templates generated yet.</p>}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-white/10 p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Template: {editingTemplate.name}</h2>
              <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input required value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input value={editingTemplate.description || ''} onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-white" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">HTML (Handlebars)</label>
                <textarea 
                  required 
                  value={editingTemplate.htmlCode} 
                  onChange={e => setEditingTemplate({...editingTemplate, htmlCode: e.target.value})} 
                  rows={10} 
                  className="w-full font-mono text-sm bg-slate-900 border border-slate-700 p-2 rounded text-white" 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">CSS (Tailwind or custom CSS)</label>
                <textarea 
                  value={editingTemplate.cssCode || ''} 
                  onChange={e => setEditingTemplate({...editingTemplate, cssCode: e.target.value})} 
                  rows={5} 
                  className="w-full font-mono text-sm bg-slate-900 border border-slate-700 p-2 rounded text-white" 
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
                <button disabled={savingEdit} type="submit" className="bg-brand-gold hover:bg-yellow-500 text-black px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
