'use client';;
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import ShopSwitcher from './ShopSwitcher';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export default function ShopMobileBottomNav({ 
 shopId, 
 userRole, 
 currentShopName, 
 accessibleShops, 
 fallbackRedirect 
}: any) {
 const pathname = usePathname();
 const [isOpen, setIsOpen] = useState(false);
 const [canScrollRight, setCanScrollRight] = useState(false);
 const [canScrollLeft, setCanScrollLeft] = useState(false);
 const scrollContainerRef = useRef<HTMLDivElement>(null);
 const isAll = shopId === 'all';

 useEffect(() => {
 const handleScroll = () => {
 if (!scrollContainerRef.current) return;
 const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
 setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
 setCanScrollLeft(scrollLeft > 2);
 };

 handleScroll();
 
 const el = scrollContainerRef.current;
 if (el) {
 el.addEventListener('scroll', handleScroll, { passive: true });
 window.addEventListener('resize', handleScroll);
 return () => {
 el.removeEventListener('scroll', handleScroll);
 window.removeEventListener('resize', handleScroll);
 };
 }
 }, [pathname]); // Re-run when pathname changes because items might change



 const navLink = (href: string, label: string, iconPath: React.ReactNode, isExact = false) => {
 const active = isExact ? pathname === href : pathname.startsWith(href);

 return (
 <Link 
 href={href} 
 id={active ? 'active-bottom-nav-link' : undefined}
 className={`flex flex-col items-center justify-center min-w-[76px] flex-1 pt-3 pb-2 px-1 transition-all duration-200 whitespace-nowrap snap-center ${
 active 
 ? 'text-crm-primary' 
 : 'text-crm-muted hover:text-crm-text'
 }`}
 >
 <div className={`mb-1 transition-all duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
 {iconPath}
 </svg>
 </div>
 <span className={`text-[10px] tracking-tight truncate w-full text-center px-1 transition-all ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
 </Link>
 );
 };

 // Determine Active Section to show context-specific bottom nav
 const getSection = () => {
 if (isAll) return 'all';
 
 if (pathname.startsWith(`/shop/${shopId}/settings/team`) || pathname.startsWith(`/shop/${shopId}/portfolio`)) return 'team';
 
 const settingsAndConfigPaths = ['/config/services', '/config/products', '/settings/booking', '/settings/resources', '/settings/forms', '/settings/memberships', '/settings', '/settings/notifications', '/settings/kiosk', '/settings/billing', '/settings/commissions'];
 if (pathname === `/shop/${shopId}/settings` || settingsAndConfigPaths.some(p => p !== '/settings' && pathname.startsWith(`/shop/${shopId}${p}`))) return 'settings';

 const engagementPaths = ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/gamification', '/reviews'];
 if (engagementPaths.some(p => pathname.startsWith(`/shop/${shopId}${p}`))) return 'engagement';

 const reportPaths = ['/reports', '/reports/commissions', '/reports/staff-working', '/expenses'];
 if (pathname === `/shop/${shopId}/reports` || reportPaths.some(p => p !== '/reports' && pathname.startsWith(`/shop/${shopId}${p}`))) return 'reports';

 return 'main';
 };

 const section = getSection();

 useEffect(() => {
 const timeout = setTimeout(() => {
 const activeLink = document.getElementById('active-bottom-nav-link');
 const container = scrollContainerRef.current;
 if (activeLink && container) {
 const containerRect = container.getBoundingClientRect();
 const activeRect = activeLink.getBoundingClientRect();
 const scrollLeft = container.scrollLeft + (activeRect.left - containerRect.left) - (containerRect.width / 2) + (activeRect.width / 2);
 container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
 }
 }, 200);
 return () => clearTimeout(timeout);
 }, [pathname, section]);

 // Common Icons
 const icons = {
 home: <><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></>,
 user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></>,
 settings: <><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></>,
 users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></>,
 calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></>,
 tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></>,
 star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></>,
 heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></>,
 chart: <><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></>,
 image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></>,
 file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></>,
 clock: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>,
 scissors: <><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></>,
 package: <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></>,
 chair: <><path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path><path d="M9 22V12h6v10M2 9h20M3 9l2-5M21 9l-2-5M12 12v-5"></path></>,
 ticket: <><path d="M15 5.05A4 4 0 1 0 15 18.95M15 5.05A4 4 0 1 1 15 18.95M15 5.05L19 2M15 18.95L19 22M5 2L9 5.05M5 22L9 18.95M9 5.05A4 4 0 1 1 9 18.95M9 5.05A4 4 0 1 0 9 18.95"></path></>,
 dollar: <><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></>,
 message: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></>,
 bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></>,
 creditCard: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></>,
 terminal: <><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></>,
 menu: <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>,
 idCard: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><circle cx="9" cy="11" r="3"></circle><line x1="14" y1="11" x2="18" y2="11"></line><line x1="14" y1="15" x2="18" y2="15"></line></>,
 sun: <><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></>,
 training: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></>
 };

 return (
 <>
 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-crm-surface/90 backdrop-blur-xl border-t border-crm-border/50 flex items-center z-[2000] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
 
 {/* Scrollable Context Nav Container */}
 <div className="flex-1 relative overflow-hidden flex">
 <div 
 ref={scrollContainerRef}
 className="flex-1 relative flex overflow-x-auto hide-scrollbar scrollbar-none"
 >
 {section === 'all' && (
 <div className="flex w-full justify-around min-w-max px-2">
 {navLink(`/shop/all`, 'Dashboard', icons.chart, true)}
 </div>
 )}

 {section === 'main' && (
 <div className="flex w-full justify-around min-w-max px-2">
 {navLink(`/shop/${shopId}`, 'Home', icons.home, true)}
 {userRole === 'SHOP_ADMIN' ? (
 <>
 {navLink(`/shop/${shopId}/bookings`, 'Bookings', icons.calendar)}
 {navLink(`/shop/${shopId}/waitlist`, 'Waitlist', icons.clock)}
 {navLink(`/shop/${shopId}/clients`, 'Clients', icons.users)}
 {navLink(`/shop/${shopId}/reports`, 'Reports', icons.chart)}
 </>
 ) : (
 <>
 {navLink(`/shop/${shopId}/staff`, 'Schedule', icons.calendar)}
 {navLink(`/shop/${shopId}/waitlist`, 'Waitlist', icons.clock)}
 {navLink(`/shop/${shopId}/clients`, 'Clients', icons.users)}
 {navLink(`/shop/${shopId}/reports/commissions`, 'Earnings', icons.dollar)}
 </>
 )}
 </div>
 )}

 {section === 'team' && (
 <div className="flex w-full justify-around min-w-max px-2">
 {navLink(`/shop/${shopId}/settings/team`, 'Team', icons.idCard, true)}
 {navLink(`/shop/${shopId}/portfolio`, 'Portfolio', icons.image, true)}
 </div>
 )}

 {section === 'settings' && (
 <div className="flex w-full justify-around min-w-max px-2">
 {navLink(`/shop/${shopId}/config/services`, 'Services', icons.scissors, true)}
 {navLink(`/shop/${shopId}/config/products`, 'Products', icons.package, true)}
 {navLink(`/shop/${shopId}/settings/memberships`, 'Memberships', icons.star, true)}
 {navLink(`/shop/${shopId}/settings/booking`, 'Booking', icons.clock, true)}
 {navLink(`/shop/${shopId}/settings/resources`, 'Resources', icons.chair, true)}
 {navLink(`/shop/${shopId}/settings/forms`, 'Forms', icons.file, true)}
 {navLink(`/shop/${shopId}/settings`, 'Appearance', icons.image, true)}
 {navLink(`/shop/${shopId}/settings/notifications`, 'Alerts', icons.bell, true)}
 {navLink(`/shop/${shopId}/settings/commissions`, 'Commissions', icons.dollar, true)}
 {navLink(`/shop/${shopId}/settings/kiosk`, 'Kiosk', icons.terminal, true)}
 {navLink(`/shop/${shopId}/settings/billing`, 'Billing', icons.creditCard, true)}
 </div>
 )}

 {section === 'engagement' && (
 <div className="flex w-full justify-around min-w-max px-2">
 {navLink(`/shop/${shopId}/engagement`, 'Analytics', icons.chart, true)}
 {navLink(`/shop/${shopId}/campaigns`, 'Campaigns', icons.message, true)}
 {navLink(`/shop/${shopId}/gift-cards`, 'Gift Cards', icons.ticket, true)}
 {navLink(`/shop/${shopId}/loyalty`, 'Loyalty', icons.heart, true)}
 {navLink(`/shop/${shopId}/referrals`, 'Referrals', icons.users, true)}
 {navLink(`/shop/${shopId}/reviews`, 'Reviews', icons.star, true)}
 </div>
 )}

 {section === 'reports' && (
 <div className="flex w-full justify-around min-w-max px-2">
 {navLink(`/shop/${shopId}/reports`, 'Sales', icons.chart, true)}
 {navLink(`/shop/${shopId}/reports/commissions`, 'Commissions', icons.dollar, true)}
 {navLink(`/shop/${shopId}/reports/staff-working`, 'Hours', icons.clock, true)}
 {navLink(`/shop/${shopId}/expenses`, 'Expenses', icons.tag, true)}
 </div>
 )}
 </div>
 
 {/* Scroll Indicator Overlay - Left */}
 <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-crm-surface to-transparent pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
 
 {/* Scroll Indicator Overlay - Right */}
 <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-crm-surface to-transparent pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />
 </div>

 {/* Fixed Menu Button */}
 <div className="flex shrink-0 border-l border-crm-border/30 bg-crm-surface/10 pl-1 pr-2 relative z-10">
 <button 
 onClick={() => setIsOpen(true)} 
 className={`flex flex-col items-center justify-center min-w-[70px] pt-3 pb-2 px-1 transition-all duration-200 ${isOpen ? 'text-crm-primary' : 'text-crm-muted hover:text-crm-text'}`}
 >
 <div className={`mb-1 transition-transform duration-300 ${isOpen ? 'scale-110' : 'active:scale-90'}`}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isOpen ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
 {icons.menu}
 </svg>
 </div>
 <span className={`text-[10px] tracking-tight truncate w-full text-center px-1 transition-all ${isOpen ? 'font-bold' : 'font-medium'}`}>Menu</span>
 </button>
 </div>
 </div>

 {/* Drawer */}
 <div className={`fixed inset-0 z-[3000] flex md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
 <aside 
 className={`relative w-[300px] max-w-[85vw] bg-crm-surface h-full flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} 
 onClick={e => e.stopPropagation()}
 >
 <div className="flex flex-col border-b border-crm-border bg-crm-bg/30">
 <div className="h-14 flex items-center justify-between px-5">
 <span className="font-bold text-lg tracking-tight text-crm-text">Menu</span>
 <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-crm-muted hover:text-crm-text bg-transparent hover:bg-crm-border/50 rounded-full transition-colors active:scale-95">
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
 </button>
 </div>
 {currentShopName && accessibleShops && (
 <div className="px-3 pb-3">
 <ShopSwitcher currentShopId={shopId} currentShopName={currentShopName} shops={accessibleShops} userRole={userRole} />
 </div>
 )}
 </div>
 
 <nav 
 className="flex-1 overflow-y-auto py-4 px-3" 
 onClick={(e) => {
 if ((e.target as HTMLElement).closest('a')) {
 setIsOpen(false);
 }
 }}
 >
 <div className="space-y-1">
 <Link 
 href={`/shop/${shopId}`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname === `/shop/${shopId}` ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.home}</svg>
 <span>Dashboard</span>
 </Link>

 {userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN' ? (
 <>
 <Link 
 href={`/shop/${shopId}/bookings`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/bookings`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.calendar}</svg>
 <span>Bookings</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/waitlist`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/waitlist`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.clock}</svg>
 <span>Waitlist</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/clients`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/clients`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.users}</svg>
 <span>Clients</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/settings/team`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/settings/team`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.idCard}</svg>
 <span>Team</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/portfolio`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/portfolio`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.image}</svg>
 <span>Portfolio</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/training`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/training`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.training}</svg>
 <span>Training</span>
 </Link>

 <div className="my-1 mx-4 border-t border-crm-border/50" />

 <Link 
 href={`/shop/${shopId}/reports`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname === `/shop/${shopId}/reports` ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.chart}</svg>
 <span>Reports</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/reports/commissions`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/reports/commissions`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.dollar}</svg>
 <span>Payroll</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/expenses`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/expenses`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.tag}</svg>
 <span>Expenses</span>
 </Link>

 <div className="my-1 mx-4 border-t border-crm-border/50" />

 <Link 
 href={`/shop/${shopId}/engagement`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/gamification', '/reviews'].some(p => pathname.startsWith(`/shop/${shopId}${p}`)) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.heart}</svg>
 <span>Engagement</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/settings`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 (pathname.startsWith(`/shop/${shopId}/settings`) || pathname.startsWith(`/shop/${shopId}/config`)) && !pathname.startsWith(`/shop/${shopId}/settings/team`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.settings}</svg>
 <span>Settings</span>
 </Link>
 </>
 ) : (
 <>
 <Link 
 href={`/shop/${shopId}/staff`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/staff`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.calendar}</svg>
 <span>My Schedule</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/waitlist`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/waitlist`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.clock}</svg>
 <span>Waitlist</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/clients`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/clients`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.users}</svg>
 <span>Clients</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/reports/commissions`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/reports/commissions`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.dollar}</svg>
 <span>My Earnings</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/portfolio`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/portfolio`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.image}</svg>
 <span>My Portfolio</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/training`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/training`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.training}</svg>
 <span>Training</span>
 </Link>

 {userRole === 'BOOTH_RENTER' && (
  <>
  <div className="my-1 mx-4 border-t border-crm-border/50" />
  <Link 
  href={`/shop/${shopId}/booth-rent`} 
  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
  pathname.startsWith(`/shop/${shopId}/booth-rent`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
  }`}
  >
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.creditCard}</svg>
  <span>My Rent</span>
  </Link>

  <Link 
  href={`/shop/${shopId}/my-booking-link`} 
  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
  pathname.startsWith(`/shop/${shopId}/my-booking-link`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
  }`}
  >
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.idCard}</svg>
  <span>My Booking Link</span>
  </Link>
  </>
  )}

 <Link 
 href={`/shop/${shopId}/leave`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/leave`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.sun}</svg>
 <span>Time Off</span>
 </Link>

 <Link 
 href={`/shop/${shopId}/profile`} 
 className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-colors ${
 pathname.startsWith(`/shop/${shopId}/profile`) ? 'bg-[#FFF5F2] text-[#ea580c] font-bold' : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
 }`}
 >
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons.user}</svg>
 <span>Profile</span>
 </Link>
 </>
 )}
 </div>
 </nav>

 <div className="p-4 border-t border-crm-border flex flex-col gap-3 bg-crm-bg/30 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
 <span className="block text-[11px] font-semibold text-crm-muted uppercase tracking-wider">{userRole.replace('_', ' ')}</span>
 <div className="flex justify-start">
 <SupabaseAuthButton redirectUrl={fallbackRedirect} />
 </div>
 </div>
 </aside>
 </div>
 </>
 );
}