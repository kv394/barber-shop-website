import Image from 'next/image';
import React from 'react';

export function ClientGalleryTab({
  client,
  newImageUrl,
  setNewImageUrl,
  savingImage,
  setSavingImage,
  saveImage,
  shopId
}: any) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-crm-bg p-3 rounded-lg border border-crm-border shadow-sm">
        <input 
          type="url" 
          value={newImageUrl} 
          onChange={e => setNewImageUrl(e.target.value)} 
          placeholder="Image URL (e.g. https://...)" 
          className="flex-1 w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-[13px] text-crm-text focus:border-brand-indigo" 
        />
        <span className="text-crm-muted text-[11px] mx-2">OR</span>
        <input 
          type="file" 
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setSavingImage(true);
            try {
              const fd = new FormData();
              fd.append('file', file);
              fd.append('type', 'client-history');
              const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
              const data = await res.json();
              if (data.error) throw new Error(data.error);
              setNewImageUrl(data.url);
            } catch (err: any) {
              alert('Upload failed: ' + err.message);
            } finally {
              setSavingImage(false);
            }
          }} 
          className="flex-1 w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-1.5 text-crm-text text-[13px] focus:outline-none focus:border-brand-indigo file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:bg-crm-primary/20 file:text-crm-primary hover:file:bg-crm-primary/30 hover:opacity-90" 
        />
        <button 
          onClick={saveImage} 
          disabled={savingImage || !newImageUrl.trim()} 
          className="w-full sm:w-auto bg-crm-primary text-white px-4 py-2 rounded text-[11px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50"
        >
          {savingImage ? 'Adding...' : 'Add Photo'}
        </button>
      </div>
      {client.clientHistoryImages?.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {client.clientHistoryImages.map((img: any) => (
            <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-crm-border shadow-sm group bg-crm-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image src={img.imageUrl} alt="Client history" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                <p className="text-crm-text text-[13px] text-white">{new Date(img.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-crm-muted italic text-[13px]">No photos uploaded yet.</p>}
    </div>
  );
}
