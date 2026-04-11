'use client';

import { useState, useEffect } from 'react';

export default function CampaignBuilder({ shopId }: { shopId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    message: '',
    type: 'PROMO',
    channel: 'EMAIL',
    targetSegment: 'ALL',
  });

  useEffect(() => { loadCampaigns(); }, [shopId]);

  const loadCampaigns = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/campaigns`);
      const data = await res.json();
      if (Array.isArray(data)) setCampaigns(data);
    } catch {} finally { setLoading(false); }
  };

  const createCampaign = async () => {
    if (!form.name || !form.message) return alert('Name and message are required');
    try {
      const res = await fetch(`/api/shops/${shopId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: '', message: '', type: 'PROMO', channel: 'EMAIL', targetSegment: 'ALL' });
        setShowCreate(false);
        loadCampaigns();
      }
    } catch { alert('Failed to create campaign'); }
  };

  const sendCampaign = async (campaignId: string) => {
    if (!confirm('Send this campaign to all target recipients now?')) return;
    setSending(campaignId);
    try {
      const res = await fetch(`/api/shops/${shopId}/campaigns`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action: 'send' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Campaign sent to ${data.recipientCount} recipients!`);
        loadCampaigns();
      }
    } catch { alert('Failed to send'); }
    finally { setSending(null); }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-botanical-surface text-botanical-muted border-botanical-border',
      SCHEDULED: 'bg-blue-900/50 text-blue-300 border-blue-500/30',
      SENT: 'bg-green-900/50 text-green-300 border-green-500/30',
      CANCELLED: 'bg-red-900/50 text-red-300 border-red-500/30',
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[status] || colors.DRAFT}`}>{status}</span>;
  };

  const segmentLabels: Record<string, string> = {
    ALL: '👥 All Clients',
    INACTIVE_30: '⏰ Inactive 30+ days',
    INACTIVE_60: '⚠️ Inactive 60+ days',
    INACTIVE_90: '🚨 Inactive 90+ days',
    BIRTHDAY_THIS_MONTH: '🎂 Birthday This Month',
  };

  if (loading) return <p className="text-botanical-muted text-center py-12">Loading campaigns...</p>;

  return (
    <div className="space-y-8">
      {/* Create Campaign */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-botanical-text flex items-center gap-2">
          <span>📣</span> Campaigns
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-botanical-primary text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-yellow-400"
        >
          {showCreate ? '✕ Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border space-y-4">
          <div>
            <label className="block text-[11px] text-botanical-muted mb-1 uppercase tracking-wider">Campaign Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Summer Sale 20% Off"
              className="w-full bg-botanical-surface border border-botanical-border rounded-md p-2.5 text-sm text-botanical-text focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="block text-[11px] text-botanical-muted mb-1 uppercase tracking-wider">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write your promotional message here..."
              rows={4}
              className="w-full bg-botanical-surface border border-botanical-border rounded-md p-2.5 text-sm text-botanical-text focus:outline-none focus:border-brand-gold resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-botanical-muted mb-1 uppercase tracking-wider">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-botanical-surface border border-botanical-border rounded-md p-2.5 text-sm text-botanical-text focus:outline-none focus:border-brand-gold"
              >
                <option value="PROMO">Promotion</option>
                <option value="RE_ENGAGEMENT">Re-engagement</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-botanical-muted mb-1 uppercase tracking-wider">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm(f => ({ ...f, channel: e.target.value }))}
                className="w-full bg-botanical-surface border border-botanical-border rounded-md p-2.5 text-sm text-botanical-text focus:outline-none focus:border-brand-gold"
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-botanical-muted mb-1 uppercase tracking-wider">Target Audience</label>
              <select
                value={form.targetSegment}
                onChange={(e) => setForm(f => ({ ...f, targetSegment: e.target.value }))}
                className="w-full bg-botanical-surface border border-botanical-border rounded-md p-2.5 text-sm text-botanical-text focus:outline-none focus:border-brand-gold"
              >
                {Object.entries(segmentLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={createCampaign}
            className="bg-botanical-primary text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-yellow-400"
          >
            Create Campaign
          </button>
        </div>
      )}

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded bg-botanical-surface">
          No campaigns yet. Create one to start engaging your clients!
        </p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="bg-botanical-surface p-4 rounded-xl border border-botanical-border flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-botanical-text truncate">{c.name}</h4>
                  {getStatusBadge(c.status)}
                </div>
                <p className="text-xs text-botanical-muted truncate">{c.message}</p>
                <div className="flex gap-3 mt-1 text-[10px] text-botanical-muted">
                  <span>📧 {c.channel}</span>
                  <span>🎯 {segmentLabels[c.targetSegment] || c.targetSegment}</span>
                  {c.recipientCount > 0 && <span>👥 {c.recipientCount} sent</span>}
                  <span>📅 {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {c.status === 'DRAFT' && (
                <button
                  onClick={() => sendCampaign(c.id)}
                  disabled={sending === c.id}
                  className="bg-green-600 text-botanical-text px-4 py-2 rounded-md text-xs font-bold hover:bg-green-500 disabled:opacity-50 shrink-0"
                >
                  {sending === c.id ? 'Sending...' : '🚀 Send Now'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

