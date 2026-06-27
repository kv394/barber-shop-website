'use client';

import { useState, useEffect } from 'react';

type Campaign = {
  id: string;
  name: string;
  type: 'SPIN_WHEEL' | 'SCRATCH_CARD' | 'PRIZE_DRAW';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
  config: any;
  startDate: string | null;
  endDate: string | null;
  maxPlaysPerUser: number;
  playLimitType: string;
  totalPlays: number;
  totalWins: number;
  createdAt: string;
  _count?: { plays: number };
};

type Prize = {
  label: string;
  value: string;
  probability: number;
  color: string;
};

const GAME_TYPES = [
  { value: 'SPIN_WHEEL', label: '🎡 Spin the Wheel', description: 'Clients spin a colorful wheel to win prizes' },
  { value: 'SCRATCH_CARD', label: '🎫 Scratch Card', description: 'Clients scratch off a card to reveal prizes' },
  { value: 'PRIZE_DRAW', label: '🏆 Prize Draw', description: 'Clients enter for a chance to win a grand prize' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  ENDED: 'bg-red-100 text-red-600',
};

const DEFAULT_SPIN_PRIZES: Prize[] = [
  { label: '10% Off', value: '10_OFF', probability: 30, color: '#FF6B6B' },
  { label: 'Free Add-on', value: 'FREE_ADDON', probability: 15, color: '#4ECDC4' },
  { label: 'Try Again', value: 'NO_WIN', probability: 25, color: '#95A5A6' },
  { label: '20% Off', value: '20_OFF', probability: 10, color: '#45B7D1' },
  { label: '$5 Off', value: '5_OFF', probability: 15, color: '#96CEB4' },
  { label: 'No Win', value: 'NO_WIN', probability: 5, color: '#BDC3C7' },
];

const DEFAULT_SCRATCH_PRIZES: Prize[] = [
  { label: '15% Off Next Visit', value: '15_OFF', probability: 25, color: '#FF6B6B' },
  { label: 'Free Product Sample', value: 'FREE_SAMPLE', probability: 20, color: '#4ECDC4' },
  { label: 'Try Again', value: 'NO_WIN', probability: 30, color: '#95A5A6' },
  { label: '$10 Off', value: '10_OFF', probability: 15, color: '#45B7D1' },
  { label: 'No Win', value: 'NO_WIN', probability: 10, color: '#BDC3C7' },
];

const DEFAULT_DRAW_PRIZES: Prize[] = [
  { label: 'Free Haircut', value: 'FREE_HAIRCUT', probability: 0, color: '#FFD700' },
  { label: '50% Off Any Service', value: '50_OFF', probability: 0, color: '#C0C0C0' },
  { label: 'Free Product Bundle', value: 'FREE_BUNDLE', probability: 0, color: '#CD7F32' },
];

export default function GamificationManager({ shopId }: { shopId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('SPIN_WHEEL');
  const [newPrizes, setNewPrizes] = useState<Prize[]>(DEFAULT_SPIN_PRIZES);
  const [newMaxPlays, setNewMaxPlays] = useState(1);
  const [newPlayLimit, setNewPlayLimit] = useState('TOTAL');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDrawDate, setNewDrawDate] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [shopId]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/gamification`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/shops/${shopId}/gamification/${campaignId}/plays`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const handleTypeChange = (type: string) => {
    setNewType(type);
    if (type === 'SPIN_WHEEL') setNewPrizes(DEFAULT_SPIN_PRIZES);
    else if (type === 'SCRATCH_CARD') setNewPrizes(DEFAULT_SCRATCH_PRIZES);
    else setNewPrizes(DEFAULT_DRAW_PRIZES);
  };

  const handleCreateCampaign = async () => {
    if (!newName.trim()) return alert('Campaign name is required');
    setSaving(true);

    try {
      const config: any = { prizes: newPrizes };
      if (newType === 'PRIZE_DRAW') {
        config.drawDate = newDrawDate || null;
        config.description = newDescription;
      }

      const res = await fetch(`/api/shops/${shopId}/gamification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          type: newType,
          config,
          startDate: newStartDate || null,
          endDate: newEndDate || null,
          maxPlaysPerUser: newMaxPlays,
          playLimitType: newPlayLimit,
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      setShowCreate(false);
      setNewName('');
      setNewType('SPIN_WHEEL');
      setNewPrizes(DEFAULT_SPIN_PRIZES);
      setNewDescription('');
      fetchCampaigns();
    } catch (err) {
      alert('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: string) => {
    try {
      const res = await fetch(`/api/shops/${shopId}/gamification/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign and all play data? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/gamification/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id));
        if (selectedCampaign?.id === id) setSelectedCampaign(null);
      }
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const updatePrize = (index: number, field: keyof Prize, value: string | number) => {
    const updated = [...newPrizes];
    (updated[index] as any)[field] = value;
    setNewPrizes(updated);
  };

  const addPrize = () => {
    setNewPrizes([...newPrizes, { label: '', value: '', probability: 10, color: '#95A5A6' }]);
  };

  const removePrize = (index: number) => {
    if (newPrizes.length <= 2) return;
    setNewPrizes(newPrizes.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-crm-muted">
        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-crm-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading gamification campaigns...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-crm-text flex items-center gap-2">
            🎮 Gamification Suite
          </h2>
          <p className="text-[13px] text-crm-muted mt-1">
            Create spin wheels, scratch cards, and prize draws to engage and delight your clients.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-crm-primary text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-crm-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          + New Campaign
        </button>
      </div>

      {/* Create Campaign Panel */}
      {showCreate && (
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-4 fade-in">
          <div className="px-6 py-4 bg-gradient-to-r from-crm-primary/10 to-transparent border-b border-white/40 flex justify-between items-center">
            <h3 className="font-black text-crm-primary uppercase tracking-widest text-[13px]">Create New Campaign</h3>
            <button onClick={() => setShowCreate(false)} className="text-crm-muted hover:text-crm-text text-lg">✕</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Name & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Summer Spin & Win"
                  className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Game Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {GAME_TYPES.map(gt => (
                    <button
                      key={gt.value}
                      onClick={() => handleTypeChange(gt.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        newType === gt.value
                          ? 'border-crm-primary bg-crm-primary/10 shadow-md'
                          : 'border-white/20 bg-white/40 hover:border-crm-primary/30'
                      }`}
                    >
                      <div className="text-xl mb-1">{gt.label.split(' ')[0]}</div>
                      <div className="text-[10px] font-bold text-crm-text">{gt.label.split(' ').slice(1).join(' ')}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prize Draw specific fields */}
            {newType === 'PRIZE_DRAW' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Draw Date</label>
                  <input
                    type="datetime-local"
                    value={newDrawDate}
                    onChange={e => setNewDrawDate(e.target.value)}
                    className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Description</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Enter for a chance to win amazing prizes!"
                    className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Prizes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] uppercase tracking-wider font-bold text-crm-muted">
                  {newType === 'PRIZE_DRAW' ? 'Prizes' : 'Prize Segments'}
                </label>
                <button
                  onClick={addPrize}
                  className="text-[10px] font-bold text-crm-primary hover:text-crm-primary/80 uppercase tracking-widest"
                >
                  + Add Prize
                </button>
              </div>
              <div className="space-y-2">
                {newPrizes.map((prize, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-crm-bg/30 rounded-xl border border-white/20">
                    <input
                      type="color"
                      value={prize.color}
                      onChange={e => updatePrize(i, 'color', e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={prize.label}
                      onChange={e => updatePrize(i, 'label', e.target.value)}
                      placeholder="Prize label"
                      className="flex-1 bg-white/60 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-crm-text font-medium outline-none focus:ring-1 focus:ring-crm-primary"
                    />
                    <input
                      type="text"
                      value={prize.value}
                      onChange={e => updatePrize(i, 'value', e.target.value)}
                      placeholder="Code"
                      className="w-24 bg-white/60 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-crm-text font-medium outline-none focus:ring-1 focus:ring-crm-primary"
                    />
                    {newType !== 'PRIZE_DRAW' && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={prize.probability}
                          onChange={e => updatePrize(i, 'probability', parseFloat(e.target.value) || 0)}
                          className="w-16 bg-white/60 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-crm-text font-bold text-center outline-none focus:ring-1 focus:ring-crm-primary"
                        />
                        <span className="text-[10px] text-crm-muted font-bold">%</span>
                      </div>
                    )}
                    <button
                      onClick={() => removePrize(i)}
                      className="text-red-400 hover:text-red-600 text-sm font-bold px-1 flex-shrink-0"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {newType !== 'PRIZE_DRAW' && (
                <p className="text-[11px] text-crm-muted mt-2">
                  Total probability: <strong>{newPrizes.reduce((s, p) => s + p.probability, 0)}%</strong>
                  {newPrizes.reduce((s, p) => s + p.probability, 0) !== 100 && (
                    <span className="text-amber-500 ml-1">(should be 100%)</span>
                  )}
                </p>
              )}
            </div>

            {/* Step 3: Limits & Scheduling */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Max Plays</label>
                <input
                  type="number"
                  value={newMaxPlays}
                  onChange={e => setNewMaxPlays(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-bold outline-none focus:ring-2 focus:ring-crm-primary shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Limit Per</label>
                <select
                  value={newPlayLimit}
                  onChange={e => setNewPlayLimit(e.target.value)}
                  className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-bold outline-none focus:ring-2 focus:ring-crm-primary shadow-inner"
                >
                  <option value="TOTAL">Total</option>
                  <option value="DAILY">Per Day</option>
                  <option value="WEEKLY">Per Week</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                  className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-crm-muted mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={newEndDate}
                  onChange={e => setNewEndDate(e.target.value)}
                  className="w-full bg-crm-bg/50 border border-white/20 rounded-xl px-4 py-2.5 text-crm-text font-medium outline-none focus:ring-2 focus:ring-crm-primary shadow-inner text-[12px]"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end pt-4 border-t border-white/20">
              <button
                onClick={handleCreateCampaign}
                disabled={saving || !newName.trim()}
                className="bg-crm-primary text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-crm-primary/90 transition-all shadow-lg disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {campaigns.length === 0 && !showCreate ? (
        <div className="text-center py-20 bg-white/20 border border-white/20 rounded-2xl shadow-inner">
          <div className="text-5xl mb-4">🎮</div>
          <p className="font-bold text-crm-text text-lg">No campaigns yet</p>
          <p className="text-[13px] text-crm-muted mt-1 mb-6">Create your first gamification campaign to boost client engagement.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-crm-primary text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] hover:bg-crm-primary/90 transition-all shadow-lg"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
            >
              {/* Campaign Header */}
              <div className="p-5 border-b border-white/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {campaign.type === 'SPIN_WHEEL' ? '🎡' : campaign.type === 'SCRATCH_CARD' ? '🎫' : '🏆'}
                    </span>
                    <div>
                      <h3 className="font-black text-crm-text text-lg leading-tight">{campaign.name}</h3>
                      <p className="text-[11px] text-crm-muted font-medium">
                        {campaign.type.replace(/_/g, ' ')} · Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-crm-bg/50 rounded-xl p-3 text-center border border-white/20">
                    <div className="text-xl font-black text-crm-text">{campaign.totalPlays}</div>
                    <div className="text-[10px] text-crm-muted font-bold uppercase tracking-wider">Plays</div>
                  </div>
                  <div className="bg-crm-bg/50 rounded-xl p-3 text-center border border-white/20">
                    <div className="text-xl font-black text-emerald-600">{campaign.totalWins}</div>
                    <div className="text-[10px] text-crm-muted font-bold uppercase tracking-wider">Wins</div>
                  </div>
                  <div className="bg-crm-bg/50 rounded-xl p-3 text-center border border-white/20">
                    <div className="text-xl font-black text-amber-600">
                      {campaign.totalPlays > 0 ? ((campaign.totalWins / campaign.totalPlays) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-[10px] text-crm-muted font-bold uppercase tracking-wider">Win Rate</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-3 flex items-center justify-between bg-crm-bg/20">
                <div className="flex items-center gap-2">
                  {campaign.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusChange(campaign, 'ACTIVE')}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  {campaign.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleStatusChange(campaign, 'PAUSED')}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Pause
                    </button>
                  )}
                  {campaign.status === 'PAUSED' && (
                    <button
                      onClick={() => handleStatusChange(campaign, 'ACTIVE')}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      Resume
                    </button>
                  )}
                  {campaign.status !== 'ENDED' && (
                    <button
                      onClick={() => handleStatusChange(campaign, 'ENDED')}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-crm-bg text-crm-muted hover:text-red-500 border border-white/30 transition-colors"
                    >
                      End
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      fetchAnalytics(campaign.id);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-crm-primary hover:bg-crm-primary/10 transition-colors"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Modal */}
      {selectedCampaign && analytics && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-crm-surface border border-crm-border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-crm-border bg-crm-bg flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-crm-text">📊 Campaign Analytics</h2>
                <p className="text-[12px] text-crm-muted">{selectedCampaign.name}</p>
              </div>
              <button
                onClick={() => { setSelectedCampaign(null); setAnalytics(null); }}
                className="text-crm-muted hover:text-crm-text"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-crm-bg rounded-xl p-4 text-center border border-crm-border">
                  <div className="text-2xl font-black text-crm-text">{analytics.analytics.totalPlays}</div>
                  <div className="text-[10px] text-crm-muted font-bold uppercase">Total Plays</div>
                </div>
                <div className="bg-crm-bg rounded-xl p-4 text-center border border-crm-border">
                  <div className="text-2xl font-black text-emerald-600">{analytics.analytics.totalWins}</div>
                  <div className="text-[10px] text-crm-muted font-bold uppercase">Total Wins</div>
                </div>
                <div className="bg-crm-bg rounded-xl p-4 text-center border border-crm-border">
                  <div className="text-2xl font-black text-amber-600">{analytics.analytics.winRate}%</div>
                  <div className="text-[10px] text-crm-muted font-bold uppercase">Win Rate</div>
                </div>
                <div className="bg-crm-bg rounded-xl p-4 text-center border border-crm-border">
                  <div className="text-2xl font-black text-blue-600">{analytics.analytics.uniquePlayers}</div>
                  <div className="text-[10px] text-crm-muted font-bold uppercase">Unique Players</div>
                </div>
              </div>

              {/* Result Breakdown */}
              <div>
                <h3 className="font-bold text-crm-text mb-3">Result Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.analytics.resultBreakdown).map(([result, count]) => {
                    const percentage = analytics.analytics.totalPlays > 0
                      ? ((count as number) / analytics.analytics.totalPlays * 100).toFixed(1)
                      : '0';
                    return (
                      <div key={result} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-crm-text w-32 truncate">{result}</span>
                        <div className="flex-1 bg-crm-bg rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-crm-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-bold text-crm-muted w-16 text-right">
                          {count as number} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Plays */}
              <div>
                <h3 className="font-bold text-crm-text mb-3">Recent Plays</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-crm-bg sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-crm-muted">Time</th>
                        <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-crm-muted">Player</th>
                        <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-crm-muted">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.plays.slice(0, 50).map((play: any) => (
                        <tr key={play.id} className="border-t border-crm-border">
                          <td className="px-3 py-2 text-crm-muted text-[12px]">
                            {new Date(play.createdAt).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-crm-text font-medium text-[12px]">
                            {play.email || play.userId?.substring(0, 8) || 'Anonymous'}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              play.result === 'NO_WIN' || play.result === 'Try Again' || play.result === 'No Win'
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {play.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
