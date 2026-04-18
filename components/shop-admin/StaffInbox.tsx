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
    return <div className="text-crm-muted text-[13px] animate-pulse">Loading inbox...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-crm-surface p-6 rounded-xl border border-crm-border shadow-sm text-center">
        <span className="text-3xl mb-2 block">📭</span>
        <p className="text-crm-muted text-[13px]">No new notifications</p>
      </div>
    );
  }

  return (
    <div className="bg-crm-bg/80 backdrop-blur-xl rounded-2xl shadow-lg border border-crm-border shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-crm-border flex items-center justify-between">
        <h3 className="text-crm-text font-bold flex items-center gap-2 text-lg font-bold">
          <span>🔔</span> My Notifications
        </h3>
        <span className="bg-crm-primary text-white text-[11px] font-bold px-3 py-1 rounded-full hover:opacity-90">{items.length} New</span>
      </div>
      <div className="divide-y divide-white/5 max-h-[60vh] sm:max-h-96 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="p-4 sm:p-5 hover:bg-crm-surface transition-colors group active:bg-crm-border">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2 gap-3">
              <h4 className="font-semibold text-crm-text group-hover:text-crm-accent transition-colors text-base font-semibold">{item.title}</h4>
              <span className="text-[11px] text-crm-muted font-mono shrink-0 pt-0.5">
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-crm-muted leading-relaxed text-[13px]">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
