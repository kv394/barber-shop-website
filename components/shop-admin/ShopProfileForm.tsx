'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ShopProfileFormProps {
  shopId: string;
  initialName: string;
  initialDescription: string | null;
  initialSlogan: string | null;
}

export function ShopProfileForm({ shopId, initialName, initialDescription, initialSlogan }: ShopProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialName || '',
    description: initialDescription || '',
    slogan: initialSlogan || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save profile (${response.status})`);
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-crm-bg/50 p-6 rounded-xl border border-crm-border shadow-sm mb-6">
      <div className="mb-6">
        <h2 className="font-bold text-crm-text mb-2 text-xl">Shop Profile</h2>
        <p className="text-crm-muted text-[13px]">
          Update the basic details of your shop, which appear on your public portal.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-status-cancelled/20 text-status-cancelled rounded-lg text-[13px]">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-status-confirmed/20 text-status-confirmed rounded-lg text-[13px]">
          Profile updated successfully!
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-medium text-crm-muted mb-2 text-[13px]">Shop Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="E.g., The Gentleman's Barbershop"
            className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block font-medium text-crm-muted mb-2 text-[13px]">Slogan (Tagline)</label>
          <input
            type="text"
            value={formData.slogan}
            onChange={(e) => handleInputChange('slogan', e.target.value)}
            placeholder="E.g., Precision cuts for the modern man"
            className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block font-medium text-crm-muted mb-2 text-[13px]">Description (About the Shop)</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Tell your clients a little bit about your shop's history, atmosphere, and specialties."
            className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text placeholder-gray-500"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-bold text-[13px] transition-all ${
              isLoading
                ? 'bg-crm-surface text-crm-muted cursor-not-allowed'
                : 'bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 shadow-sm'
            }`}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
