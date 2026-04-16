'use client';

import { useState } from 'react';
import { AVAILABLE_TEMPLATES } from '@/lib/templates';

interface TemplateSelectorProps {
  currentTemplate: string;
  shopId: string;
  dynamicTemplates?: { name: string; description: string | null }[];
}

export function TemplateSelector({ currentTemplate, shopId, dynamicTemplates = [] }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/shops/${shopId}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template: selectedTemplate }),
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
    ...Object.values(AVAILABLE_TEMPLATES),
    ...dynamicTemplates.map(dt => ({
      id: dt.name,
      name: `✨ ${dt.name}`,
      description: dt.description || 'Custom AI Generated Template',
    }))
  ];

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
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-crm-text text-2xl md:text-3xl">{template.name}</h3>
              {selectedTemplate === template.id && (
                <div className="w-4 h-4 rounded-full bg-status-info flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-crm-surface"></div>
                </div>
              )}
            </div>
            <p className="text-crm-muted text-base md:text-lg">{template.description}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || selectedTemplate === currentTemplate}
        className={`
          w-full py-3 rounded-lg font-bold transition-colors
          ${selectedTemplate !== currentTemplate 
            ? 'bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30' 
            : 'bg-crm-surface text-crm-muted cursor-not-allowed'}
        `}
      >
        {isSaving ? 'Saving...' : 'Save Template Selection'}
      </button>
    </div>
  );
}