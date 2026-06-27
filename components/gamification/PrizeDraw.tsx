'use client';

import { useState, useEffect } from 'react';

interface PrizeDrawProps {
  campaign: {
    id: string;
    name: string;
    endDate?: string;
    totalPlays: number;
    config: {
      prizes: { label: string; value: string }[];
      drawDate?: string;
      description?: string;
    };
  };
  shopId: string;
  primaryColor?: string;
  disabled?: boolean;
}

export default function PrizeDraw({ campaign, shopId, primaryColor = '#f59e0b', disabled }: PrizeDrawProps) {
  const [email, setEmail] = useState('');
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const drawDate = campaign.config.drawDate || campaign.endDate;

  // Countdown timer
  useEffect(() => {
    if (!drawDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(drawDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [drawDate]);

  const handleEnter = async () => {
    if (!email || disabled) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/shops/${shopId}/gamification/${campaign.id}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setError('You have already entered this draw!');
        } else {
          setError(data.error || 'Failed to enter');
        }
        return;
      }

      setEntered(true);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const prizes = campaign.config.prizes || [];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div
        className="rounded-t-2xl p-6 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
      >
        <div className="text-4xl mb-3">🏆</div>
        <h3 className="text-2xl font-black mb-1">{campaign.name}</h3>
        {campaign.config.description && (
          <p className="text-white/80 text-sm">{campaign.config.description}</p>
        )}
      </div>

      {/* Body */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 shadow-xl">
        {/* Countdown */}
        {drawDate && (
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center mb-3">Draw In</p>
            <div className="flex justify-center gap-3">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hrs', value: countdown.hours },
                { label: 'Min', value: countdown.minutes },
                { label: 'Sec', value: countdown.seconds },
              ].map((unit) => (
                <div key={unit.label} className="text-center">
                  <div
                    className="text-2xl font-black w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                  >
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prizes */}
        {prizes.length > 0 && (
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Prizes</p>
            <div className="space-y-2">
              {prizes.filter(p => p.value !== 'NO_WIN').map((prize, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                  <span className="text-lg">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎁'}
                  </span>
                  <span className="font-bold text-gray-800 text-sm">{prize.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entry count */}
        <div className="p-4 border-b border-gray-100 text-center">
          <span className="text-3xl font-black" style={{ color: primaryColor }}>
            {campaign.totalPlays}
          </span>
          <span className="text-sm text-gray-400 font-medium block">entries so far</span>
        </div>

        {/* Entry Form / Success */}
        <div className="p-6">
          {entered ? (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="text-4xl mb-3">✅</div>
              <h4 className="text-lg font-black text-gray-800 mb-1">You&apos;re Entered!</h4>
              <p className="text-sm text-gray-500">
                We&apos;ll notify you at <strong>{email}</strong> if you win.
              </p>
            </div>
          ) : disabled ? (
            <div className="text-center">
              <p className="text-gray-400 font-medium">You&apos;ve already entered this draw!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email to participate"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 transition-shadow bg-gray-50"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}
              <button
                onClick={handleEnter}
                disabled={loading || !email}
                className="w-full py-3 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                  boxShadow: `0 4px 20px ${primaryColor}40`,
                }}
              >
                {loading ? 'Entering...' : 'Enter to Win 🎯'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
