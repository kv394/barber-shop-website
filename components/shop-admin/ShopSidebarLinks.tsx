'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function ShopSidebarLinks({ shopId, userRole }: { shopId: string, userRole: string }) {
  const pathname = usePathname();
  const isAll = shopId === 'all';
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.includes('/settings') || pathname.includes('/config'));
  
  const setupPaths = ['/config/services', '/config/products', '/settings/booking', '/settings/resources'];
  const experiencePaths = ['/settings/memberships', '/settings/forms'];
  const operationsPaths = ['/settings/commissions', '/settings/notifications', '/settings/kiosk', '/settings/billing'];
  const teamPaths = ['/settings/team', '/portfolio'];
  const engagementPaths = ['/engagement', '/loyalty', '/referrals', '/campaigns', '/gift-cards', '/reviews'];
  const reportsPaths = ['/reports', '/expenses'];
  
  const [isSetupOpen, setIsSetupOpen] = useState(setupPaths.some(p => pathname.includes(p)));
  const [isExperienceOpen, setIsExperienceOpen] = useState(pathname === `/shop/${shopId}/settings` || experiencePaths.some(p => pathname.includes(p)));
  const [isOperationsOpen, setIsOperationsOpen] = useState(operationsPaths.some(p => pathname.includes(p)));
  const [isTeamOpen, setIsTeamOpen] = useState(teamPaths.some(p => pathname.includes(p)));
  const [isEngagementOpen, setIsEngagementOpen] = useState(engagementPaths.some(p => pathname.includes(p)));
  const [isReportsOpen, setIsReportsOpen] = useState(reportsPaths.some(p => pathname.includes(p)));

  const isActive = (path: string, label: string, exact: boolean = false) => {
    if (exact) return pathname === path;
    if (path === `/shop/${shopId}` && pathname === `/shop/${shopId}`) return true;

    if (path !== `/shop/${shopId}` && pathname.startsWith(path)) return true;
    return false;
  };

  const navLink = (href: string, label: string, exact: boolean = false) => {
    const active = isActive(href, label, exact);
    return (
      <Link 
        href={href} 
        className={`block px-3 py-2 rounded-lg text-[14px] font-medium transition-colors ${
          active 
            ? 'bg-[#FFF5F2] text-[#ea580c] font-semibold' 
            : 'text-crm-muted hover:text-crm-text hover:bg-crm-bg'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="mb-6 space-y-1">
        {navLink(`/shop/${shopId}`, 'Dashboard')}
        {!isAll && navLink(`/shop/${shopId}/bookings`, 'Bookings')}
        {!isAll && navLink(`/shop/${shopId}/waitlist`, 'Waitlist')}
        {!isAll && navLink(`/shop/${shopId}/clients`, 'Clients')}
        {userRole === 'SHOP_ADMIN' && !isAll && (
          <>
            {/* Team Accordion */}
            <div className="pt-1 pb-1">
              <button onClick={() => setIsTeamOpen(!isTeamOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                <span>Team</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isTeamOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${isTeamOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="space-y-1 ml-4 pl-3 border-l-2 border-crm-border py-1">
                    {navLink(`/shop/${shopId}/settings/team`, 'Availability & Staff')}
                    {navLink(`/shop/${shopId}/portfolio`, 'Portfolio')}
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Accordion */}
            <div className="pb-1">
              <button onClick={() => setIsEngagementOpen(!isEngagementOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                <span>Engagement</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isEngagementOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${isEngagementOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="space-y-1 ml-4 pl-3 border-l-2 border-crm-border py-1">
                    {navLink(`/shop/${shopId}/engagement`, 'Dashboard', true)}
                    {navLink(`/shop/${shopId}/loyalty`, 'Loyalty Program')}
                    {navLink(`/shop/${shopId}/referrals`, 'Referrals')}
                    {navLink(`/shop/${shopId}/campaigns`, 'Campaigns')}
                    {navLink(`/shop/${shopId}/gift-cards`, 'Gift Cards')}
                    {navLink(`/shop/${shopId}/reviews`, 'Reviews')}
                  </div>
                </div>
              </div>
            </div>

            {/* Reports Accordion */}
            <div className="pb-1">
              <button onClick={() => setIsReportsOpen(!isReportsOpen)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors">
                <span>Reports</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isReportsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${isReportsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="space-y-1 ml-4 pl-3 border-l-2 border-crm-border py-1">
                    {navLink(`/shop/${shopId}/reports`, 'Overview', true)}
                    {navLink(`/shop/${shopId}/reports/commissions`, 'Commissions')}
                    {navLink(`/shop/${shopId}/reports/staff-working`, 'Working Hours')}
                    {navLink(`/shop/${shopId}/expenses`, 'Expenses')}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Settings Accordion */}
            <div className="pt-2 pb-1">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg mb-1 transition-colors"
              >
                <span>Settings & Config</span>
                <svg 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                className={`grid transition-all duration-300 ease-in-out ${isSettingsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 border-l-2 border-crm-border ml-5 pl-4 pb-2">
                    <div className="mb-3">
                      <button 
                        onClick={() => setIsSetupOpen(!isSetupOpen)} 
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg mb-1 transition-colors"
                      >
                        <span>Setup</span>
                        <svg className={`w-3 h-3 transition-transform duration-200 ${isSetupOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${isSetupOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="space-y-1 ml-4 pl-3 border-l-2 border-crm-border py-1">
                            {navLink(`/shop/${shopId}/config/services`, 'Services')}
                            {navLink(`/shop/${shopId}/config/products`, 'Products')}
                            {navLink(`/shop/${shopId}/settings/booking`, 'Booking & Hours')}
                            {navLink(`/shop/${shopId}/settings/resources`, 'Resources')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <button 
                        onClick={() => setIsExperienceOpen(!isExperienceOpen)} 
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg mb-1 transition-colors"
                      >
                        <span>Experience</span>
                        <svg className={`w-3 h-3 transition-transform duration-200 ${isExperienceOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${isExperienceOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="space-y-1 ml-4 pl-3 border-l-2 border-crm-border py-1">
                            {navLink(`/shop/${shopId}/settings`, 'Appearance', true)}
                            {navLink(`/shop/${shopId}/settings/memberships`, 'Memberships')}
                            {navLink(`/shop/${shopId}/settings/forms`, 'Intake Forms')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-1">
                      <button 
                        onClick={() => setIsOperationsOpen(!isOperationsOpen)} 
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg mb-1 transition-colors"
                      >
                        <span>Operations</span>
                        <svg className={`w-3 h-3 transition-transform duration-200 ${isOperationsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${isOperationsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <div className="space-y-1 ml-4 pl-3 border-l-2 border-crm-border py-1">
                            {navLink(`/shop/${shopId}/settings/commissions`, 'Commissions')}
                            {navLink(`/shop/${shopId}/settings/notifications`, 'Alerts')}
                            {navLink(`/shop/${shopId}/settings/kiosk`, 'Kiosk')}
                            {navLink(`/shop/${shopId}/settings/billing`, 'Billing')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {navLink(`/shop/${shopId}/sdk`, 'SDK Docs')}
          </>
        )}
      </div>
      
      {userRole !== 'SHOP_ADMIN' && !isAll && (
        <div className="mb-6 space-y-1">
          <h3 className="px-3 text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-2">My Area</h3>
          {navLink(`/shop/${shopId}/staff`, 'My Schedule')}
          {navLink(`/shop/${shopId}/leave`, 'My Leave')}
          {navLink(`/shop/${shopId}/portfolio`, 'My Portfolio')}
          {navLink(`/shop/${shopId}/reports/commissions`, 'My Earnings')}
          {navLink(`/shop/${shopId}/profile`, 'Profile')}
        </div>
      )}
    </>
  );
}
