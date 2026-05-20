'use client';

import { useState, useEffect } from 'react';

interface CampaignVariation {
  tone: string;
  toneLabel: string;
  campaignName: string;
  smsBody?: string;
  emailSubject?: string;
  emailBody?: string;
}

const CAMPAIGN_GOALS = [
  { id: 'WIN_BACK', icon: '🔄', label: 'Win Back', desc: 'Re-engage inactive clients' },
  { id: 'NEW_SERVICE', icon: '🎉', label: 'New Promo', desc: 'Promote a deal or service' },
  { id: 'BIRTHDAY', icon: '🎂', label: 'Birthday', desc: 'Celebrate client birthdays' },
  { id: 'ANNOUNCEMENT', icon: '📣', label: 'Announce', desc: 'General announcements' },
  { id: 'CUSTOM', icon: '✍️', label: 'Custom', desc: 'Write your own prompt' },
];

const TONE_ICONS: Record<string, string> = {
  casual: '😊',
  professional: '💼',
  bold: '🔥',
};

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

  // AI Generation state
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVariations, setAiVariations] = useState<CampaignVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

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
        resetAiState();
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

  const resetAiState = () => {
    setSelectedGoal(null);
    setCustomPrompt('');
    setAiVariations([]);
    setSelectedVariation(null);
    setAiError(null);
    setShowAiPanel(false);
  };

  const generateWithAi = async () => {
    if (!selectedGoal) return;
    setAiLoading(true);
    setAiError(null);
    setAiVariations([]);
    setSelectedVariation(null);

    try {
      const res = await fetch(`/api/shops/${shopId}/campaigns/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: selectedGoal,
          channel: form.channel,
          targetSegment: form.targetSegment,
          customPrompt: selectedGoal === 'CUSTOM' ? customPrompt : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      setAiVariations(data.variations || []);
    } catch (err: any) {
      setAiError(err.message || 'Something went wrong');
    } finally {
      setAiLoading(false);
    }
  };

  const selectVariation = (index: number) => {
    setSelectedVariation(index);
    const v = aiVariations[index];
    if (!v) return;

    // Build the message based on channel
    let message = '';
    if (form.channel === 'SMS') {
      message = v.smsBody || '';
    } else if (form.channel === 'BOTH') {
      message = `📧 EMAIL:\nSubject: ${v.emailSubject || ''}\n${v.emailBody || ''}\n\n📱 SMS:\n${v.smsBody || ''}`;
    } else {
      message = v.emailBody ? `Subject: ${v.emailSubject || ''}\n\n${v.emailBody}` : '';
    }

    setForm(f => ({
      ...f,
      name: v.campaignName || f.name,
      message: message || f.message,
    }));
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-crm-surface text-crm-muted border-crm-border',
      SCHEDULED: 'bg-status-info/20 text-status-info border-status-info/30',
      SENT: 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30',
      CANCELLED: 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/30',
    };
    return <span className={`px-2 py-0.5 rounded text-[13px] font-bold border ${colors[status] || colors.DRAFT}`}>{status}</span>;
  };

  const segmentLabels: Record<string, string> = {
    ALL: '👥 All Clients',
    INACTIVE_30: '⏰ Inactive 30+ days',
    INACTIVE_60: '⚠️ Inactive 60+ days',
    INACTIVE_90: '🚨 Inactive 90+ days',
    BIRTHDAY_THIS_MONTH: '🎂 Birthday This Month',
  };

  const smsCharCount = form.channel === 'SMS'
    ? form.message.length
    : form.channel === 'BOTH'
      ? (form.message.includes('📱 SMS:\n') ? form.message.split('📱 SMS:\n').pop()?.length ?? 0 : 0)
      : null;

  if (loading) return <p className="text-crm-muted text-center py-12 text-[13px]">Loading campaigns...</p>;

  return (
    <div className="space-y-8">
      {/* Create Campaign */}
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
        <h3 className="font-bold text-crm-text flex items-center gap-2 text-lg font-bold">
          <span>📣</span> Campaigns
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-crm-primary text-white px-4 py-2 rounded-md text-[13px] font-bold hover:bg-status-pending"
        >
          {showCreate ? '✕ Cancel' : '+ New Campaign'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm space-y-5">
          {/* Channel + Segment + Type selectors — moved up so AI knows context */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold"
              >
                <option value="PROMO">Promotion</option>
                <option value="RE_ENGAGEMENT">Re-engagement</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm(f => ({ ...f, channel: e.target.value }))}
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold"
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Target Audience</label>
              <select
                value={form.targetSegment}
                onChange={(e) => setForm(f => ({ ...f, targetSegment: e.target.value }))}
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold"
              >
                {Object.entries(segmentLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Generation Panel */}
          <div className="border border-dashed border-crm-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-crm-surface/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-[13px] font-bold text-crm-text">
                <span className="text-base">✨</span> Generate with AI
                <span className="text-[11px] font-normal text-crm-muted bg-crm-surface px-2 py-0.5 rounded-full border border-crm-border">
                  Powered by Gemini
                </span>
              </span>
              <span className={`text-crm-muted transition-transform duration-200 ${showAiPanel ? 'rotate-180' : ''}`}>
                ▾
              </span>
            </button>

            {showAiPanel && (
              <div className="p-4 pt-0 space-y-4 animate-fade-in">
                {/* Goal Cards */}
                <div>
                  <label className="block text-crm-muted mb-2 uppercase tracking-wider text-[11px]">What&apos;s the goal?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CAMPAIGN_GOALS.map((goal) => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all duration-150 text-[12px]
                          ${selectedGoal === goal.id
                            ? 'border-brand-gold bg-brand-gold/10 shadow-sm ring-1 ring-brand-gold/30'
                            : 'border-crm-border hover:border-crm-muted hover:bg-crm-surface/80'
                          }`}
                      >
                        <span className="text-lg">{goal.icon}</span>
                        <span className="font-bold text-crm-text">{goal.label}</span>
                        <span className="text-crm-muted text-[10px] leading-tight">{goal.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt Input */}
                {selectedGoal === 'CUSTOM' && (
                  <div>
                    <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[11px]">
                      Describe your campaign idea
                      <span className="float-right normal-case tracking-normal">{customPrompt.length}/500</span>
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value.slice(0, 500))}
                      placeholder="e.g. We just hired a new female hairstylist who specializes in balayage and color treatments..."
                      rows={2}
                      className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold resize-y"
                    />
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={generateWithAi}
                    disabled={!selectedGoal || aiLoading || (selectedGoal === 'CUSTOM' && !customPrompt.trim())}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-bold
                      hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all
                      shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    {aiLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : aiVariations.length > 0 ? (
                      '🔄 Regenerate'
                    ) : (
                      '✨ Generate Copy'
                    )}
                  </button>
                  {!selectedGoal && (
                    <span className="text-crm-muted text-[11px]">← Select a goal first</span>
                  )}
                </div>

                {/* AI Error */}
                {aiError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-[13px]">
                    ⚠️ {aiError}
                  </div>
                )}

                {/* Loading Skeleton */}
                {aiLoading && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-crm-border rounded-lg p-4 space-y-3 animate-pulse">
                        <div className="h-4 bg-crm-border rounded w-2/3" />
                        <div className="h-3 bg-crm-border rounded w-full" />
                        <div className="h-3 bg-crm-border rounded w-5/6" />
                        <div className="h-3 bg-crm-border rounded w-4/6" />
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Variation Cards */}
                {aiVariations.length > 0 && !aiLoading && (
                  <div>
                    <label className="block text-crm-muted mb-2 uppercase tracking-wider text-[11px]">
                      Pick a variation — click to auto-fill
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {aiVariations.map((v, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectVariation(i)}
                          className={`text-left border rounded-xl p-4 transition-all duration-200 group
                            ${selectedVariation === i
                              ? 'border-brand-gold bg-brand-gold/5 ring-2 ring-brand-gold/20 shadow-md'
                              : 'border-crm-border hover:border-crm-muted hover:shadow-sm'
                            }`}
                        >
                          {/* Tone Badge */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                              ${i === 0 ? 'bg-blue-100 text-blue-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
                              {TONE_ICONS[v.tone] || '✦'} {v.toneLabel}
                            </span>
                            {selectedVariation === i && (
                              <span className="text-brand-gold text-[13px]">✓</span>
                            )}
                          </div>

                          {/* Campaign Name */}
                          <p className="font-semibold text-crm-text text-[13px] mb-1.5 truncate">
                            {v.campaignName}
                          </p>

                          {/* Preview */}
                          {v.emailSubject && (
                            <p className="text-crm-muted text-[11px] mb-1">
                              <span className="font-bold">Subj:</span> {v.emailSubject}
                            </p>
                          )}
                          <p className="text-crm-muted text-[12px] leading-relaxed line-clamp-3">
                            {v.smsBody || v.emailBody || '—'}
                          </p>

                          {/* SMS char count */}
                          {v.smsBody && (
                            <p className={`mt-2 text-[10px] font-mono ${v.smsBody.length > 155 ? 'text-red-500' : 'text-crm-muted'}`}>
                              SMS: {v.smsBody.length}/155 chars
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Campaign Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Summer Sale 20% Off"
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-crm-muted uppercase tracking-wider text-[13px]">Message</label>
              {smsCharCount !== null && (
                <span className={`text-[11px] font-mono ${smsCharCount > 155 ? 'text-red-500 font-bold' : 'text-crm-muted'}`}>
                  {form.channel === 'BOTH' ? 'SMS ' : ''}{smsCharCount}/155 chars
                </span>
              )}
            </div>
            <textarea
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write your promotional message here..."
              rows={4}
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2.5 text-[13px] text-crm-text focus:outline-none focus:border-brand-gold resize-y"
            />
          </div>

          <button
            onClick={createCampaign}
            className="bg-crm-primary text-white px-6 py-2 rounded-md text-[13px] font-bold hover:bg-status-pending"
          >
            Create Campaign
          </button>
        </div>
      )}

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <p className="text-crm-muted italic text-center py-8 border border-dashed border-crm-border rounded bg-crm-surface text-[13px]">
          No campaigns yet. Create one to start engaging your clients!
        </p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-crm-text truncate text-base font-semibold">{c.name}</h4>
                  {getStatusBadge(c.status)}
                </div>
                <p className="text-crm-muted truncate text-[13px]">{c.message}</p>
                <div className="flex gap-3 mt-1 text-[13px] text-crm-muted">
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
                  className="bg-status-confirmed text-crm-text px-4 py-2 rounded-md text-[11px] font-bold hover:bg-status-confirmed disabled:opacity-50 shrink-0"
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
