'use client';

import { useState, useEffect } from 'react';

interface FeatureRequest {
  id: string;
  featureId: string;
  featureName: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  requestedAt: string;
  requestedBy: string;
  resolvedAt?: string;
}

export default function FeatureRequestsPanel({ shopId }: { shopId: string }) {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [shopId]);

  async function fetchRequests() {
    try {
      const res = await fetch(`/api/siteadmin/shops/${shopId}/feature-requests`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.featureRequests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: string, action: 'approve' | 'deny') {
    setProcessing(requestId);
    setMessage(null);

    try {
      const res = await fetch(`/api/siteadmin/shops/${shopId}/feature-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        // Refresh the list
        await fetchRequests();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(null);
    }
  }

  const pending = requests.filter(r => r.status === 'PENDING');
  const resolved = requests.filter(r => r.status !== 'PENDING');

  if (loading) {
    return (
      <div className="bg-crm-surface border border-crm-border rounded-xl p-6 shadow-sm">
        <div className="text-crm-muted text-sm">Loading feature requests...</div>
      </div>
    );
  }

  if (requests.length === 0) return null; // Don't show if no requests

  return (
    <div className="bg-crm-surface border border-crm-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-crm-border bg-crm-bg flex items-center justify-between">
        <h2 className="text-lg font-bold text-crm-text flex items-center gap-2">
          🔔 Feature Requests
          {pending.length > 0 && (
            <span className="px-2 py-0.5 bg-brand-amber/20 text-brand-amber text-[11px] font-bold rounded-full">
              {pending.length} pending
            </span>
          )}
        </h2>
      </div>

      <div className="p-4">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-status-confirmed/20 text-status-confirmed'
              : 'bg-status-cancelled/20 text-status-cancelled'
          }`}>
            {message.text}
          </div>
        )}

        {/* Pending Requests */}
        {pending.length > 0 && (
          <div className="space-y-3 mb-4">
            {pending.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-brand-amber/30 bg-brand-amber/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-crm-text">{req.featureName}</span>
                    <span className="px-2 py-0.5 bg-brand-amber/20 text-brand-amber text-[10px] font-bold rounded-full uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-[12px] text-crm-muted mt-1">
                    Requested by {req.requestedBy} • {new Date(req.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(req.id, 'approve')}
                    disabled={processing === req.id}
                    className="px-4 py-2 bg-status-confirmed text-white text-[12px] font-bold rounded-lg hover:bg-status-confirmed/90 transition-colors disabled:opacity-50"
                  >
                    {processing === req.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'deny')}
                    disabled={processing === req.id}
                    className="px-4 py-2 bg-status-cancelled text-white text-[12px] font-bold rounded-lg hover:bg-status-cancelled/90 transition-colors disabled:opacity-50"
                  >
                    ✕ Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resolved Requests */}
        {resolved.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-crm-muted uppercase tracking-wider px-1 mb-2">History</h3>
            {resolved.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-crm-border bg-crm-bg">
                <div>
                  <span className="text-sm text-crm-text">{req.featureName}</span>
                  <span className="text-[11px] text-crm-muted ml-2">
                    {req.requestedBy} • {new Date(req.requestedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  req.status === 'APPROVED'
                    ? 'bg-status-confirmed/20 text-status-confirmed'
                    : 'bg-status-cancelled/20 text-status-cancelled'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
