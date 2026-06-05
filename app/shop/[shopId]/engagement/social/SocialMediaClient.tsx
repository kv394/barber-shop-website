'use client';;
import Image from 'next/image';

import { useState } from 'react';

export default function SocialMediaClient({ shopId, shopName, shopLocation, initialImages, initialTokens }: any) {
  const [tokens, setTokens] = useState(initialTokens);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateCaption = async (imageId: string, imageUrl: string) => {
    if (tokens < 1) {
      setError('You do not have enough AI tokens to generate a caption.');
      return;
    }

    setLoadingId(imageId);
    setError(null);

    try {
      const res = await fetch(`/api/shops/${shopId}/marketing/social/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, imageUrl, shopName, shopLocation })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate caption');
      }

      setGeneratedContent(prev => ({ ...prev, [imageId]: data.caption }));
      setTokens(data.remainingTokens);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-crm-surface border border-crm-border p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-crm-text flex items-center gap-2">
            ✨ AI Social Media Manager
          </h2>
          <p className="text-crm-muted text-[13px] mt-1">
            Turn your portfolio images into highly engaging Instagram and TikTok posts in one click.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold text-crm-muted uppercase tracking-wider">Available AI Tokens</div>
          <div className="text-3xl font-black text-brand-indigo">{tokens}</div>
        </div>
      </div>
      {error && (
        <div className="p-4 bg-status-cancelled/20 border border-status-cancelled/30 text-status-cancelled rounded-xl font-medium">
          {error}
        </div>
      )}
      {initialImages.length === 0 ? (
        <div className="text-center py-12 bg-crm-surface border border-crm-border rounded-xl">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-bold text-crm-text">No Portfolio Images Found</h3>
          <p className="text-crm-muted mt-2">Upload images to your portfolio first to generate social media posts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialImages.map((image: any) => (
            <div key={image.id} className="bg-crm-surface border border-crm-border rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="aspect-[4/5] relative bg-black">
                <Image src={image.imageUrl} alt={image.caption || 'Portfolio Image'} />
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[11px] font-bold text-crm-muted uppercase tracking-wider">Stylist</div>
                    <div className="text-sm font-semibold text-crm-text">{image.staff?.name || 'Unknown'}</div>
                  </div>
                  {image.caption && (
                    <div className="text-[11px] bg-crm-bg px-2 py-1 rounded text-crm-muted max-w-[120px] truncate">
                      "{image.caption}"
                    </div>
                  )}
                </div>

                {generatedContent[image.id] ? (
                  <div className="mt-auto space-y-3">
                    <div className="p-3 bg-brand-indigo/10 border border-brand-indigo/20 rounded-lg text-sm text-crm-text whitespace-pre-wrap">
                      {generatedContent[image.id]}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(image.id, generatedContent[image.id])}
                        className="flex-1 py-2 bg-crm-primary text-white rounded-lg font-bold text-sm hover:bg-crm-primary/90 transition-colors"
                      >
                        {copiedId === image.id ? '✓ Copied!' : 'Copy Caption'}
                      </button>
                      <a 
                        href={image.imageUrl} 
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-crm-bg border border-crm-border text-crm-text rounded-lg font-bold text-sm hover:bg-crm-border transition-colors flex items-center justify-center"
                      >
                        ↓ Image
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => generateCaption(image.id, image.imageUrl)}
                    disabled={loadingId === image.id}
                    className="mt-auto w-full py-3 bg-crm-bg border border-crm-border hover:border-brand-indigo/50 hover:bg-brand-indigo/5 text-crm-text font-bold text-sm rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {loadingId === image.id ? (
                      <span className="animate-pulse">Generating Magic... ✨</span>
                    ) : (
                      <>Generate Post ✨ <span className="text-[10px] bg-brand-indigo/20 text-brand-indigo px-1.5 py-0.5 rounded ml-1">-1 Token</span></>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
