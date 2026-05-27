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
 return <div className="w-24 h-9 bg-crm-surface animate-pulse rounded-lg"></div>;
 }

 if (user?.role === 'SITE_ADMIN') {
 return (
 <Link href="/siteadmin" className="text-[13px] bg-crm-surface hover:bg-crm-surface border border-slate-600 text-crm-text px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
 Back to Siteadmin
 </Link>
 );
 }

 if (user?.shopId && (user?.role === 'SHOP_ADMIN' || user?.role === 'STAFF')) {
 return (
 <Link href={`/shop/${user.shopId}`} className="text-[13px] bg-crm-surface hover:bg-crm-surface border border-slate-600 text-crm-text px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
 Back to Dashboard
 </Link>
 );
 }

 return (
 <Link href="/my-appointments" className="text-[13px] bg-crm-surface hover:bg-crm-surface border border-slate-600 text-crm-text px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm">
 Back to Appointments
 </Link>
 );
}
