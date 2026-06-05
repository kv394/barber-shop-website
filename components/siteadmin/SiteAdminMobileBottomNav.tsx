'use client';;
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteAdminMobileBottomNav() {
 const pathname = usePathname();

 const navLink = (href: string, label: string, iconPath: React.ReactNode) => {
 const active = href === '/siteadmin' 
 ? pathname === '/siteadmin' 
 : pathname.startsWith(href);

 return (
 <Link 
 href={href} 
 className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
 active 
 ? 'text-crm-primary' 
 : 'text-crm-muted hover:text-crm-text'
 }`}
 >
 <div className={`mb-1 ${active ? 'scale-110 transition-transform' : ''}`}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
 {iconPath}
 </svg>
 </div>
 <span className="text-[10px] font-medium tracking-tight truncate w-full text-center px-1">{label}</span>
 </Link>
 );
 };

 return (
 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-crm-surface border-t border-crm-border flex items-center justify-around overflow-x-auto hide-scrollbar scrollbar-none z-[2000] pb-[env(safe-area-inset-bottom)]">
 {navLink('/siteadmin', 'Home', <><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></>)}
 {navLink('/siteadmin/shops', 'Shops', <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></>)}
 {navLink('/siteadmin/users', 'Users', <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>)}
 {navLink('/siteadmin/tiers', 'Tiers', <><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></>)}
 </div>
 );
}