'use client';

import { useState } from 'react';
import { DEFAULT_CUSTOMIZATION, Customization } from '@/lib/templates';
import { useRouter } from 'next/navigation';
import { EditorialCustomizationForm } from './EditorialCustomizationForm';

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
      <h2 className="font-bold text-crm-text mb-4 sm:mb-6 text-3xl md:text-4xl">
        {isSiteAdmin ? "Customize Your Shop Appearance" : "Update Contact Information"}
      </h2>

      {error && (
        <div className="bg-status-cancelled/10 border border-status-cancelled text-status-cancelled p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-status-confirmed/10 border border-status-confirmed text-status-confirmed p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm">
          Information saved successfully!
        </div>
      )}

      <div className="space-y-6 bg-crm-surface p-4 sm:p-6 md:p-8 rounded-lg border border-crm-border shadow-sm">
        
        <div>
            <h3 className="font-bold text-crm-text mb-4 text-2xl md:text-3xl">Brand Look & Feel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block font-medium text-crm-muted mb-2 text-sm">
                  Logo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('type', 'logos');
                        const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        handleInputChange('logoUrl', data.url);
                      } catch (err: any) {
                        alert('Upload failed: ' + err.message);
                      } finally {
                        setIsLoading(false);
                      }
                    }} 
                    className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-sm focus:outline-none focus:border-brand-gold file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-crm-primary/20 file:text-crm-primary hover:file:bg-crm-primary/30 hover:opacity-90" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-crm-muted mb-2 text-sm">
                  Hero / Banner Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.heroImageUrl || ''}
                    onChange={(e) => handleInputChange('heroImageUrl', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="flex-1 w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('type', 'banners');
                        const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        handleInputChange('heroImageUrl', data.url);
                      } catch (err: any) {
                        alert('Upload failed: ' + err.message);
                      } finally {
                        setIsLoading(false);
                      }
                    }} 
                    className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-sm focus:outline-none focus:border-brand-gold file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-crm-primary/20 file:text-crm-primary hover:file:bg-crm-primary/30 hover:opacity-90" 
                  />
                </div>
              </div>
            </div>
            <h3 className="font-bold text-crm-text mb-4 text-2xl md:text-3xl">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-medium text-crm-muted mb-2 text-sm">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#000000'}
                    onChange={(e) =>
                      handleInputChange('primaryColor', e.target.value)
                    }
                    className="h-12 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor || ''}
                    onChange={(e) =>
                      handleInputChange('primaryColor', e.target.value)
                    }
                    className="flex-1 bg-crm-bg border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-crm-muted mb-2 text-sm">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor || '#000000'}
                    onChange={(e) =>
                      handleInputChange('secondaryColor', e.target.value)
                    }
                    className="h-12 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor || ''}
                    onChange={(e) =>
                      handleInputChange('secondaryColor', e.target.value)
                    }
                    className="flex-1 bg-crm-bg border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text"
                  />
                </div>
              </div>
            </div>
          </div>

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-2xl md:text-3xl">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-sm">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block font-medium text-crm-muted mb-2 text-sm">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@shop.com"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block font-medium text-crm-muted mb-2 text-sm">
                Business Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, City, State"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-2xl md:text-3xl">Social Media Links</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-crm-muted mb-2 text-sm">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.social?.facebook || ''}
                onChange={(e) =>
                  handleInputChange('social', {
                    ...formData.social,
                    facebook: e.target.value,
                  })
                }
                placeholder="https://facebook.com/yourpage"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block font-medium text-crm-muted mb-2 text-sm">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.social?.instagram || ''}
                onChange={(e) =>
                  handleInputChange('social', {
                    ...formData.social,
                    instagram: e.target.value,
                  })
                }
                placeholder="https://instagram.com/yourpage"
                className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block font-medium text-crm-muted mb-2 text-sm">
                Twitter URL
              </label>
              <input
                type="url"
                value={formData.social?.twitter || ''}
                onChange={(e) =>
                  handleInputChange('social', {
                    ...formData.social,
                    twitter: e.target.value,
                  })
                }
                placeholder="https://twitter.com/yourpage"
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
            <h3 className="font-bold text-crm-text mb-4 text-2xl md:text-3xl">Template Custom Variables</h3>
            <p className="text-crm-muted mb-4 text-base md:text-lg">
              These fields were automatically detected from your selected custom template. Fill them in to customize your landing page.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeVariables.map((variable) => (
                <div key={variable}>
                  <label className="block font-medium text-crm-muted mb-2 capitalize text-sm">
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
