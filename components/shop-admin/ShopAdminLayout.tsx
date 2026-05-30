import Link from 'next/link';
import GlobalVoiceNoteFAB from './GlobalVoiceNoteFAB';
import PageTitleUpdater from './PageTitleUpdater';

interface ShopAdminLayoutProps {
 children: React.ReactNode;
 shopName: string;
 shopSlug: string;
 pageTitle?: string;
 shopId: string;
 userRole: string;
 activeTab?: string;
 tabs?: { id: string; label: string; href: string }[];
}

export default function ShopAdminLayout({
 children,
 pageTitle,
 shopId,
 userRole,
 tabs,
 activeTab,
 shopName,
}: ShopAdminLayoutProps) {
 
 return (
 <div className="pb-20 sm:pb-0 h-full flex flex-col">
 <PageTitleUpdater title={pageTitle} shopName={shopName} />
 {/* Show horizontal tabs if they exist (e.g. Clients page with 'List' vs 'Segments' tabs) */}
 {tabs && tabs.length > 0 && (
 <div className="hidden sm:flex sm:flex-row sm:items-end justify-between relative z-10 w-full mt-2 sm:-mt-6 border-b sm:border-b-0 border-crm-border">
 <div className="flex items-end overflow-x-auto hide-scrollbar whitespace-nowrap">
 {tabs.map((tab, index) => {
 const isActive = activeTab === tab.id;
 const isPrevActive = index > 0 && tabs[index - 1].id === activeTab;
 const showSeparator = index > 0 && !isActive && !isPrevActive;

 return (
 <div key={tab.id} className="flex items-center h-full relative">
 {showSeparator && (
 <div className="h-3 w-px bg-gray-300 mx-2 mb-3"></div>
 )}
 <Link
 href={tab.href}
 className={`text-[13px] transition-colors px-6 py-3 relative ${
 isActive
 ? "bg-crm-surface text-crm-text font-semibold rounded-t-2xl translate-y-[1px] z-20 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)] pb-4 sm:border-x sm:border-t sm:border-crm-border before:content-[''] before:absolute before:bottom-0 before:-right-4 before:w-4 before:h-4 before:bg-[radial-gradient(circle_at_top_right,transparent_16px,#FFFFFF_16px)]"
 : "text-crm-muted hover:text-crm-text mb-1 pb-3"
 } ${isActive && index !== 0 ? "after:content-[''] after:absolute after:bottom-0 after:-left-4 after:w-4 after:h-4 after:bg-[radial-gradient(circle_at_top_left,transparent_16px,#FFFFFF_16px)]" : ""}`}
 >
 {tab.label}
 </Link>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Main Content Area */}
 <div className={`flex-1 shadow-2xl shadow-brand-indigo/5 border border-white/40 bg-white/60 backdrop-blur-xl p-4 md:p-8 ${tabs && tabs.length > 0 && tabs[0].id === activeTab ? 'rounded-xl sm:rounded-2xl sm:rounded-tl-none' : 'rounded-xl sm:rounded-2xl'} relative z-0 animate-page-in`}>
  {pageTitle && (
  <div className="mb-6 flex items-center gap-3 flex-wrap">
    <h1 className="text-2xl font-black text-crm-text tracking-tight flex items-center gap-2">
    {pageTitle}
    </h1>
    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-crm-bg border border-crm-border text-crm-muted/80 select-all cursor-text mt-1" title="Shop ID">
      {shopId}
    </span>
  </div>
  )}
 {children}
 </div>

 {/* Global Quick Voice Note FAB */}
 <GlobalVoiceNoteFAB shopId={shopId} />
 </div>
 );
}
