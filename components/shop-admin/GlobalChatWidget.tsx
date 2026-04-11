'use client';

import { useState, useEffect, useRef } from 'react';
import TeamChat from './TeamChat';

export default function GlobalChatWidget({ shopId, currentUserId, userRole }: { shopId: string, currentUserId: string, userRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastViewedRef = useRef<string | null>(null);

  // Initialize lastViewed on mount
  useEffect(() => {
    const stored = localStorage.getItem(`chat_last_viewed_${shopId}`);
    if (stored) {
      lastViewedRef.current = stored;
    }
  }, [shopId]);

  // Handle open state change
  useEffect(() => {
    if (isOpen) {
      // Mark as read
      setUnreadCount(0);
      const now = new Date().toISOString();
      lastViewedRef.current = now;
      localStorage.setItem(`chat_last_viewed_${shopId}`, now);
    }
  }, [isOpen, shopId]);

  // Poll for messages to check unread count
  useEffect(() => {
    let isMounted = true;
    
    const checkUnread = async () => {
      // Don't accumulate unread count if we're actively looking at the chat
      if (isOpen) return;

      try {
        const res = await fetch(`/api/shops/${shopId}/chat`);
        if (res.ok && isMounted) {
          const messages = await res.json();
          if (messages.length > 0) {
            const lastViewed = lastViewedRef.current;
            if (!lastViewed) {
              setUnreadCount(messages.length);
            } else {
              const lastViewedDate = new Date(lastViewed);
              const unread = messages.filter((m: any) => new Date(m.createdAt) > lastViewedDate && m.sender.id !== currentUserId);
              setUnreadCount(unread.length);
            }
          }
        }
      } catch (err) {
        // Silent fail on polling
      }
    };

    checkUnread();
    const intervalId = setInterval(checkUnread, 5000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [shopId, isOpen, currentUserId]);

  // Only allow STAFF, SHOP_ADMIN, SUPER_ADMIN to see the chat
  if (userRole !== 'STAFF' && userRole !== 'SHOP_ADMIN' && userRole !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-botanical-primary text-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all z-[90]"
        title="Team Chat"
      >
        💬
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-botanical-text text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Popover */}
      {isOpen && (
        <div className="fixed bottom-0 sm:bottom-28 right-0 sm:right-8 w-full sm:w-[400px] h-[80dvh] sm:h-[600px] max-h-screen z-[100]">
          <div className="relative h-full w-full shadow-2xl">
            {/* Close button layered over the chat header */}
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-4 text-botanical-muted hover:text-botanical-text z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
                ✕
            </button>
            <TeamChat shopId={shopId} currentUserId={currentUserId} />
          </div>
        </div>
      )}
      
      {/* Mobile overlay */}
      {isOpen && (
         <div className="fixed inset-0 bg-botanical-surface z-[95] sm:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
