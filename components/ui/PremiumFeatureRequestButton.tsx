'use client';

import { useState } from 'react';

interface PremiumFeatureRequestButtonProps {
  shopId: string;
  featureId: string;
  featureName: string;
  hasPendingRequest: boolean;
}

export default function PremiumFeatureRequestButton({
  shopId,
  featureId,
  featureName,
  hasPendingRequest,
}: PremiumFeatureRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(hasPendingRequest);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/shops/${shopId}/feature-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, featureName }),
      });

      const data = await res.json();

      if (res.ok) {
        setRequested(true);
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (requested) {
    return (
      <div className="w-full py-4 bg-brand-amber/20 text-brand-amber rounded-xl font-bold text-lg flex items-center justify-center gap-2">
        <span>⏳</span> Request Pending
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-3 p-2 bg-status-cancelled/20 text-status-cancelled rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      <button
        onClick={handleRequest}
        disabled={loading}
        className="block w-full py-4 bg-crm-primary text-white rounded-xl font-bold text-lg hover:bg-crm-primary/90 transition-all shadow-lg shadow-crm-primary/20 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : '🚀 Request This Feature'}
      </button>
    </>
  );
}
