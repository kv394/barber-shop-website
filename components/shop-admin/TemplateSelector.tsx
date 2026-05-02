'use client';

import { useState } from 'react';
import { AVAILABLE_TEMPLATES } from '@/lib/templates';

interface TemplateSelectorProps {
  currentTemplate: string;
  shopId: string;
  dynamicTemplates?: { name: string; description: string | null }[];
  initialCustomHtml?: string;
  onTemplateSelect?: (template: string) => void;
}

export function TemplateSelector({
  currentTemplate,
  shopId,
  dynamicTemplates = [],
  initialCustomHtml = '',
  onTemplateSelect
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate);
  const [customHtml, setCustomHtml] = useState<string>(initialCustomHtml);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleTemplateClick = (id: string) => {
    setSelectedTemplate(id);
    if (onTemplateSelect) {
      onTemplateSelect(id);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/shops/${shopId}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          customHtml: selectedTemplate === 'custom' ? customHtml : undefined,
        }),
        });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to update template (${response.status})`);
        return;
      }

      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while saving the template.');
    } finally {
      setIsSaving(false);
    }
  };

  const allTemplates = [
    {
      id: 'custom',
      name: 'Headless Custom Landing Page',
      description: 'Provide your own completely custom headless landing page.'
    }
  ];

  const hasChanges = selectedTemplate !== currentTemplate || 
    (selectedTemplate === 'custom' && customHtml !== initialCustomHtml);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-status-cancelled/10 border border-status-cancelled text-status-cancelled p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selectedTemplate === template.id 
                ? 'border-status-info bg-status-info/10' 
                : 'border-crm-border bg-crm-surface hover:border-slate-500'}
            `}
            onClick={() => handleTemplateClick(template.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-crm-text text-lg">{template.name}</h3>
              {selectedTemplate === template.id && (
                <div className="w-4 h-4 rounded-full bg-status-info flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-crm-surface"></div>
                </div>
              )}
            </div>
            <p className="text-crm-muted text-[13px]">{template.description}</p>
          </div>
        ))}
      </div>

      {selectedTemplate === 'custom' && (
        <div className="mt-6 space-y-6 border-2 border-crm-border rounded-xl bg-crm-surface shadow-sm p-6">
          <div>
            <label className="block font-bold text-crm-text mb-2 text-lg">Headless HTML Override</label>
            <p className="text-crm-muted text-[13px] mb-4">
              Paste your complete single-page HTML here. This will be served exactly as provided.
              You can still configure your Logo, Hero Image, and SEO details below, and the system will automatically inject them into your HTML.
            </p>            <textarea
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              rows={20}
              className="w-full bg-crm-bg border border-crm-border rounded-lg p-4 font-mono text-[13px] text-crm-text focus:outline-none focus:border-crm-primary shadow-inner"
              placeholder="<!DOCTYPE html>\n<html>\n<head>...</head>\n<body>...</body>\n</html>"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || !hasChanges}
        className={`
          w-full py-3 rounded-lg font-bold transition-colors
          ${hasChanges 
            ? 'bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30' 
            : 'bg-crm-surface text-crm-muted cursor-not-allowed'}
        `}
      >
        {isSaving ? 'Saving...' : 'Save Template Selection'}
      </button>
    </div>
  );
}