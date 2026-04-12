'use client';

import { useState, useEffect } from 'react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');

  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadName, setUploadName] = useState('');

  useEffect(() => {
    fetchTemplates();
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;
    if (!uploadName.trim()) {
      alert('Please provide a name for the template.');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('templateName', uploadName.trim());
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/siteadmin/templates/generate', {
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
    <div className="p-6 text-botanical-text">
      <h1 className="text-3xl font-bold mb-6">AI Template Generator</h1>

      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Template Files</h2>
        <p className="text-sm text-botanical-muted mb-4">
          Select a single .zip file (containing HTML, CSS, images) OR multiple files. 
          The system will automatically upload images to Google Drive, extract Handlebars {"{{variables}}"}, and create the template.
        </p>
        <form onSubmit={handleUpload} className="space-y-4 flex flex-col md:flex-row md:space-y-0 md:space-x-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-botanical-muted mb-1">Template Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Vintage Barber"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)} 
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" 
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm text-botanical-muted mb-1">Select Files</label>
            <input 
              required
              type="file" 
              multiple 
              onChange={e => setUploadFiles(e.target.files)} 
              className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" 
            />
          </div>
          <button disabled={uploading || !uploadFiles || uploadFiles.length === 0 || !uploadName} type="submit" className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </form>
      </div>
      
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate New Template with Gemini</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm text-botanical-muted mb-1">Template Identifier (e.g. neon-dark)</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" />
          </div>
          <div>
            <label className="block text-sm text-botanical-muted mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" />
          </div>
          <div>
            <label className="block text-sm text-botanical-muted mb-1">Prompt for Gemini</label>
            <textarea required value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" placeholder="Describe the layout, colors, elements, styling... Handlebars syntax will be used for injection." />
          </div>
          <div>
            <label className="block text-sm text-botanical-muted mb-1">AI Model</label>
            <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text">
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
          <button disabled={generating} type="submit" className="bg-botanical-primary text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
            {generating ? 'Generating via Gemini...' : 'Generate Template'}
          </button>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4">Generated Templates</h2>
      {loading ? <p className="text-botanical-muted">Loading templates...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-botanical-surface p-4 rounded-xl border border-botanical-border shadow-sm flex flex-col">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2">
                <h3 className="text-lg font-bold text-botanical-accent">{t.name}</h3>
                <div className="flex space-x-2">
                  <a href={`/siteadmin/templates/${t.id}/preview`} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/40 transition">Preview</a>
                  <button onClick={() => setEditingTemplate(t)} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/40 transition">Edit</button>
                  <button onClick={() => handleDelete(t.id)} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/40 transition">Delete</button>
                </div>
              </div>
              <p className="text-botanical-muted text-sm mb-4 flex-grow">{t.description}</p>
              <div className="text-xs text-botanical-muted overflow-hidden h-24 relative bg-botanical-surface p-2 rounded">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none"></div>
                <pre className="whitespace-pre-wrap">{t.htmlCode}</pre>
              </div>
            </div>
          ))}
          {templates.length === 0 && <p className="text-botanical-muted">No templates generated yet.</p>}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-botanical-surface flex items-center justify-center p-4 z-50">
          <div className="bg-botanical-surface border border-botanical-border shadow-sm p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
              <h2 className="text-xl font-bold">Edit Template: {editingTemplate.name}</h2>
              <button onClick={() => setEditingTemplate(null)} className="text-botanical-muted hover:text-botanical-text">✕</button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-botanical-muted mb-1">Name</label>
                  <input required value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" />
                </div>
                <div>
                  <label className="block text-sm text-botanical-muted mb-1">Description</label>
                  <input value={editingTemplate.description || ''} onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})} className="w-full bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-botanical-muted mb-1">HTML (Handlebars)</label>
                <textarea 
                  required 
                  value={editingTemplate.htmlCode} 
                  onChange={e => setEditingTemplate({...editingTemplate, htmlCode: e.target.value})} 
                  rows={10} 
                  className="w-full font-mono text-sm bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" 
                />
              </div>

              <div>
                <label className="block text-sm text-botanical-muted mb-1">CSS (Tailwind or custom CSS)</label>
                <textarea 
                  value={editingTemplate.cssCode || ''} 
                  onChange={e => setEditingTemplate({...editingTemplate, cssCode: e.target.value})} 
                  rows={5} 
                  className="w-full font-mono text-sm bg-botanical-surface border border-botanical-border shadow-sm p-2 rounded text-botanical-text" 
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-sm text-botanical-muted hover:text-botanical-text">Cancel</button>
                <button disabled={savingEdit} type="submit" className="bg-botanical-primary text-white px-6 py-2 rounded font-semibold disabled:opacity-50 transition">
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
