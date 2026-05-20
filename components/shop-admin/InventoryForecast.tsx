'use client';

import { useState, useEffect } from 'react';

interface ForecastInsight {
  productName: string;
  urgency: 'critical' | 'warning' | 'info';
  prediction: string;
  recommendation: string;
  estimatedDaysRemaining: number;
  icon: string;
}

const URGENCY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
  },
};

export default function InventoryForecast({ shopId }: { shopId: string }) {
  const [insights, setInsights] = useState<ForecastInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/products/forecast`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load forecast');
      setInsights(data.insights || []);
      setGeneratedAt(data.generatedAt || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForecast(); }, [shopId]);

  if (loading) {
    return (
      <div className="mb-6 p-5 rounded-xl border border-crm-border bg-crm-surface">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🔮</span>
          <span className="font-bold text-crm-text text-[13px]">AI Inventory Forecast</span>
          <span className="ml-auto inline-block w-3.5 h-3.5 border-2 border-crm-muted/30 border-t-crm-muted rounded-full animate-spin" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border border-crm-border p-3 animate-pulse">
              <div className="h-3 bg-crm-border rounded w-1/3 mb-2" />
              <div className="h-3 bg-crm-border rounded w-2/3 mb-1" />
              <div className="h-3 bg-crm-border rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-700 text-[13px]">
          <span>⚠️</span>
          <span className="font-bold">Forecast unavailable</span>
          <button
            onClick={fetchForecast}
            className="ml-auto text-[11px] underline hover:no-underline"
          >
            Retry
          </button>
        </div>
        <p className="text-red-600 text-[11px] mt-1">{error}</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return null; // No insights = no card
  }

  return (
    <div className="mb-6 p-5 rounded-xl border border-crm-border bg-crm-surface">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">🔮</span>
        <span className="font-bold text-crm-text text-[14px]">AI Inventory Forecast</span>
        <span className="text-[10px] font-normal text-crm-muted bg-crm-surface px-2 py-0.5 rounded-full border border-crm-border">
          Gemini
        </span>
        <div className="ml-auto flex items-center gap-2">
          {generatedAt && (
            <span className="text-crm-muted text-[10px]">
              {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchForecast}
            disabled={loading}
            className="text-crm-muted hover:text-crm-text transition-colors text-[12px] p-1 rounded hover:bg-crm-surface"
            title="Refresh forecast"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="space-y-2.5">
        {insights.map((insight, i) => {
          const styles = URGENCY_STYLES[insight.urgency] || URGENCY_STYLES.info;
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${styles.bg} ${styles.border} transition-all`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-0.5 shrink-0">{insight.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`font-bold text-[13px] ${styles.text}`}>
                      {insight.productName}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${styles.badge}`}>
                      {insight.urgency}
                    </span>
                    {insight.estimatedDaysRemaining > 0 && insight.estimatedDaysRemaining < 999 && (
                      <span className="text-[10px] text-crm-muted font-mono ml-auto">
                        ~{insight.estimatedDaysRemaining}d left
                      </span>
                    )}
                  </div>
                  <p className={`text-[12px] ${styles.text} leading-relaxed`}>
                    {insight.prediction}
                  </p>
                  <p className="text-[11px] text-crm-muted mt-1 leading-relaxed">
                    💡 {insight.recommendation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
