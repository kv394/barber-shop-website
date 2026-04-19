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
    <div className="fixed inset-0 bg-crm-darkBase/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-crm-surface w-full max-w-md rounded-2xl border border-crm-border shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
        <h2 className="font-bold text-crm-primary mb-2 text-xl">Assign Template</h2>
        <p className="text-crm-muted mb-6 text-[13px]">Select a template for <strong>{shopName}</strong></p>

        {loading ? (
          <div className="py-4 text-center text-[13px] text-crm-muted">Loading templates...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-crm-muted mb-2 uppercase tracking-wider text-[13px]">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full bg-crm-bg border border-crm-border rounded-lg p-3 text-[13px] text-crm-text focus:ring-2 focus:ring-crm-primary focus:outline-none"
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

            <div className="flex justify-end gap-3 pt-4 border-t border-crm-border">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-crm-muted hover:bg-crm-bg hover:text-crm-text transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-crm-primary text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50"
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
