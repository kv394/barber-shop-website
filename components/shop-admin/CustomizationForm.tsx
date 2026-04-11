'use client';

import { useState } from 'react';
import { DEFAULT_CUSTOMIZATION, Customization } from '@/lib/templates';
import { useRouter } from 'next/navigation';

interface CustomizationFormProps {
  shopId: string;
  customization: any;
  onSave?: (customization: Customization) => void;
  isSuperAdmin: boolean;
}

export function CustomizationForm({
  shopId,
  customization,
  onSave,
  isSuperAdmin,
}: CustomizationFormProps) {
  const [formData, setFormData] = useState(customization || DEFAULT_CUSTOMIZATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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
      <h2 className="text-xl sm:text-2xl font-bold text-botanical-text mb-4 sm:mb-6">
        {isSuperAdmin ? "Customize Your Shop Appearance" : "Update Contact Information"}
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm">
          Information saved successfully!
        </div>
      )}

      <div className="space-y-6 bg-botanical-surface p-4 sm:p-6 md:p-8 rounded-lg border-2 border-b-[6px] border-botanical-border">
        
        {/* ONLY SUPER ADMIN CAN EDIT COLORS */}
        {isSuperAdmin && (
          <div>
            <h3 className="text-lg font-bold text-botanical-text mb-4">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                    className="flex-1 bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-3 py-2 text-botanical-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                    className="flex-1 bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-3 py-2 text-botanical-text"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-bold text-botanical-text mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-botanical-muted mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-botanical-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@shop.com"
                className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-botanical-muted mb-2">
                Business Address
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, City, State"
                className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-botanical-text mb-4">Social Media Links</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-botanical-text font-bold py-3 rounded-lg transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save Information'}
        </button>
      </div>
    </div>
  );
}
