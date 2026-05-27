'use client';

import { useState, useRef } from 'react';

interface Analysis {
 faceShape: string;
 hairType: string;
 hairTexture: string;
 currentLength: string;
 notes: string;
}

interface Recommendation {
 styleName: string;
 description: string;
 portfolioImageUrl: string | null;
 portfolioCaption: string | null;
 artistName: string | null;
 confidence: string;
}

interface StyleResult {
 analysis: Analysis;
 recommendations: Recommendation[];
 shopName: string;
}

export default function StyleDiscovery({ shopId, themeColor }: { shopId: string; themeColor?: string }) {
 const [isOpen, setIsOpen] = useState(false);
 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [imageBase64, setImageBase64] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [result, setResult] = useState<StyleResult | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 if (!file.type.startsWith('image/')) {
 setError('Please select an image file.');
 return;
 }

 if (file.size > 5 * 1024 * 1024) {
 setError('Image must be under 5MB.');
 return;
 }

 setError(null);
 setResult(null);

 const reader = new FileReader();
 reader.onload = () => {
 const dataUrl = reader.result as string;
 setImagePreview(dataUrl);
 setImageBase64(dataUrl.split(',')[1]);
 };
 reader.readAsDataURL(file);
 };

 const handleAnalyze = async () => {
 if (!imageBase64) return;
 setLoading(true);
 setError(null);
 try {
 const res = await fetch(`/api/shops/${shopId}/style-discovery`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ imageBase64 }),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Analysis failed');
 setResult(data);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const handleReset = () => {
 setImagePreview(null);
 setImageBase64(null);
 setResult(null);
 setError(null);
 if (fileInputRef.current) fileInputRef.current.value = '';
 };

 const btnColor = themeColor || '#111827';

 if (!isOpen) {
 return (
 <button
 onClick={() => setIsOpen(true)}
 className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-crm-border hover:border-gray-400 text-crm-muted hover:text-crm-text transition-all text-sm font-medium group"
 >
 <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
 Find Your Perfect Style with AI
 </button>
 );
 }

 return (
 <div className="rounded-xl border border-crm-border bg-crm-surface overflow-hidden shadow-sm">
 {/* Header */}
 <div className="p-4 border-b border-crm-border flex items-center justify-between" style={{ backgroundColor: `${btnColor}08` }}>
 <div className="flex items-center gap-2">
 <span className="text-lg">✨</span>
 <h3 className="font-bold text-crm-text text-sm">Style Discovery</h3>
 <span className="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">AI</span>
 </div>
 <button onClick={() => { setIsOpen(false); handleReset(); }} className="text-gray-400 hover:text-crm-muted text-sm">✕</button>
 </div>

 <div className="p-4">
 {/* Upload Section */}
 {!result && (
 <div className="space-y-4">
 {!imagePreview ? (
 <div
 onClick={() => fileInputRef.current?.click()}
 className="border-2 border-dashed border-crm-border rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-crm-bg transition-all"
 >
 <div className="text-4xl mb-2 opacity-60">📸</div>
 <p className="font-medium text-crm-muted text-sm">Upload a selfie</p>
 <p className="text-gray-400 text-xs mt-1">We&apos;ll analyze your face shape &amp; hair type</p>
 </div>
 ) : (
 <div className="flex items-start gap-4">
 <img
 src={imagePreview}
 alt="Your selfie"
 className="w-24 h-24 rounded-xl object-cover border border-crm-border"
 />
 <div className="flex-1">
 <p className="text-sm font-medium text-crm-muted mb-2">Ready to analyze!</p>
 <p className="text-xs text-gray-400 mb-3">Our AI will suggest styles based on your features.</p>
 <div className="flex gap-2">
 <button
 onClick={handleAnalyze}
 disabled={loading}
 className="text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
 style={{ backgroundColor: btnColor }}
 >
 {loading ? (
 <>
 <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 Analyzing...
 </>
 ) : '✨ Analyze My Style'}
 </button>
 <button
 onClick={handleReset}
 disabled={loading}
 className="text-crm-muted text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
 >
 Change
 </button>
 </div>
 </div>
 </div>
 )}

 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 capture="user"
 onChange={handleImageSelect}
 className="hidden"
 />

 {error && (
 <p className="text-red-600 text-xs bg-red-50 rounded-lg p-3 border border-red-100">{error}</p>
 )}
 </div>
 )}

 {/* Results Section */}
 {result && (
 <div className="space-y-4">
 {/* Face Analysis */}
 <div className="bg-crm-bg rounded-xl p-4 border border-crm-border">
 <h4 className="font-bold text-crm-text text-xs uppercase tracking-wider mb-3">Your Profile</h4>
 <div className="grid grid-cols-2 gap-2 text-xs">
 <div className="flex justify-between">
 <span className="text-crm-muted">Face Shape</span>
 <span className="font-medium text-crm-text capitalize">{result.analysis.faceShape}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-crm-muted">Hair Type</span>
 <span className="font-medium text-crm-text capitalize">{result.analysis.hairType}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-crm-muted">Texture</span>
 <span className="font-medium text-crm-text capitalize">{result.analysis.hairTexture}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-crm-muted">Length</span>
 <span className="font-medium text-crm-text capitalize">{result.analysis.currentLength}</span>
 </div>
 </div>
 {result.analysis.notes && (
 <p className="text-[11px] text-crm-muted mt-2 italic">{result.analysis.notes}</p>
 )}
 </div>

 {/* Recommendations */}
 <div>
 <h4 className="font-bold text-crm-text text-xs uppercase tracking-wider mb-3">Recommended Styles</h4>
 <div className="space-y-3">
 {result.recommendations.map((rec, i) => (
 <div
 key={i}
 className={`rounded-xl border p-3 transition-all ${i === 0 ? 'border-crm-border bg-crm-surface shadow-sm' : 'border-crm-border bg-crm-bg'}`}
 >
 <div className="flex items-start gap-3">
 {rec.portfolioImageUrl && (
 <img
 src={rec.portfolioImageUrl}
 alt={rec.styleName}
 className="w-16 h-16 rounded-lg object-cover border border-crm-border shrink-0"
 />
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="font-bold text-crm-text text-sm">{rec.styleName}</span>
 {i === 0 && (
 <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
 ⭐ Best Match
 </span>
 )}
 </div>
 <p className="text-xs text-crm-muted leading-relaxed">{rec.description}</p>
 {rec.artistName && (
 <p className="text-[10px] text-gray-400 mt-1">By {rec.artistName}</p>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-2 pt-2">
 <button
 onClick={handleReset}
 className="flex-1 text-crm-muted text-sm font-medium py-2.5 rounded-xl border border-crm-border hover:bg-crm-bg transition-colors"
 >
 Try Another Photo
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
