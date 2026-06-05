import Image from 'next/image';
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MyAppointmentsNav() {
 const pathname = usePathname();
 const [isIframe, setIsIframe] = useState(false);

 useEffect(() => {
 setIsIframe(window.self !== window.top);
 }, []);

 if (isIframe) return null;

 const links = [
 { href: '/my-appointments', label: 'Appointments', icon: '📅' },
 { href: '/my-appointments/profile', label: 'Profile', icon: '👤' },
 { href: '/my-appointments/loyalty', label: 'Loyalty', icon: '⭐' },
 { href: '/my-appointments/notifications', label: 'Notifications', icon: '🔔' },
 { href: '/my-appointments/referrals', label: 'Referrals', icon: '🔗' },
 ];

 return (
 <nav className="max-w-4xl mx-auto px-4 sm:px-3 py-3 sm:py-4">
 <div className="flex sm:flex-wrap gap-1 sm:gap-1 overflow-x-auto scrollbar-none pb-2 sm:pb-0">
 {links.map((link) => {
 const isActive = pathname === link.href;
 return (
 <Link
 key={link.href}
 href={link.href}
 className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
 isActive 
 ? 'bg-crm-primary text-white shadow-lg shadow-brand-indigo/20' 
 : 'bg-crm-surface hover:bg-crm-surface text-crm-muted hover:text-crm-text border border-crm-border shadow-sm'
 }`}
 >
 <span>{link.icon}</span> {link.label}
 </Link>
 );
 })}
 </div>
 </nav>
 );
}