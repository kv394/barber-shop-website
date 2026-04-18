'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';

export default function StaffProfileModalWrapper({ staff, children }: { staff: any, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      onClick={() => setIsOpen(false)}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div 
        className={`bg-crm-bg border border-crm-border shadow-sm rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-crm-muted hover:text-crm-text w-8 h-8 flex items-center justify-center rounded-full hover:bg-crm-border transition-colors">
          ✕
        </button>
        <div className="flex flex-col items-center pt-2">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-crm-surface border-2 border-brand-gold mb-4 flex items-center justify-center shrink-0">
            {staff.imageUrl ? (
              <img src={staff.imageUrl} alt={staff.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h2 className="font-bold text-crm-text mb-1 text-center text-3xl md:text-4xl">{staff.name || staff.email || 'Unnamed Staff'}</h2>
          <span className="text-xs bg-crm-primary/20 text-crm-accent px-3 py-1 rounded-full uppercase tracking-wider font-bold mb-6 hover:opacity-90">
            {staff.role?.replace('_', ' ')}
          </span>

          <div className="bg-crm-surface p-3 rounded-xl mb-6 shadow-sm">
            <QRCodeSVG value={staff.barcode || staff.id} size={120} level="H" />
            <p className="text-center text-crm-muted font-mono mt-2 tracking-wider text-base md:text-lg">{staff.barcode || 'NO_CODE'}</p>
          </div>
          
          <div className="w-full space-y-4 text-sm bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm">
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
        
        <div className="mt-6">
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