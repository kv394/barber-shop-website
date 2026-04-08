'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BackButton() {
  const [user, setUser] = useState<{ role: string, shopId: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/my-appointments')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="w-24 h-9 bg-slate-800/50 animate-pulse rounded-lg"></div>;
  }

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <Link href="/superadmin" className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
        Back to Superadmin
      </Link>
    );
  }

  if (user?.shopId && (user?.role === 'SHOP_ADMIN' || user?.role === 'STAFF')) {
    return (
      <Link href={`/shop/${user.shopId}`} className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
        Back to Dashboard
      </Link>
    );
  }

  return (
    <Link href="/my-appointments" className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
      Back to Appointments
    </Link>
  );
}
