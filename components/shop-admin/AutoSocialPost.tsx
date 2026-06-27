'use client';

import { useState } from 'react';

interface AutoSocialPostProps {
  shopId: string;
  shopName: string;
  shopLocation: string;
  imageId: string;
  imageUrl: string;
  onClose: () => void;
}

/**
 * Toast/Modal shown after a portfolio image upload when AI Social Media is enabled.
 * Auto-generates an Instagram caption and offers one-click copy.
 */
export default function AutoSocialPost({ shopId, shopName, shopLocation, imageId, imageUrl, onClose }: AutoSocialPostProps) {
  const [caption, setCaption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const generateCaption = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/shops/${shopId}/marketing/social/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, imageUrl, shopName, shopLocation }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate caption');

      setCaption(data.caption);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <div className="font-black text-sm">AI Social Media</div>
            <div className="text-white/70 text-[10px] font-medium">Auto-generate an Instagram post</div>
          </div>
        </div>
        <button
          onClick={() => { setDismissed(true); onClose(); }}
          className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {!caption && !loading && !error && (
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              📸 New photo uploaded! Want AI to generate an Instagram caption?
            </p>
            <button
              onClick={generateCaption}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg"
            >
              Generate Caption ✨
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-purple-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 text-sm font-medium">Analyzing your photo...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-2">
            <p className="text-red-500 text-sm font-medium mb-3">{error}</p>
            <button
              onClick={generateCaption}
              className="text-purple-500 font-bold text-sm hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {caption && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{caption}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2 rounded-xl bg-crm-primary text-white font-black text-[11px] uppercase tracking-widest hover:bg-crm-primary/90 transition-all"
              >
                {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <button
                onClick={() => { setDismissed(true); onClose(); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-400 font-bold text-[11px] uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
