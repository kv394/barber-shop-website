'use client';

import { useState, useEffect } from 'react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    fetch('/api/superadmin/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
        setLoading(false);
      });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/superadmin/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, prompt }),
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

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">AI Template Generator</h1>
      
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
          <button disabled={generating} type="submit" className="bg-brand-gold hover:bg-yellow-500 text-black px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
            {generating ? 'Generating via Gemini...' : 'Generate Template'}
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4">Generated Templates</h2>
      {loading ? <p className="text-gray-400">Loading templates...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-slate-800 p-4 rounded-xl border border-white/10">
              <h3 className="text-lg font-bold text-brand-gold">{t.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{t.description}</p>
              <div className="text-xs text-gray-500 overflow-hidden h-24 relative bg-slate-900 p-2 rounded">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none"></div>
                <pre className="whitespace-pre-wrap">{t.htmlCode}</pre>
              </div>
            </div>
          ))}
          {templates.length === 0 && <p className="text-gray-400">No templates generated yet.</p>}
        </div>
      )}
    </div>
  );
}
