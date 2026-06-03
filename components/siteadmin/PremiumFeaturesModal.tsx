'use client';

import { useState, useEffect } from 'react';

interface PremiumFeaturesModalProps {
  shopId: string;
  shopName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PREMIUM_FEATURES = [
  { id: 'loyalty', name: 'Loyalty Program', price: '$15/mo' },
  { id: 'campaigns', name: 'Marketing Campaigns', price: '$20/mo' },
  { id: 'aiSocial', name: 'AI Social Media', price: '$25/mo' },
  { id: 'kiosk', name: 'Front Desk Kiosk', price: '$15/mo' },
  { id: 'giftCards', name: 'Gift Cards', price: '$10/mo' },
  { id: 'payroll', name: 'Automated Payroll', price: '$20/mo' },
  { id: 'dynamicPricing', name: 'Dynamic Pricing', price: '$15/mo' },
  { id: 'consultations', name: 'Virtual Consultations', price: '$15/mo' },
  { id: 'customSmtp', name: 'Custom Email (SMTP)', price: '$10/mo' },
];

export default function PremiumFeaturesModal({ shopId, shopName, onClose, onSuccess }: PremiumFeaturesModalProps) {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the shop's current features
    const fetchShop = async () => {
      try {
        // We can just hit a generic API or assume it's empty for now since we didn't return premiumFeatures in the generic /api/siteadmin/shops route initially
        const res = await fetch('/api/siteadmin/shops');
        if (res.ok) {
          const data = await res.json();
          const targetShop = data.shops?.find((s: any) => s.id === shopId);
          if (targetShop && targetShop.premiumFeatures) {
            setFeatures(targetShop.premiumFeatures);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopId]);

  const toggleFeature = (id: string) => {
    setFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/siteadmin/shops/${shopId}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });
      if (!res.ok) throw new Error('Failed to update features');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-crm-surface border border-crm-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-crm-border flex justify-between items-center bg-crm-bg">
          <div>
            <h2 className="font-bold text-lg text-crm-text">💎 Manage Premium Features</h2>
            <p className="text-[12px] text-crm-muted">Configure access for {shopName}</p>
          </div>
          <button onClick={onClose} className="text-crm-muted hover:text-crm-text">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-status-cancelled/20 text-status-cancelled rounded-lg mb-4 text-sm font-medium">{error}</div>}
          
          {loading ? (
            <div className="text-center py-8 text-crm-muted">Loading features...</div>
          ) : (
            <div className="space-y-3">
              {PREMIUM_FEATURES.map(feat => {
                const isEnabled = features[feat.id] === true;
                return (
                  <div key={feat.id} className="flex items-center justify-between p-4 rounded-xl border border-crm-border bg-crm-bg hover:border-brand-indigo/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-crm-text">{feat.name}</h3>
                      <p className="text-[12px] text-crm-muted">{feat.price}</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleFeature(feat.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-status-confirmed' : 'bg-crm-muted'}`}
                    >
                      <span className={`absolute top-1/2 -translate-y-1/2 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-crm-border bg-crm-bg flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-crm-muted hover:text-crm-text transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={loading || saving}
            className="px-6 py-2 bg-brand-indigo text-white text-sm font-bold rounded-lg hover:bg-brand-indigo/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
