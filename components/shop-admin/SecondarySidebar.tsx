'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SecondarySidebar({ shopId, userRole, shopType }: { shopId: string, userRole: string, shopType?: string }) {
 const pathname = usePathname();
 const isAll = shopId === 'all';
 const isShopAdmin = userRole === 'SHOP_ADMIN';

 if (!pathname) return null;

 // If user is not an admin, they don't have sub-menus (they only have Staff, Clients, Profile)
 if (!isShopAdmin || isAll) return null;

 // Determine Active Section
 const getSection = () => {
 if (pathname.startsWith(`/shop/${shopId}/settings/team`) || pathname.startsWith(`/shop/${shopId}/portfolio`)) return 'team';
 
 const settingsAndConfigPaths = ['/config/services', '/config/products', '/settings/booking', '/settings/resources', '/settings/forms', '/settings/memberships', '/settings', '/settings/notifications', '/settings/kiosk', '/settings/billing', '/settings/commissions', '/hardware', '/marketplace'];
 if (pathname === `/shop/${shopId}/settings` || settingsAndConfigPaths.some(p => p !== '/settings' && pathname.startsWith(`/shop/${shopId}${p}`))) return 'settings';

 const engagementPaths = ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/reviews'];
 if (engagementPaths.some(p => pathname.startsWith(`/shop/${shopId}${p}`))) return 'engagement';

 const reportPaths = ['/reports', '/reports/commissions', '/reports/staff-working', '/expenses', '/booth-rent', '/capital'];
 if (pathname === `/shop/${shopId}/reports` || reportPaths.some(p => p !== '/reports' && pathname.startsWith(`/shop/${shopId}${p}`))) return 'reports';

 return null;
 };

 const section = getSection();
 if (!section) return null;

 const isActive = (path: string, exact: boolean = false) => {
 if (exact) return pathname === path;
 return pathname.startsWith(path);
 };

 const navLink = (href: string, label: string, exact: boolean = false) => {
 const active = isActive(href, exact);
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

 const renderSectionContent = () => {
 switch (section) {
 case 'team':
 return (
 <>
 <div className="space-y-1 mt-2">
 {navLink(`/shop/${shopId}/settings/team`, 'Availability & Staff')}
 {navLink(`/shop/${shopId}/portfolio`, 'Portfolio')}
 </div>
 </>
 );
 case 'engagement':
 return (
 <>
 <div className="space-y-1 mt-2">
 {navLink(`/shop/${shopId}/engagement`, 'Dashboard', true)}
 {navLink(`/shop/${shopId}/loyalty`, 'Loyalty Program')}
 {navLink(`/shop/${shopId}/referrals`, 'Referrals')}
 {navLink(`/shop/${shopId}/campaigns`, 'Campaigns')}
 {navLink(`/shop/${shopId}/engagement/social`, 'AI Social Media')}
 {navLink(`/shop/${shopId}/gift-cards`, 'Gift Cards')}
 {navLink(`/shop/${shopId}/reviews`, 'Reviews')}
 </div>
 </>
 );
 case 'reports':
 return (
 <>
 <div className="space-y-1 mt-2">
 {navLink(`/shop/${shopId}/reports`, 'Overview', true)}
 {navLink(`/shop/${shopId}/reports/commissions`, 'Commissions')}
 {navLink(`/shop/${shopId}/reports/staff-working`, 'Working Hours')}
 {navLink(`/shop/${shopId}/expenses`, 'Expenses')}
 {navLink(`/shop/${shopId}/booth-rent`, 'Booth Rent')}
 {navLink(`/shop/${shopId}/capital`, 'Capital & Financing')}
 </div>
 </>
 );
 case 'settings':
 return (
 <>
 <h3 className="px-3 text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-2 mt-4">Setup</h3>
 <div className="space-y-1 mb-4 border-l-2 border-crm-border ml-2 pl-2">
 {navLink(`/shop/${shopId}/config/services`, 'Services')}
 {navLink(`/shop/${shopId}/config/products`, 'Products')}
 {navLink(`/shop/${shopId}/settings/booking`, 'Booking & Hours')}
 {navLink(`/shop/${shopId}/settings/resources`, 'Resources')}
 {navLink(`/shop/${shopId}/hardware`, 'Hardware Store')}
 {navLink(`/shop/${shopId}/marketplace`, 'Wholesale Marketplace')}
 </div>
 
 <h3 className="px-3 text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-2">Experience</h3>
 <div className="space-y-1 mb-4 border-l-2 border-crm-border ml-2 pl-2">
 {navLink(`/shop/${shopId}/settings`, 'Appearance', true)}
 {navLink(`/shop/${shopId}/settings/memberships`, 'Memberships')}
 {navLink(`/shop/${shopId}/settings/forms`, 'Intake Forms')}
 </div>
 
 <h3 className="px-3 text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-2">Operations</h3>
 <div className="space-y-1 mb-6 border-l-2 border-crm-border ml-2 pl-2">
 {navLink(`/shop/${shopId}/settings/commissions`, 'Commissions')}
 {navLink(`/shop/${shopId}/settings/notifications`, 'Alerts')}
 {shopType !== 'MOBILE' && navLink(`/shop/${shopId}/settings/kiosk`, 'Staff Kiosk')}
 {shopType !== 'MOBILE' && navLink(`/shop/${shopId}/kiosk`, 'Front Desk Kiosk')}
 {navLink(`/shop/${shopId}/settings/billing`, 'Billing')}
 </div>
 
 <div className="space-y-1">
 {navLink(`/shop/${shopId}/sdk`, 'SDK Docs')}
 </div>
 </>
 );
 default:
 return null;
 }
 };

 return (
 <aside className="hidden md:flex flex-col w-48 bg-white/60 backdrop-blur-xl border-r border-white/40 flex-shrink-0 z-10">
 <div className="h-16 flex items-center px-4 border-b border-white/40">
 <span className="font-bold text-lg tracking-tight text-crm-text capitalize">{section}</span>
 </div>
 <nav className="flex-1 overflow-y-auto py-2 px-2">
 {renderSectionContent()}
 </nav>
 </aside>
 );
}
