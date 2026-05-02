'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import MediaPicker from './MediaPicker';

export default function StaffProfileModalWrapper({ staff, shopId, children }: { staff: any, shopId?: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageUrl, setImageUrl] = useState(staff.imageUrl);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timeout = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleImageUpdate = async (newUrl: string) => {
    setImageUrl(newUrl);
    if (!shopId) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: newUrl })
      });
      if (!res.ok) throw new Error('Failed to update image');
      // Update the local staff object so the avatar outside the modal updates immediately if passed by reference (though nextjs router refresh is usually better)
      staff.imageUrl = newUrl;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      onClick={() => setIsOpen(false)}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div 
        className={`bg-crm-bg border border-crm-border shadow-sm rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transition-all duration-200 flex flex-col max-h-[90vh] ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">
          ✕
        </button>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center pt-2 pb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-crm-surface border-2 border-brand-gold mb-3 flex items-center justify-center shrink-0 relative group">
            {imageUrl ? (
              <img src={imageUrl} alt={staff.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-crm-muted">👤</span>
            )}
          </div>
          
          {shopId && (
            <div className="mb-4 w-full flex justify-center">
               <MediaPicker 
                 shopId={shopId} 
                 currentUrl={imageUrl} 
                 onSelect={handleImageUpdate} 
                 label={isSaving ? "Saving..." : "Edit Photo"} 
                 className="flex flex-col items-center gap-2"
               />
            </div>
          )}

          <h2 className="font-bold text-crm-primary mb-1 text-center text-xl">{staff.name || staff.email || 'Unnamed Staff'}</h2>
          <span className="text-[11px] bg-crm-primary/20 text-crm-accent px-3 py-1 rounded-full uppercase tracking-wider font-bold mb-6 hover:opacity-90">
            {staff.role?.replace('_', ' ')}
          </span>

          <div className="bg-crm-surface p-3 rounded-xl mb-6 shadow-sm">
            <QRCodeSVG value={staff.barcode || staff.id} size={120} level="H" />
            <p className="text-center text-crm-muted font-mono mt-2 tracking-wider text-[13px]">{staff.barcode || 'NO_CODE'}</p>
          </div>
          
          <div className="w-full space-y-4 text-[13px] bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center border-b border-crm-border pb-3">
              <span className="text-crm-muted font-medium">Email</span>
              <span className="text-crm-text font-medium truncate ml-4">{staff.email}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center border-b border-crm-border pb-3">
              <span className="text-crm-muted font-medium">Phone</span>
              <span className="text-crm-text font-medium">{staff.phone || 'Not provided'}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
              <span className="text-crm-muted font-medium">Manage Inventory</span>
              <span className="text-crm-text font-medium">{staff.canManageInventory ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-crm-border shrink-0 mt-auto">
          <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-crm-primary text-white rounded-xl hover:bg-status-pending transition-colors font-bold shadow-lg">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0">
        {children}
      </div>

      {isRendered && mounted && createPortal(modalContent, document.body)}
    </>
  );
}