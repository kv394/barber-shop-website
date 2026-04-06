'use client';

import { useState } from 'react';
import { AVAILABLE_TEMPLATES, TemplateType } from '@/lib/templates';

interface TemplateSelectorProps {
  currentTemplate: TemplateType;
  shopId: string;
}

export function TemplateSelector({ currentTemplate, shopId }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(currentTemplate);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(AVAILABLE_TEMPLATES).map((template) => (
          <div
            key={template.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selectedTemplate === template.id 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}
            `}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white">{template.name}</h3>
              {selectedTemplate === template.id && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400">{template.description}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || selectedTemplate === currentTemplate}
        className={`
          w-full py-3 rounded-lg font-bold transition-colors
          ${selectedTemplate !== currentTemplate 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
        `}
      >
        {isSaving ? 'Saving...' : 'Save Template Selection'}
      </button>
    </div>
  );
}