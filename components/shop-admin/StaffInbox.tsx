'use client';

import { useState, useEffect } from 'react';

interface InboxItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function StaffInbox({ shopId, userId }: { shopId: string, userId: string }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, [shopId, userId]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/staff/inbox?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-botanical-muted text-sm animate-pulse">Loading inbox...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-botanical-surface p-6 rounded-xl border-2 border-b-[6px] border-botanical-border text-center">
        <span className="text-3xl mb-2 block">📭</span>
        <p className="text-botanical-muted text-sm">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-botanical-bg/80 backdrop-blur-xl rounded-2xl shadow-lg border-2 border-b-[6px] border-botanical-border overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-botanical-border flex items-center justify-between">
        <h3 className="text-botanical-text text-lg font-bold flex items-center gap-2">
          <span>🔔</span> My Notifications
        </h3>
        <span className="bg-botanical-primary text-white text-xs font-bold px-3 py-1 rounded-full">{items.length} New</span>
      </div>
      <div className="divide-y divide-white/5 max-h-[60vh] sm:max-h-96 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="p-4 sm:p-5 hover:bg-botanical-surface transition-colors group active:bg-botanical-border">
            <div className="flex justify-between items-start mb-2 gap-3">
              <h4 className="text-base sm:text-sm font-semibold text-botanical-text group-hover:text-botanical-accent transition-colors">{item.title}</h4>
              <span className="text-xs text-botanical-muted font-mono shrink-0 pt-0.5">
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm sm:text-xs text-botanical-muted leading-relaxed">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
