'use client';

import { useState, useEffect } from 'react';
import { fmtPrice } from '@/lib/formatters';

interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

interface AddonManagementProps {
  shopId: string;
  currency: string;
}

export function AddonManagement({ shopId, currency }: AddonManagementProps) {
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newAddon, setNewAddon] = useState({
    name: '',
    price: '',
    durationMin: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await fetch(`/api/shops/${shopId}/services/addons`);
        if (!response.ok) throw new Error('Failed to fetch addons');
        const data = await response.json();
        setAddons(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddons();
  }, [shopId]);

  const handleAddAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!newAddon.name.trim()) throw new Error('Name is required');
      if (!newAddon.price || parseFloat(newAddon.price) < 0) throw new Error('Valid price is required');

      const response = await fetch(`/api/shops/${shopId}/services/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAddon.name,
          price: parseFloat(newAddon.price),
          durationMin: parseInt(newAddon.durationMin || '0'),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add addon');
      }

      const added = await response.json();
      setAddons([...addons, added]);
      setNewAddon({ name: '', price: '', durationMin: '' });
      setSuccess(`Add-on "${newAddon.name}" added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddon = async (addonId: string, addonName: string) => {
    if (!confirm(`Are you sure you want to delete "${addonName}"?`)) return;

    try {
      const response = await fetch(`/api/shops/${shopId}/services/addons/${addonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete addon');

      setAddons(addons.filter((a) => a.id !== addonId));
      setSuccess(`Add-on deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) return <div className="text-center py-4 text-crm-muted text-[13px]">Loading add-ons...</div>;

  return (
    <div className="w-full space-y-6 sm:space-y-8 mt-12">
      <div>
        {error && (
          <div className="bg-status-cancelled/10 border border-status-cancelled text-status-cancelled p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-[13px]">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-status-confirmed/10 border border-status-confirmed text-status-confirmed p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-[13px]">
            {success}
          </div>
        )}

        <div className="bg-crm-surface p-4 sm:p-6 rounded-lg border border-crm-border shadow-sm mb-6 sm:mb-8">
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Add New Add-On</h3>
          <form onSubmit={handleAddAddon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">Name *</label>
                <input
                  type="text"
                  value={newAddon.name}
                  onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                  placeholder="e.g., Beard Trim, Hot Towel"
                  required
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">Price ($) *</label>
                <input
                  type="text"
                  value={newAddon.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) setNewAddon({ ...newAddon, price: val });
                  }}
                  placeholder="15.00"
                  required
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">Adds Duration (minutes)</label>
                <input
                  type="text"
                  value={newAddon.durationMin}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) setNewAddon({ ...newAddon, durationMin: val });
                  }}
                  placeholder="15 (optional)"
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newAddon.name || !newAddon.price}
              className="w-full bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50 font-bold py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Add-On'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Current Add-Ons</h3>
          {addons.length === 0 ? (
            <div className="bg-crm-surface p-8 rounded-lg border border-crm-border shadow-sm text-center">
              <p className="text-crm-muted text-[13px]">No add-ons added yet. Create one above to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {addons.map((addon) => (
                <div key={addon.id} className="bg-crm-surface p-4 rounded-lg border border-crm-border shadow-sm flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-semibold text-crm-text text-base">{addon.name}</h4>
                    <p className="text-crm-muted text-[13px]">
                      +{fmtPrice(addon.price, currency)} {addon.durationMin > 0 ? `• Adds ${addon.durationMin} min` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddon(addon.id, addon.name)}
                    className="bg-status-cancelled/20 hover:bg-status-cancelled/40 text-status-cancelled px-3 py-1.5 rounded-lg transition-colors text-[13px] self-start"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
