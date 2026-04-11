'use client';
import { useEffect, useState } from 'react';

export default function PortfolioManager({ shopId, currentUserId, userRole }: { shopId: string, currentUserId: string, userRole: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState(currentUserId);

  const loadImages = (targetStaffId: string) => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/portfolio?staffId=${targetStaffId}`)
      .then(r => r.json())
      .then(d => setImages(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  const loadStaffList = () => {
    fetch(`/api/shops/${shopId}/staff`)
      .then(r => r.json())
      .then(d => setStaffList(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    if (userRole === 'SHOP_ADMIN' || userRole === 'SUPER_ADMIN') {
      loadStaffList();
    }
    loadImages(selectedStaffId);
  }, [shopId, selectedStaffId, userRole]);

  const addImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setSaving(true);
    await fetch(`/api/shops/${shopId}/portfolio`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, caption, staffId: selectedStaffId }),
    });
    setImageUrl('');
    setCaption('');
    setMsg('Image added to portfolio!');
    await loadImages(selectedStaffId);
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const removeImage = async (id: string) => {
    if (!confirm('Remove this image from portfolio?')) return;
    await fetch(`/api/shops/${shopId}/portfolio/${id}`, { method: 'DELETE' });
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="bg-botanical-surface border border-botanical-border rounded-xl p-6">
      <h3 className="text-lg font-bold text-botanical-text mb-2">📸 Staff Portfolio</h3>
      <p className="text-sm text-botanical-muted mb-6">
        Upload photos of your best work (fade, nail art, coloring, etc.). Clients can view these when booking.
      </p>

      {/* Admin Staff Selector */}
      {(userRole === 'SHOP_ADMIN' || userRole === 'SUPER_ADMIN') && staffList.length > 0 && (
        <div className="mb-6 p-4 bg-botanical-surface rounded-lg border border-botanical-border">
          <label className="block text-xs text-botanical-muted mb-2 uppercase tracking-wider">Select Staff Member Portfolio</label>
          <select 
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full bg-botanical-surface border border-botanical-border rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold"
          >
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>
      )}

      {msg && <div className="mb-4 p-2 bg-green-900/30 border border-green-500/30 text-green-300 rounded text-sm">{msg}</div>}

      <form onSubmit={addImage} className="mb-8 p-4 bg-botanical-bg/50 rounded-lg border border-botanical-border space-y-4">
        <h4 className="text-sm font-semibold text-botanical-text">Add New Photo</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-botanical-muted mb-1">Image URL</label>
            <input 
              type="url" 
              value={imageUrl} 
              onChange={e => setImageUrl(e.target.value)} 
              placeholder="e.g. https://example.com/image.jpg" 
              className="w-full bg-botanical-surface border border-botanical-border rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs text-botanical-muted mb-1">Caption (Optional)</label>
            <input 
              type="text" 
              value={caption} 
              onChange={e => setCaption(e.target.value)} 
              placeholder="e.g. Balayage & Cut" 
              className="w-full bg-botanical-surface border border-botanical-border rounded px-3 py-2 text-botanical-text text-sm focus:outline-none focus:border-brand-gold" 
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={saving || !imageUrl.trim()} 
          className="px-4 py-2 bg-botanical-primary text-white rounded text-sm font-bold hover:bg-white transition disabled:opacity-50"
        >
          {saving ? 'Uploading...' : 'Add to Portfolio'}
        </button>
      </form>

      {loading ? (
        <div className="animate-pulse text-botanical-muted py-4">Loading portfolio...</div>
      ) : images.length === 0 ? (
        <p className="text-botanical-muted text-sm text-center py-8 border border-dashed border-botanical-border rounded-lg">No photos in portfolio yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-botanical-border aspect-square bg-botanical-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt={img.caption || 'Portfolio image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-botanical-surface opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="text-right">
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="bg-red-500/80 hover:bg-red-500 text-botanical-text w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg backdrop-blur-md"
                  >
                    ✕
                  </button>
                </div>
                {img.caption && (
                  <p className="text-xs text-botanical-text font-medium truncate">{img.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
