'use client';

import { useState, useEffect } from 'react';

type Template = {
  id: string;
  name: string;
};

export default function AssignTemplateModal({
  shopId,
  shopName,
  currentTemplate,
  onClose,
  onSuccess
}: {
  shopId: string;
  shopName: string;
  currentTemplate: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/siteadmin/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/siteadmin/shops/${shopId}/template`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplate }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert('Failed to assign template: ' + err.error);
      }
    } catch (error) {
      alert('Error assigning template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-botanical-surface w-full max-w-md rounded-2xl border border-botanical-border shadow-2xl p-6">
        <h2 className="text-xl font-bold text-botanical-text mb-2">Assign Template</h2>
        <p className="text-sm text-botanical-muted mb-6">Select a template for <strong>{shopName}</strong></p>

        {loading ? (
          <div className="py-4 text-center text-sm text-botanical-muted">Loading templates...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-botanical-muted mb-2 uppercase tracking-wider">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-botanical-bg border border-botanical-border rounded-lg p-3 text-sm text-botanical-text focus:ring-2 focus:ring-botanical-primary focus:outline-none"
              >
                <option value="modern">Modern (Default Built-in)</option>
                <option value="classic">Classic (Built-in)</option>
                <option value="elegant">Elegant (Built-in)</option>
                {templates.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name} (Dynamic AI)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-botanical-border">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-botanical-muted hover:bg-botanical-bg hover:text-botanical-text transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-botanical-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Assign Template'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
