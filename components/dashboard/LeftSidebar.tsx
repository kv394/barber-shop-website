"use client";
import Link from 'next/link';
import React, { useState } from 'react';

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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted">
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-crm-text">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronSelector = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted">
    <path d="m7 15 5 5 5-5"></path>
    <path d="m7 9 5-5 5 5"></path>
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted hover:text-crm-muted cursor-pointer">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default function LeftSidebar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#f8f9fa] border-r border-crm-border flex flex-col font-sans">
      
      {/* Header Profile / Logo Area */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-crm-text leading-tight">Conceptzilla</span>
            <span className="text-[11px] text-crm-muted font-medium">Free Workflow</span>
          </div>
        </div>
        <ChevronSelector />
      </div>

      {/* Search Bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center bg-crm-surface/80 border border-crm-border/60 rounded-lg px-3 py-2 shadow-sm">
          <SearchIcon />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none text-[13px] text-crm-text w-full ml-2 placeholder:text-crm-muted"
          />
          <div className="text-[10px] font-bold text-crm-muted bg-white border border-crm-border rounded px-1.5 py-0.5 shadow-sm">/</div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        
        {/* SALES OPERATIONS */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 mb-1.5 cursor-pointer group">
            <h2 className="text-[10px] uppercase text-crm-muted font-bold tracking-wider group-hover:text-crm-muted transition-colors">
              SALES OPERATIONS
            </h2>
            <ChevronUp />
          </div>
          <ul className="space-y-0.5 px-3">
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <DashboardIcon />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-text bg-white rounded-lg shadow-sm border border-crm-border transition-colors font-semibold">
                <LeadsIcon />
                Leads
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <OrdersIcon />
                Orders
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <CustomersIcon />
                Customers
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center justify-between px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <div className="flex items-center gap-3">
                  <MessagesIcon />
                  Messages
                </div>
                <span className="text-[11px] font-bold text-crm-muted bg-gray-200/50 rounded-full px-2 py-0.5">4</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* INSIGHTS & MANAGEMENT */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-5 py-1.5 cursor-pointer group">
            <h2 className="text-[10px] uppercase text-crm-muted font-bold tracking-wider group-hover:text-crm-muted transition-colors">
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
              <h2 className="text-[10px] uppercase text-crm-muted font-bold tracking-wider group-hover:text-crm-muted transition-colors">
                WORKSPACES
              </h2>
            </div>
            <PlusIcon />
          </div>
          <ul className="space-y-0.5 px-3">
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <div className="w-2 h-2 rounded-[2px] bg-orange-500 ml-0.5 shrink-0"></div>
                Sales
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <div className="w-2 h-2 rounded-[2px] bg-yellow-400 ml-0.5 shrink-0"></div>
                Account Management
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
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
              <h2 className="text-[10px] uppercase text-crm-muted font-bold tracking-wider group-hover:text-crm-muted transition-colors">
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
              <h2 className="text-[10px] uppercase text-crm-muted font-bold tracking-wider group-hover:text-crm-muted transition-colors">
                SUPPORT
              </h2>
            </div>
          </div>
          <ul className="space-y-0.5 px-3">
            <li>
              <Link href="#" className="flex items-center justify-between px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <div className="flex items-center gap-3">
                  <FeedbackIcon />
                  Feedback
                </div>
                <span className="text-[11px] font-bold text-crm-muted bg-gray-200/50 rounded-full px-2 py-0.5">1</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <HelpIcon />
                Help Center
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 text-[13px] text-crm-muted hover:bg-crm-surface rounded-lg transition-colors font-medium">
                <SettingsIcon />
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer Profile Area */}
      <div className="relative mt-auto">
        {/* User Profile Popup */}
        <div className={`absolute left-2 bottom-[80px] w-[240px] bg-white rounded-xl shadow-2xl border border-crm-border z-[100] flex flex-col overflow-hidden font-sans transition-all duration-300 origin-bottom-left ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
          <div className="p-4 border-b border-crm-border flex items-center gap-3">
              <img src="https://i.pravatar.cc/150?u=aiden" alt="Aiden Hudson" className="w-10 h-10 rounded-full border border-crm-border" />
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-crm-text truncate">Aiden Hudson</span>
                <span className="text-[11px] text-crm-muted truncate">ahudson@gmail.com</span>
              </div>
            </div>
            <div className="py-2">
              <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-[13px] text-crm-muted hover:bg-crm-bg transition-colors">
                <SettingsIcon />
                Account Settings
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
              </button>
            </div>
          </div>
        
        <div 
          className={`p-4 border-t border-crm-border/60 m-2 rounded-xl hover:bg-crm-surface transition-colors cursor-pointer group flex items-center gap-3 ${isProfileOpen ? 'bg-crm-surface' : ''}`}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <img src="https://i.pravatar.cc/150?u=aiden" alt="Aiden Hudson" className="w-9 h-9 rounded-full shrink-0 border border-crm-border" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-crm-text truncate">Aiden Hudson</span>
            <span className="text-[11px] text-crm-muted truncate">ahudson@gmail.com</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crm-muted group-hover:text-crm-muted shrink-0 transition-transform duration-200" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </div>
      </div>
    </aside>
  );
}