'use client';

import { useState, useEffect } from 'react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [baseTemplateId, setBaseTemplateId] = useState('');
  const [targetShopId, setTargetShopId] = useState('');

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadShopId, setUploadShopId] = useState('');

  useEffect(() => {
    fetchTemplates();
    fetchShops();
  }, []);

  const fetchTemplates = () => {
    setLoading(true);
    fetch('/api/siteadmin/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTemplates(data);
        setLoading(false);
      });
  };

  const fetchShops = () => {
    fetch('/api/siteadmin/shops')
      .then(res => res.json())
      .then(data => {
        if (data.shops && Array.isArray(data.shops)) setShops(data.shops);
      });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;
    if (!uploadName.trim()) {
      alert('Please provide a name for the template.');
      return;
    }
    if (!uploadShopId) {
      alert('Please select a target shop context.');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('templateName', uploadName.trim());
    formData.append('targetShopId', uploadShopId);
    for (let i = 0; i < uploadFiles.length; i++) {
      formData.append('files', uploadFiles[i]);
    }
    
    try {
      const res = await fetch('/api/siteadmin/templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      alert('Template uploaded successfully!');
      if (data.template) {
        setTemplates([data.template, ...templates] as any);
      }
      setUploadFiles(null);
      setUploadName('');
      setUploadShopId('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const [generateFiles, setGenerateFiles] = useState<FileList | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShopId) {
      alert('Please select a target shop context to organize assets.');
      return;
    }
    setGenerating(true);
    
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    formData.append('prompt', prompt.trim());
    formData.append('model', model);
    formData.append('baseTemplateId', baseTemplateId);
    formData.append('targetShopId', targetShopId);
    
    if (generateFiles) {
      for (let i = 0; i < generateFiles.length; i++) {
        formData.append('files', generateFiles[i]);
      }
    }

    try {
      const res = await fetch('/api/siteadmin/templates/generate', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTemplates([data, ...templates] as any);
      setName('');
      setDescription('');
      setPrompt('');
      setBaseTemplateId('');
      setTargetShopId('');
      setGenerateFiles(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch(`/api/siteadmin/templates/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`/api/siteadmin/templates/${editingTemplate.id}`, {
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

  return (
    <div className="p-6 text-crm-text">
      <h1 className="font-bold mb-6 text-2xl font-bold">AI Template Generator</h1>

      <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm mb-8">
        <h2 className="font-semibold mb-4 text-xl font-bold">Upload Template Files</h2>
        <p className="text-crm-muted mb-4 text-[13px]">
          Select a single .zip file (containing HTML, CSS, images) OR multiple files. 
          The system will automatically upload images to Google Drive, extract Handlebars {"{{variables}}"}, and create the template.
        </p>
        <form onSubmit={handleUpload} className="space-y-4 flex flex-col md:flex-row md:space-y-0 md:space-x-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-crm-muted mb-1 text-[13px]">Template Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Vintage Barber"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)} 
              className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-crm-muted mb-1 text-[13px]">Target Shop (Required)</label>
            <select value={uploadShopId} onChange={e => setUploadShopId(e.target.value)} required className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text">
              <option value="">Select Shop</option>
              {shops.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-crm-muted mb-1 text-[13px]">Select Files</label>
            <input 
              required
              type="file" 
              multiple 
              onChange={e => setUploadFiles(e.target.files)} 
              className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" 
            />
          </div>
          <button disabled={uploading || !uploadFiles || uploadFiles.length === 0 || !uploadName || !uploadShopId} type="submit" className="w-full md:w-auto bg-status-confirmed text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </form>
      </div>
      
      <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm mb-8">
        <h2 className="font-semibold mb-4 text-xl font-bold">Generate New Template with AI</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Target Shop (Required)</label>
            <select value={targetShopId} onChange={e => setTargetShopId(e.target.value)} required className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text">
              <option value="">Select Target Shop</option>
              {shops.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Base Template (Optional)</label>
            <select value={baseTemplateId} onChange={e => setBaseTemplateId(e.target.value)} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text">
              <option value="">None (Generate from scratch)</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Template Identifier (e.g. neon-dark)</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Prompt for Gemini</label>
            <textarea required value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" placeholder="Describe the layout, colors, elements, styling... Handlebars syntax will be used for injection." />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">AI Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Free Tier)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <optgroup label="Groq (Ultra-Fast)">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Best for Coding)</option>
                <option value="openai/gpt-oss-120b">GPT-OSS 120B (Max Creativity)</option>
                <option value="qwen/qwen3-32b">Qwen 3 32B (Fast Frontend)</option>
                <option value="gemma-2-27b-it">Gemma 2 27B</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-crm-muted mb-1 text-[13px]">Optional Assets (Images, Logos)</label>
            <input 
              type="file" 
              multiple 
              onChange={e => setGenerateFiles(e.target.files)} 
              className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" 
            />
            <p className="text-crm-muted mt-1 text-[13px]">These will be uploaded to Google Drive and their URLs passed to the AI.</p>
          </div>
          <button disabled={generating || !targetShopId} type="submit" className="bg-crm-primary text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition hover:opacity-90">
            {generating ? 'Generating via Gemini...' : 'Generate Template'}
          </button>
        </form>
      </div>

      <h2 className="font-bold mb-4 text-xl font-bold">Generated Templates</h2>
      {loading ? <p className="text-crm-muted text-[13px]">Loading templates...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm flex flex-col">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2">
                <div>
                  <h3 className="font-bold text-crm-accent text-lg font-bold">{t.name}</h3>
                  {t.shop && <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">For: {t.shop.name}</span>}
                </div>
                <div className="flex space-x-2">
                  <a href={`/siteadmin/templates/${t.id}/preview`} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-status-confirmed/20 text-status-confirmed px-2 py-1 rounded hover:bg-status-confirmed/40 transition">Preview</a>
                  <button onClick={() => setEditingTemplate(t)} className="text-[11px] bg-status-info/20 text-status-info px-2 py-1 rounded hover:bg-status-info/40 transition">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-[11px] bg-status-cancelled/20 text-status-cancelled px-2 py-1 rounded hover:bg-status-cancelled/40 transition">Delete</button>
                </div>
              </div>
              <p className="text-crm-muted mb-4 flex-grow text-[13px]">{t.description}</p>
              <div className="text-[11px] text-crm-muted overflow-hidden h-24 relative bg-crm-surface p-2 rounded">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none"></div>
                <pre className="whitespace-pre-wrap">{t.htmlCode}</pre>
              </div>
            </div>
          ))}
          {templates.length === 0 && <p className="text-crm-muted text-[13px]">No templates generated yet.</p>}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-crm-surface flex items-center justify-center p-4 z-50">
          <div className="bg-crm-surface border border-crm-border shadow-sm p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
              <h2 className="font-bold text-xl text-crm-primary">Edit Template: {editingTemplate.name}</h2>
              <button onClick={() => setEditingTemplate(null)} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-crm-muted mb-1 text-[13px]">Name</label>
                  <input required value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" />
                </div>
                <div>
                  <label className="block text-crm-muted mb-1 text-[13px]">Description</label>
                  <input value={editingTemplate.description || ''} onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})} className="w-full bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" />
                </div>
              </div>
              
              <div>
                <label className="block text-crm-muted mb-1 text-[13px]">HTML (Handlebars)</label>
                <textarea 
                  required 
                  value={editingTemplate.htmlCode} 
                  onChange={e => setEditingTemplate({...editingTemplate, htmlCode: e.target.value})} 
                  rows={10} 
                  className="w-full font-mono text-[13px] bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" 
                />
              </div>

              <div>
                <label className="block text-crm-muted mb-1 text-[13px]">CSS (Tailwind or custom CSS)</label>
                <textarea 
                  value={editingTemplate.cssCode || ''} 
                  onChange={e => setEditingTemplate({...editingTemplate, cssCode: e.target.value})} 
                  rows={5} 
                  className="w-full font-mono text-[13px] bg-crm-surface border border-crm-border shadow-sm p-2 rounded text-crm-text" 
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-[13px] text-crm-muted hover:text-crm-text">Cancel</button>
                <button disabled={savingEdit} type="submit" className="bg-crm-primary text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition hover:opacity-90">
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
