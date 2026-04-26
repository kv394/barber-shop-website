'use client';

import { useState } from 'react';
import { TemplateSelector } from '@/components/shop-admin/TemplateSelector';
import { CustomizationForm } from '@/components/shop-admin/CustomizationForm';
import { CustomPagesForm } from '@/components/shop-admin/CustomPagesForm';
import WidgetEmbedCode from '@/components/shop-admin/WidgetEmbedCode';

interface SettingsFormManagerProps {
  shopId: string;
  customization: any;
  isSiteAdmin: boolean;
  currentTemplate: string;
  dynamicTemplates: any[];
}

export function SettingsFormManager({ 
  shopId, 
  customization, 
  isSiteAdmin, 
  currentTemplate, 
  dynamicTemplates 
}: SettingsFormManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(currentTemplate);

  return (
    <>
      <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm mb-6">
        <h2 className="font-bold text-crm-text mb-2 text-xl font-bold">Booking Portal Template</h2>
        <p className="text-crm-muted mb-6 text-[13px]">Choose the layout and style for your public booking portal.</p>
        <TemplateSelector
          currentTemplate={selectedTemplate}
          shopId={shopId}
          dynamicTemplates={dynamicTemplates}
          initialCustomHtml={customization?.customHtml || ''}
          onTemplateSelect={setSelectedTemplate}
        />
      </div>

      {selectedTemplate !== 'custom' && (
        <>
          <CustomizationForm
            shopId={shopId}
            customization={customization}
            isSiteAdmin={isSiteAdmin}
            currentTemplate={selectedTemplate}
            dynamicTemplates={dynamicTemplates}
          />

          <CustomPagesForm
            shopId={shopId}
            customization={customization}
          />
        </>
      )}

      <WidgetEmbedCode shopId={shopId} />
    </>
  );
}