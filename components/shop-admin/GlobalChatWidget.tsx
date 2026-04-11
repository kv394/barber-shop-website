'use client';

import { useState } from 'react';
import TeamChat from './TeamChat';

export default function GlobalChatWidget({ shopId, currentUserId, userRole }: { shopId: string, currentUserId: string, userRole: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Only allow STAFF, SHOP_ADMIN, SUPER_ADMIN to see the chat
  if (userRole !== 'STAFF' && userRole !== 'SHOP_ADMIN' && userRole !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-brand-gold text-slate-900 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all z-[90]"
        title="Team Chat"
      >
        💬
      </button>

      {/* Chat Popover */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-28 right-0 sm:right-8 w-full sm:w-[400px] h-[80dvh] sm:h-[600px] max-h-screen z-[100]">
          <div className="relative h-full w-full shadow-2xl">
            {/* Close button layered over the chat header */}
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-4 text-slate-500 hover:text-slate-800 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
                ✕
            </button>
            <TeamChat shopId={shopId} currentUserId={currentUserId} />
          </div>
        </div>
      )}
      
      {/* Mobile overlay */}
      {isOpen && (
         <div className="fixed inset-0 bg-black/60 z-[95] sm:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
