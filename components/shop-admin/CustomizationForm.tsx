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
    <label className="block font-medium text-crm-muted mb-2 text-[13px]">Heading Font</label>
    <select
      value={formData.headingFont || formData.fontFamily || 'Inter'}
      onChange={(e) => handleInputChange('headingFont', e.target.value)}
      className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text"
    >
      <option value="Inter">Inter (Modern)</option>
      <option value="Playfair Display">Playfair Display (Elegant)</option>
      <option value="Roboto">Roboto (Clean)</option>
      <option value="Oswald">Oswald (Classic)</option>
      <option value="Montserrat">Montserrat (Bold)</option>
    </select>
  </div>
  <div>
    <label className="block font-medium text-crm-muted mb-2 text-[13px]">Body Font</label>
    <select
      value={formData.bodyFont || formData.fontFamily || 'Inter'}
      onChange={(e) => handleInputChange('bodyFont', e.target.value)}
      className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text"
    >
      <option value="Inter">Inter (Modern)</option>
      <option value="Playfair Display">Playfair Display (Elegant)</option>
      <option value="Roboto">Roboto (Clean)</option>
      <option value="Oswald">Oswald (Classic)</option>
      <option value="Montserrat">Montserrat (Bold)</option>
    </select>
  </div>
  
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Call to Action Text</label>
              <input
                type="text"
                value={formData.ctaText || ''}
                onChange={(e) => handleInputChange('ctaText', e.target.value)}
                placeholder="E.g., Book Now"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Hero Video URL (.mp4 or YouTube)</label>
              <input
                type="url"
                value={formData.heroVideoUrl || ''}
                onChange={(e) => handleInputChange('heroVideoUrl', e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
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
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">SEO & Social Sharing</h3>
          <div className="space-y-4 mb-6">
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

        {activeVariables.length > 0 && (
          <div>
            
        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Advanced UI & Theme Overrides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Button Shape</label>
              <select value={formData.buttonShape || 'rounded'} onChange={(e) => handleInputChange('buttonShape', e.target.value)} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text">
                <option value="sharp">Sharp (Square)</option>
                <option value="rounded">Rounded</option>
                <option value="pill">Pill (Fully Rounded)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Button Variant</label>
              <select value={formData.buttonVariant || 'solid'} onChange={(e) => handleInputChange('buttonVariant', e.target.value)} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text">
                <option value="solid">Solid Color</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost (No Background)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Color Theme</label>
              <select value={formData.colorTheme || 'light'} onChange={(e) => handleInputChange('colorTheme', e.target.value)} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text">
                <option value="light">Force Light</option>
                <option value="dark">Force Dark</option>
                <option value="auto">Auto / System</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Header Style</label>
              <select value={formData.headerStyle || 'classic'} onChange={(e) => handleInputChange('headerStyle', e.target.value)} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text">
                <option value="classic">Classic (Logo Left, Nav Right)</option>
                <option value="centered">Centered (Logo Center, Nav Below)</option>
                <option value="minimal">Minimal (Logo Left, Menu Right)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Hero Layout</label>
              <select value={formData.heroLayout || 'full'} onChange={(e) => handleInputChange('heroLayout', e.target.value)} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text">
                <option value="full">Full Background Image</option>
                <option value="split">Split Screen (Image Left/Text Right)</option>
                <option value="floating">Floating Image</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Hero Overlay Color</label>
              <div className="flex gap-2">
                <input type="color" value={formData.heroOverlayColor || '#000000'} onChange={(e) => handleInputChange('heroOverlayColor', e.target.value)} className="h-10 w-16 rounded cursor-pointer" />
                <input type="text" value={formData.heroOverlayColor || '#000000'} onChange={(e) => handleInputChange('heroOverlayColor', e.target.value)} className="flex-1 bg-crm-bg border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text" />
              </div>
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Hero Overlay Opacity ({formData.heroOverlayOpacity !== undefined ? formData.heroOverlayOpacity : 0}%)</label>
              <input type="range" min="0" max="100" value={formData.heroOverlayOpacity !== undefined ? formData.heroOverlayOpacity : 0} onChange={(e) => handleInputChange('heroOverlayOpacity', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4" />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Favicon URL</label>
              <div className="flex gap-2 items-center">
                <input type="url" value={formData.faviconUrl || ''} onChange={(e) => handleInputChange('faviconUrl', e.target.value)} placeholder="https://example.com/favicon.ico" className="flex-1 w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500" />
                <MediaPicker shopId={shopId} currentUrl={formData.faviconUrl} onSelect={(url) => handleInputChange('faviconUrl', url)} label="Upload" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Section Ordering (Comma separated: hero, services, team, gallery, reviews, contact)</label>
              <input type="text" value={(formData.sectionOrder || ['hero', 'services', 'team', 'gallery', 'reviews', 'contact']).join(', ')} onChange={(e) => handleInputChange('sectionOrder', e.target.value.split(',').map(s=>s.trim()))} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500" />
            </div>
            <div className="md:col-span-2 flex items-center space-x-3 mt-4">
              <input type="checkbox" id="enableScrollAnimations" checked={formData.enableScrollAnimations || false} onChange={(e) => handleInputChange('enableScrollAnimations', e.target.checked)} className="w-4 h-4 accent-blue-600 bg-crm-bg border-crm-border rounded cursor-pointer" />
              <label htmlFor="enableScrollAnimations" className="text-crm-muted text-[13px] cursor-pointer">Enable Scroll Animations</label>
            </div>
            <div className="md:col-span-2 mt-4">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Custom CSS (Advanced)</label>
              <textarea rows={4} value={formData.customCss || ''} onChange={(e) => handleInputChange('customCss', e.target.value)} placeholder=".my-custom-class { color: red; }" className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text font-mono text-[13px] placeholder-gray-500" />
            </div>
            <div className="md:col-span-2 mt-4">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">Custom HTML (Override Entire Page)</label>
              <p className="text-xs text-crm-muted mb-2">If provided, this completely overrides the template design and custom pages. Supports standard HTML and dynamic data binding strings.</p>
              <textarea rows={10} value={formData.customHtml || ''} onChange={(e) => handleInputChange('customHtml', e.target.value)} placeholder="<html>...</html>" className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text font-mono text-[13px] placeholder-gray-500" />
            </div>
          </div>
        </div>

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
