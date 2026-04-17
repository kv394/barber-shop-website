"use client";
import Link from 'next/link';
import React from 'react';

// Icons
const LogoIcon = () => (
  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  </div>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m12 16 4-4"></path>
    <path d="M12 8v4"></path>
  </svg>
);

const LeadsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-gray-900">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
    <path d="M19 8v6M16 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OrdersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const CustomersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    <line x1="9" y1="10" x2="15" y2="10"></line>
    <line x1="9" y1="14" x2="15" y2="14"></line>
  </svg>
);

const FeedbackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 19 2 12 11 5 11 19"></polygon>
    <polygon points="22 19 13 12 22 5 22 19"></polygon>
  </svg>
);

const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const ChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronSelector = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="m7 15 5 5 5-5"></path>
    <path d="m7 9 5-5 5 5"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-gray-600 cursor-pointer">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default function LeftSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#f8f9fa] border-r border-gray-200 flex flex-col font-sans">
      
      {/* Header Profile / Logo Area */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-tight">Conceptzilla</span>
            <span className="text-[11px] text-gray-500 font-medium">Free Workflow</span>
          </div>
        </div>
        <ChevronSelector />
      </div>

      {/* Search Bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center bg-gray-100/80 border border-gray-200/60 rounded-lg px-3 py-2 shadow-sm">
          <SearchIcon />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none text-sm text-gray-700 w-full ml-2 placeholder:text-gray-400"
          />
          <div className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 shadow-sm">/</div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        
        {/* SALES OPERATIONS */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 mb-1.5 cursor-pointer group">
            <h2 className="text-[10px] uppercase text-gray-400 font-bold tracking-wider group-hover:text-gray-600 transition-colors">
              SALES OPERATIONS
            </h2>
            <ChevronUp />
          </div>
          <ul className="space-y-0.5 px-3">
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <DashboardIcon />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-900 bg-white rounded-lg shadow-sm border border-gray-100 transition-colors font-semibold">
                <LeadsIcon />
                Leads
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <OrdersIcon />
                Orders
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <CustomersIcon />
                Customers
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <div className="flex items-center gap-3">
                  <MessagesIcon />
                  Messages
                </div>
                <span className="text-[11px] font-bold text-gray-500 bg-gray-200/50 rounded-full px-2 py-0.5">4</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* INSIGHTS & MANAGEMENT */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 py-1.5 cursor-pointer group">
            <h2 className="text-[10px] uppercase text-gray-400 font-bold tracking-wider group-hover:text-gray-600 transition-colors">
              INSIGHTS & MANAGEMENT
            </h2>
            <ChevronDown />
          </div>
        </div>

        {/* WORKSPACES */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 mb-1.5 cursor-pointer group">
            <div className="flex items-center gap-2 w-full">
              <ChevronUp />
              <h2 className="text-[10px] uppercase text-gray-400 font-bold tracking-wider group-hover:text-gray-600 transition-colors">
                WORKSPACES
              </h2>
            </div>
            <PlusIcon />
          </div>
          <ul className="space-y-0.5 px-3">
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <div className="w-2 h-2 rounded-[2px] bg-orange-500 ml-0.5 shrink-0"></div>
                Sales
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <div className="w-2 h-2 rounded-[2px] bg-yellow-400 ml-0.5 shrink-0"></div>
                Account Management
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <div className="w-2 h-2 rounded-[2px] bg-yellow-400 ml-0.5 shrink-0"></div>
                Support & Success
              </Link>
            </li>
          </ul>
        </div>

        {/* PRODUCTIVITY */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 py-1.5 cursor-pointer group">
            <div className="flex items-center gap-2">
              <ChevronDown />
              <h2 className="text-[10px] uppercase text-gray-400 font-bold tracking-wider group-hover:text-gray-600 transition-colors">
                PRODUCTIVITY
              </h2>
            </div>
          </div>
        </div>

        {/* SUPPORT */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 mb-1.5 cursor-pointer group">
            <div className="flex items-center gap-2">
              <ChevronUp />
              <h2 className="text-[10px] uppercase text-gray-400 font-bold tracking-wider group-hover:text-gray-600 transition-colors">
                SUPPORT
              </h2>
            </div>
          </div>
          <ul className="space-y-0.5 px-3">
            <li>
              <Link href="#" className="flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <div className="flex items-center gap-3">
                  <FeedbackIcon />
                  Feedback
                </div>
                <span className="text-[11px] font-bold text-gray-500 bg-gray-200/50 rounded-full px-2 py-0.5">1</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <HelpIcon />
                Help Center
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                <SettingsIcon />
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer Profile Area */}
      <div className="p-4 border-t border-gray-200/60 m-2 mt-auto rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
        <div className="flex items-center gap-3">
          <img src="https://i.pravatar.cc/150?u=aiden" alt="Aiden Hudson" className="w-9 h-9 rounded-full shrink-0 border border-gray-200" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-gray-900 truncate">Aiden Hudson</span>
            <span className="text-xs text-gray-500 truncate">ahudson@gmail.com</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-gray-600 shrink-0">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </div>
      </div>
    </aside>
  );
}