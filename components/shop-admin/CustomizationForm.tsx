'use client';

import { useState } from 'react';
import { DEFAULT_CUSTOMIZATION, Customization } from '@/lib/templates';
import { useRouter } from 'next/navigation';
import { EditorialCustomizationForm } from './EditorialCustomizationForm';
import MediaPicker from './MediaPicker';

interface CustomizationFormProps {
 shopId: string;
 customization: any;
 onSave?: (customization: Customization) => void;
 isSiteAdmin: boolean;
 currentTemplate?: string;
 dynamicTemplates?: any[];
}

export function CustomizationForm({
 shopId,
 customization,
 onSave,
 isSiteAdmin,
 currentTemplate,
 dynamicTemplates = [],
}: CustomizationFormProps) {
 const [formData, setFormData] = useState(customization || DEFAULT_CUSTOMIZATION);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const router = useRouter();

 const activeDynamicTemplate = dynamicTemplates.find(dt => dt.name === currentTemplate);
 const activeVariables: string[] = activeDynamicTemplate?.variables || [];

 const handleInputChange = (field: string, value: any) => {
 setFormData({
 ...formData,
 [field]: value,
 });
 setSuccess(false);
 };

 const handleSave = async () => {
 setIsLoading(true);
 setError(null);

 try {
 const response = await fetch(`/api/shops/${shopId}/customization`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ customization: formData }),
 });

 if (!response.ok) {
 const errorData = await response.json().catch(() => ({}));
 throw new Error(errorData.error || `Failed to save customization (${response.status})`);
 }

 setSuccess(true);
 onSave?.(formData);
 router.refresh();
 setTimeout(() => setSuccess(false), 3000);
 } catch (err: any) {
 const message = err.message || 'An unexpected error occurred';
 console.error(err);
 setError(message);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="w-full">
 <h2 className="font-bold text-crm-text mb-4 sm:mb-6 text-xl font-bold">
 {isSiteAdmin ? "Customize Your Shop Appearance" : "Update Contact Information"}
 </h2>

 {error && (
 <div className="bg-status-cancelled/10 border border-status-cancelled text-status-cancelled p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-[13px]">
 {error}
 </div>
 )}

 {success && (
 <div className="bg-status-confirmed/10 border border-status-confirmed text-status-confirmed p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-[13px]">
 Information saved successfully!
 </div>
 )}

 <div className="space-y-6 bg-crm-surface p-4 sm:p-6 md:p-8 rounded-lg border border-crm-border shadow-sm">
 
 <div>
 <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Brand Look & Feel</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Shop Logo</label>
 <MediaPicker
 shopId={shopId}
 currentUrl={formData.logoUrl || ''}
 onSelect={(url) => handleInputChange('logoUrl', url)}
 label="Upload Logo"
 />
 </div>
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Hero / Header Image</label>
 <MediaPicker
 shopId={shopId}
 currentUrl={formData.heroImageUrl || ''}
 onSelect={(url) => handleInputChange('heroImageUrl', url)}
 label="Upload Hero Image"
 />
 </div>
 </div>
 </div>

 <div>
 <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Announcement Banner</h3>
 <div className="space-y-4 mb-6">
 <div className="flex items-center space-x-3">
 <input
 type="checkbox"
 id="announcementActive"
 checked={formData.announcement?.isActive || false}
 onChange={(e) => handleInputChange('announcement', { ...formData.announcement, isActive: e.target.checked })}
 className="w-4 h-4 accent-blue-600 bg-crm-bg border-crm-border rounded cursor-pointer"
 />
 <label htmlFor="announcementActive" className="text-crm-muted text-[13px] cursor-pointer">Enable Announcement Banner</label>
 </div>
 {formData.announcement?.isActive && (
 <div className="grid grid-cols-1 gap-4">
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Announcement Text</label>
 <input
 type="text"
 value={formData.announcement?.text || ''}
 onChange={(e) => handleInputChange('announcement', { ...formData.announcement, text: e.target.value })}
 placeholder="E.g., 20% off all haircuts this week!"
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 </div>
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Link URL (Optional)</label>
 <input
 type="url"
 value={formData.announcement?.url || ''}
 onChange={(e) => handleInputChange('announcement', { ...formData.announcement, url: e.target.value })}
 placeholder="https://..."
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 </div>
 </div>
 )}
 </div>
 </div>

 <div>
 <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">SEO, Social Sharing & Landing Page SDK</h3>
 <div className="space-y-4 mb-6">
 <div className="bg-crm-bg/50 p-4 border border-crm-border rounded-lg mb-4">
 <label className="block font-medium text-crm-text mb-2 text-[13px]">Custom Landing Page / SDK Allowed Domains (CORS)</label>
 <p className="text-crm-muted text-[11px] mb-3">If you embed Kutz onto your own completely custom landing page or website using the developer SDK, list your domains here (comma-separated, e.g., <code className="bg-crm-surface border border-crm-border px-1 rounded text-crm-text">my-salon.com, www.my-salon.com</code>) to authorize widget access.</p>
 <input
 type="text"
 value={(formData.allowedDomains || []).join(', ')}
 onChange={(e) => {
 const domains = e.target.value.split(',').map(d => d.trim()).filter(Boolean);
 handleInputChange('allowedDomains', domains);
 }}
 placeholder="e.g. my-barbershop.com, www.my-barbershop.com"
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary/50"
 />
 </div>
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">SEO Title</label>
 <input
 type="text"
 value={formData.seo?.title || ''}
 onChange={(e) => handleInputChange('seo', { ...formData.seo, title: e.target.value })}
 placeholder="E.g., The Best Barbershop in NYC"
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 </div>
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">SEO Description</label>
 <textarea
 rows={2}
 value={formData.seo?.description || ''}
 onChange={(e) => handleInputChange('seo', { ...formData.seo, description: e.target.value })}
 placeholder="Brief description for search engines..."
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 </div>
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">OpenGraph Image URL</label>
 <input
 type="url"
 value={formData.seo?.ogImageUrl || ''}
 onChange={(e) => handleInputChange('seo', { ...formData.seo, ogImageUrl: e.target.value })}
 placeholder="https://..."
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 </div>
 </div>
 </div>

 {currentTemplate === 'editorial' && (
 <EditorialCustomizationForm customization={formData} onUpdate={handleInputChange} shopId={shopId} />
 )}

 <div>
 <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Browser Icon</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Favicon URL</label>
 <div className="flex gap-2 items-center">
 <input type="url" value={formData.faviconUrl || ''} onChange={(e) => handleInputChange('faviconUrl', e.target.value)} placeholder="https://example.com/favicon.ico" className="flex-1 w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500" />
 <MediaPicker shopId={shopId} currentUrl={formData.faviconUrl} onSelect={(url) => handleInputChange('faviconUrl', url)} label="Upload" />
 </div>
 </div>
 </div>
 </div>

 <div>
 <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced Settings (Custom Code)</h3>
 <div className="space-y-4 mb-6">
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Custom Landing Page HTML</label>
 <textarea
 rows={6}
 value={formData.customHtml || ''}
 onChange={(e) => handleInputChange('customHtml', e.target.value)}
 placeholder="<!-- Paste your full custom landing page HTML here -->"
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text font-mono text-[12px] placeholder-gray-500"
 />
 <p className="text-[11px] text-crm-muted mt-1">Leave blank to use the standard template. If provided, this will completely replace the shop's landing page content.</p>
 </div>
 <div>
 <label className="block font-medium text-crm-muted mb-2 text-[13px]">Custom CSS</label>
 <textarea
 rows={4}
 value={formData.customCss || ''}
 onChange={(e) => handleInputChange('customCss', e.target.value)}
 placeholder="/* Paste your custom CSS styles here */"
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text font-mono text-[12px] placeholder-gray-500"
 />
 <p className="text-[11px] text-crm-muted mt-1">Add custom styles that will be applied to your shop's booking page and landing page.</p>
 </div>
 </div>
 </div>

 {activeVariables.length > 0 && (
 <div className="mb-8 p-6 bg-crm-surface border border-crm-border rounded-xl shadow-sm">
 <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Template Custom Variables</h3>
 <p className="text-crm-muted mb-4 text-[13px]">
 These fields were automatically detected from your selected custom template. Fill them in to customize your landing page.
 </p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {activeVariables.map((variable) => (
 <div key={variable}>
 <label className="block font-medium text-crm-muted mb-2 capitalize text-[13px]">
 {variable.replace(/([A-Z])/g, ' $1').trim()}
 </label>
 {variable.toLowerCase().includes('image') || variable.toLowerCase().includes('url') ? (
 <input
 type="url"
 value={formData[variable] || ''}
 onChange={(e) => handleInputChange(variable, e.target.value)}
 placeholder="https://..."
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 ) : (
 <textarea
 value={formData[variable] || ''}
 onChange={(e) => handleInputChange(variable, e.target.value)}
 placeholder={`Enter ${variable}...`}
 rows={variable.toLowerCase().includes('text') || variable.toLowerCase().includes('description') ? 4 : 1}
 className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
 />
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 <button
 onClick={handleSave}
 disabled={isLoading}
 className="w-full bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50 font-bold py-3 rounded-lg transition-colors"
 >
 {isLoading ? 'Saving...' : 'Save Information'}
 </button>
 </div>
 </div>
 );
}
