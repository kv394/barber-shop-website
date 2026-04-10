'use client';

import { useState } from 'react';

export default function StaffProfileModalWrapper({ staff, children }: { staff: any, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0">
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              ✕
            </button>
            <div className="flex flex-col items-center pt-2">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-brand-gold mb-4 flex items-center justify-center shrink-0">
                {staff.imageUrl ? (
                  <img src={staff.imageUrl} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-1 text-center">{staff.name || staff.email || 'Unnamed Staff'}</h2>
              <span className="text-xs bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full uppercase tracking-wider font-bold mb-6">
                {staff.role?.replace('_', ' ')}
              </span>
              
              <div className="w-full space-y-4 text-sm bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400 font-medium">Email</span>
                  <span className="text-white font-medium truncate ml-4">{staff.email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400 font-medium">Phone</span>
                  <span className="text-white font-medium">{staff.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">Manage Inventory</span>
                  <span className="text-white font-medium">{staff.canManageInventory ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-brand-gold text-slate-900 rounded-xl hover:bg-yellow-400 transition-colors font-bold shadow-lg">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}