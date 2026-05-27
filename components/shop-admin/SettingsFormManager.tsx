'use client';

import { useState } from 'react';

import { CustomizationForm } from '@/components/shop-admin/CustomizationForm';
import { CustomPagesForm } from '@/components/shop-admin/CustomPagesForm';

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

 <CustomizationForm
 shopId={shopId}
 customization={customization}
 isSiteAdmin={isSiteAdmin}
 currentTemplate={selectedTemplate}
 dynamicTemplates={dynamicTemplates}
 />

 {selectedTemplate !== 'custom' && (
 <CustomPagesForm
 shopId={shopId}
 customization={customization}
 />
 )}
 </>
 );
}