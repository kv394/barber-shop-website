'use client';;
import Image from 'next/image';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportAccessToggle({ 
  shopId, 
  initialEnabled, 
  expiresAt 
}: { 
  shopId: string; 
  initialEnabled: boolean; 
  expiresAt: Date | null; 
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/settings/security/support-access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      });
      if (res.ok) {
        setEnabled(!enabled);
        router.refresh();
      } else {
        alert('Failed to update support access');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating support access');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const currentlyActive = enabled && !isExpired;

  return (
    <div className="bg-crm-surface border border-crm-border rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-crm-text text-lg flex items-center gap-2">
            <span>🛡️</span> Allow Support Access
          </h3>
          <p className="text-crm-muted text-[13px] mt-1 max-w-2xl leading-relaxed">
            Grant temporary read-only access to KutzApp Support so they can view your dashboard to help troubleshoot issues.
            Access automatically expires after 24 hours.
          </p>
          {currentlyActive && expiresAt && (
            <p className="text-emerald-600 text-[12px] mt-2 font-semibold">
              ✓ Access active until {new Date(expiresAt).toLocaleString()}
            </p>
          )}
          {enabled && isExpired && (
            <p className="text-red-500 text-[12px] mt-2 font-semibold">
              ✗ Access expired on {new Date(expiresAt!).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={toggleAccess}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-crm-primary focus:ring-offset-2 ${
            currentlyActive ? 'bg-emerald-500' : 'bg-crm-border'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              currentlyActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
