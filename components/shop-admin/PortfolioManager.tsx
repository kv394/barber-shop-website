'use client';
import { useEffect, useState, useRef } from 'react';

export default function PortfolioManager({ shopId, currentUserId, userRole }: { shopId: string, currentUserId: string, userRole: string }) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState(currentUserId);

  const loadImages = (targetStaffId: string) => {
    setLoading(true);
    fetch(`/api/shops/${shopId}/portfolio?staffId=${targetStaffId}&t=${Date.now()}`)
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
    if (userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN') {
      loadStaffList();
    }
    loadImages(selectedStaffId);
  }, [shopId, selectedStaffId, userRole]);

  const addImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/portfolio`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, caption, staffId: selectedStaffId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add image');
      }
      setImageUrl('');
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setMsg('Image added to portfolio!');
      await loadImages(selectedStaffId);
    } catch (e: any) {
      alert('Error adding to portfolio: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const removeImage = async (id: string) => {
    if (!confirm('Remove this image from portfolio?')) return;
    await fetch(`/api/shops/${shopId}/portfolio/${id}`, { method: 'DELETE' });
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="bg-crm-surface border border-crm-border shadow-sm rounded-xl p-6">
      <h3 className="font-bold text-crm-text mb-2 text-lg font-bold">📸 Staff Portfolio</h3>
      <p className="text-crm-muted mb-6 text-[13px]">
        Upload photos of your best work (fade, nail art, coloring, etc.). Clients can view these when booking.
      </p>

      {/* Admin Staff Selector */}
      {(userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN') && staffList.length > 0 && (
        <div className="mb-6 p-4 bg-crm-surface rounded-lg border border-crm-border shadow-sm">
          <label className="block text-crm-muted mb-2 uppercase tracking-wider text-[13px]">Select Staff Member Portfolio</label>
          <select 
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold"
          >
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>
      )}

      {msg && <div className="mb-4 p-2 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded text-[13px]">{msg}</div>}

      <form onSubmit={addImage} className="mb-8 p-4 bg-crm-bg/50 rounded-lg border border-crm-border shadow-sm space-y-4">
        <h4 className="font-semibold text-crm-text text-base font-semibold">Add New Photo</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="flex flex-col">
            <label className="block text-crm-muted mb-1 text-[13px]">Image File or URL</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="e.g. https://..."
                className="flex-1 w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold min-w-0"
              />
              <span className="text-crm-muted py-1 sm:py-2 text-[13px] text-center">OR</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('type', 'portfolio');

                    const res = await fetch(`/api/shops/${shopId}/upload`, {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.error) throw new Error(data.error);
                    setImageUrl(data.url);
                  } catch (err: any) {
                    alert('Upload failed: ' + err.message);
                  } finally {
                    setUploading(false);
                  }
                }}
                ref={fileInputRef}
                className="flex-1 w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-[13px] file:bg-crm-primary/20 file:text-crm-primary hover:file:bg-crm-primary/30 hover:opacity-90 min-w-0"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-crm-muted mb-1 text-[13px]">Caption (Optional)</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="e.g. Balayage & Cut"
              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold min-w-0"
            />
          </div>
        </div>
        <div className="mt-4 pt-2">
          <button 
            type="submit" 
            disabled={saving || uploading || !imageUrl.trim()} 
            className="px-4 py-2 bg-crm-primary text-white rounded text-[13px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50"
          >
            {uploading ? 'Uploading Image...' : saving ? 'Adding...' : 'Add to Portfolio'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="animate-pulse text-crm-muted py-4">Loading portfolio...</div>
      ) : images.length === 0 ? (
        <p className="text-crm-muted text-center py-8 border border-dashed border-crm-border rounded-lg text-[13px]">No photos in portfolio yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-crm-border shadow-sm aspect-square bg-crm-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt={img.caption || 'Portfolio image'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-crm-surface opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="text-right">
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="bg-status-cancelled/80 hover:bg-status-cancelled text-crm-text w-8 h-8 rounded-full flex items-center justify-center text-[11px] shadow-lg backdrop-blur-md"
                  >
                    ✕
                  </button>
                </div>
                {img.caption && (
                  <p className="text-crm-text font-medium truncate text-[13px]">{img.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
