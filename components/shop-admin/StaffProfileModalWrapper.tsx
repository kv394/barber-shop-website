'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function StaffProfileModalWrapper({ staff, children }: { staff: any, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0">
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-botanical-surface backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-botanical-bg border border-botanical-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-botanical-muted hover:text-botanical-text w-8 h-8 flex items-center justify-center rounded-full hover:bg-botanical-border transition-colors">
              ✕
            </button>
            <div className="flex flex-col items-center pt-2">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-botanical-surface border-2 border-brand-gold mb-4 flex items-center justify-center shrink-0">
                {staff.imageUrl ? (
                  <img src={staff.imageUrl} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-botanical-text mb-1 text-center">{staff.name || staff.email || 'Unnamed Staff'}</h2>
              <span className="text-xs bg-botanical-primary/20 text-botanical-accent px-3 py-1 rounded-full uppercase tracking-wider font-bold mb-6">
                {staff.role?.replace('_', ' ')}
              </span>

              <div className="bg-white p-3 rounded-xl mb-6 shadow-sm">
                <QRCodeSVG value={staff.barcode || staff.id} size={120} level="H" />
                <p className="text-center text-[10px] text-botanical-muted font-mono mt-2 tracking-wider">{staff.barcode || 'NO_CODE'}</p>
              </div>
              
              <div className="w-full space-y-4 text-sm bg-botanical-surface p-4 rounded-xl border border-botanical-border">
                <div className="flex justify-between items-center border-b border-botanical-border pb-3">
                  <span className="text-botanical-muted font-medium">Email</span>
                  <span className="text-botanical-text font-medium truncate ml-4">{staff.email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-botanical-border pb-3">
                  <span className="text-botanical-muted font-medium">Phone</span>
                  <span className="text-botanical-text font-medium">{staff.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-botanical-muted font-medium">Manage Inventory</span>
                  <span className="text-botanical-text font-medium">{staff.canManageInventory ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-botanical-primary text-white rounded-xl hover:bg-yellow-400 transition-colors font-bold shadow-lg">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}