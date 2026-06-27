'use client';

import { useState, useEffect } from 'react';
import SpinWheel from './SpinWheel';
import ScratchCard from './ScratchCard';
import PrizeDraw from './PrizeDraw';

interface GamePopupProps {
  shopId: string;
  primaryColor?: string;
  onClose: () => void;
}

export default function GamePopup({ shopId, primaryColor = '#f59e0b', onClose }: GamePopupProps) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(`/api/shops/${shopId}/gamification/active`);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [shopId]);

  const activeCampaign = campaigns[activeCampaignIndex];

  const handleSpin = async () => {
    const res = await fetch(`/api/shops/${shopId}/gamification/${activeCampaign.id}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to play');
    }

    return res.json();
  };

  const handleScratch = handleSpin; // Same play endpoint

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <div>
              <h2 className="font-black text-lg tracking-tight">Play & Win!</h2>
              <p className="text-white/70 text-xs font-medium">Try your luck for exclusive rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Campaign tabs */}
        {campaigns.length > 1 && (
          <div className="flex border-b border-gray-100 px-2">
            {campaigns.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveCampaignIndex(i)}
                className={`flex-1 px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                  i === activeCampaignIndex
                    ? 'border-b-2 text-gray-800'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                style={i === activeCampaignIndex ? { borderColor: primaryColor, color: primaryColor } : {}}
              >
                {c.type === 'SPIN_WHEEL' ? '🎡' : c.type === 'SCRATCH_CARD' ? '🎫' : '🏆'}{' '}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="animate-spin h-10 w-10 mb-4" style={{ color: primaryColor }} viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-400 font-medium">Loading games...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">No Active Games</h3>
              <p className="text-gray-400 text-sm">Check back later for exciting games and prizes!</p>
            </div>
          ) : activeCampaign ? (
            <div>
              {activeCampaign.type === 'SPIN_WHEEL' && (
                <SpinWheel
                  prizes={activeCampaign.config?.prizes || []}
                  onSpin={handleSpin}
                  primaryColor={primaryColor}
                />
              )}
              {activeCampaign.type === 'SCRATCH_CARD' && (
                <ScratchCard
                  onScratch={handleScratch}
                  primaryColor={primaryColor}
                />
              )}
              {activeCampaign.type === 'PRIZE_DRAW' && (
                <PrizeDraw
                  campaign={activeCampaign}
                  shopId={shopId}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
