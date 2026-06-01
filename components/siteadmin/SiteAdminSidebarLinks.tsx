'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteAdminSidebarLinks() {
 const pathname = usePathname();

 const navLink = (href: string, label: string) => {
 // Dashboard is exact match, others are prefix match
 const active = href === '/siteadmin' 
 ? pathname === '/siteadmin' 
 : pathname.startsWith(href);

 return (
 <Link 
 href={href} 
 className={`block px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
 active 
 ? 'bg-[#FFF5F2] text-[#ea580c] font-semibold' 
 : 'text-crm-muted hover:text-[#ea580c] hover:bg-[#FFF5F2]'
 }`}
 >
 {label}
 </Link>
 );
 };

 return (
 <div className="mb-6 space-y-1">
 {navLink('/siteadmin', 'Dashboard')}
 {navLink('/siteadmin/shops', 'Shops')}
 {navLink('/siteadmin/users', 'Users')}
 {navLink('/siteadmin/tiers', 'Pricing Tiers')}
 {navLink('/siteadmin/logs', 'System Logs')}
 {navLink('/siteadmin/performance', 'System Performance')}
 {navLink('/siteadmin/support', 'Support & Broadcasts')}
 {navLink('/siteadmin/settings', 'Global Settings')}
 </div>
 );
}
