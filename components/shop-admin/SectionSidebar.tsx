'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function SectionSidebar({ activeTab, shopId, section, userRole }: { activeTab: string, shopId: string, section: string, userRole: string }) {
  let navLinks: { href: string, label: string, key: string }[] = [];

  const isStaff = userRole === 'STAFF';
  const isShopAdmin = userRole === 'SHOP_ADMIN';

  if (section === 'settings') {
    navLinks = [
      { href: `/shop/${shopId}/settings`, label: '🎨 Appearance', key: 'settings' },
      { href: `/shop/${shopId}/settings/booking`, label: '📅 Booking & Hours', key: 'settings-booking' },
      { href: `/shop/${shopId}/config/services`, label: '💇 Services', key: 'services' },
      { href: `/shop/${shopId}/config/products`, label: '🛍️ Products', key: 'products' },
      { href: `/shop/${shopId}/settings/resources`, label: '🪑 Resources', key: 'settings-resources' },
      { href: `/shop/${shopId}/settings/forms`, label: '📝 Intake Forms', key: 'settings-forms' },
      { href: `/shop/${shopId}/settings/memberships`, label: '⭐ Memberships', key: 'settings-memberships' },
      { href: `/shop/${shopId}/settings/notifications`, label: '🔔 Notifications', key: 'settings-notifications' },
      { href: `/shop/${shopId}/settings/commissions`, label: '💼 Commissions', key: 'settings-commissions' },
      { href: `/shop/${shopId}/settings/kiosk`, label: '📱 Kiosk', key: 'settings-kiosk' },
      { href: `/shop/${shopId}/settings/billing`, label: '💳 Billing', key: 'settings-billing' },
    ];
  } else if (section === 'staff') {
    if (isShopAdmin) {
      navLinks = [
        { href: `/shop/${shopId}/settings/team`, label: '👥 Team & Availability', key: 'team' },
        { href: `/shop/${shopId}/portfolio`, label: '📸 Portfolio', key: 'portfolio' },
      ];
    } else {
      navLinks = [
        { href: `/shop/${shopId}/staff`, label: '📅 My Schedule', key: 'staff' },
        { href: `/shop/${shopId}/leave`, label: '🏖️ My Leave', key: 'leave' },
        { href: `/shop/${shopId}/portfolio`, label: '📸 My Portfolio', key: 'portfolio' },
        { href: `/shop/${shopId}/reports/commissions`, label: '💰 My Earnings', key: 'commissions' },
      ];
    }
  } else if (section === 'reports') {
    navLinks = [
      { href: `/shop/${shopId}/reports`, label: '💰 Financial', key: 'reports' },
      { href: `/shop/${shopId}/reports/staff-working`, label: '📊 Staff Performance', key: 'staff-report' },
      { href: `/shop/${shopId}/expenses`, label: '💸 Expenses', key: 'expenses' },
      { href: `/shop/${shopId}/reports/commissions`, label: '💼 Commissions', key: 'commissions' },
    ];
  } else if (section === 'engagement') {
    navLinks = [
      { href: `/shop/${shopId}/engagement`, label: '📈 Analytics', key: 'engagement' },
      { href: `/shop/${shopId}/loyalty`, label: '⭐ Loyalty', key: 'loyalty' },
      { href: `/shop/${shopId}/referrals`, label: '🔗 Referrals', key: 'referrals' },
      { href: `/shop/${shopId}/campaigns`, label: '📣 Campaigns', key: 'campaigns' },
      { href: `/shop/${shopId}/gift-cards`, label: '🎁 Gift Cards', key: 'gift-cards' },
    ];
  }

  const scrollContainerRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftIndicator(scrollLeft > 5);
      // Show indicator if not scrolled to the end (allow 10px tolerance for padding and subpixels)
      setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    // Initial check on mount, and then give it a tiny delay to ensure the DOM has rendered the links fully
    checkScroll();
    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    };
  }, [navLinks, activeTab]);

  // Scroll to active element on mount
  useEffect(() => {
    if (activeLinkRef.current && scrollContainerRef.current) {
      const activeLink = activeLinkRef.current;
      const container = scrollContainerRef.current;
      
      const linkRect = activeLink.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Only scroll if it's outside the visible area
      if (linkRect.left < containerRect.left || linkRect.right > containerRect.right) {
        container.scrollTo({
          left: activeLink.offsetLeft - container.clientWidth / 2 + activeLink.clientWidth / 2,
          behavior: 'smooth'
        });
        
        // Check scroll again after animation, and repeatedly during the animation to catch the end state
        setTimeout(checkScroll, 100);
        setTimeout(checkScroll, 300);
        setTimeout(checkScroll, 500);
      }
    }
  }, [activeTab]);

  return (
    <div className="relative">
      <nav 
        aria-label="Section Navigation"
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex flex-row md:flex-col gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0 pl-4 md:pl-0 pr-8 md:pr-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {navLinks.map((l) => {
          const isActive = activeTab === l.key || (l.key === 'settings' && activeTab === 'appearance');
          return (
            <Link
              key={l.key}
              href={l.href}
              ref={isActive ? activeLinkRef : null}
              aria-current={isActive ? 'page' : undefined}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap ${
                isActive 
                  ? 'bg-gray-200/60 text-slate-900 md:bg-brand-gold md:text-brand-dark shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)] md:shadow-lg border border-gray-300 md:border-b-[4px] md:border-yellow-700 transform translate-y-0.5 md:-translate-y-1' 
                  : 'bg-white text-slate-600 md:bg-transparent md:text-gray-400 hover:bg-gray-100 md:hover:bg-white/10 md:hover:text-white border border-gray-200 md:border-transparent shadow-sm md:shadow-none transition-colors duration-200'
              }`}            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      {/* Left Mobile Scroll Indicator (Gradient Fade & Arrow) */}
      <div 
        aria-hidden="true"
        className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none md:hidden flex items-center justify-start pl-1 pb-1 transition-opacity duration-300 ${
          showLeftIndicator ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-6 h-6 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-slate-900 font-black text-lg leading-none -mt-0.5 mr-0.5">‹</span>
        </div>
      </div>

      {/* Right Mobile Scroll Indicator (Gradient Fade & Arrow) */}
      <div 
        aria-hidden="true"
        className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden flex items-center justify-end pr-1 pb-1 transition-opacity duration-300 ${
          showRightIndicator ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="w-6 h-6 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-slate-900 font-black text-lg leading-none -mt-0.5 ml-0.5">›</span>
        </div>
      </div>
    </div>
  );
}
