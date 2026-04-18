"use client";

import React, { useState } from 'react';
import CustomerProfileOverlay from '@/components/dashboard/CustomerProfileOverlay';

// SVG Icons
const SearchIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BellIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const InfoIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default function CRMDashboard() {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([1, 4, 5]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState<{name: string, email: string} | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Favourite', 'New', 'Assigned to me', 'Overdue', 'Hot'];

  const toggleLead = (id: number) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const leads = [
    { id: 1, name: "Emma Johansson", company: "Nordic Soft AB", email: "emma@nordicsoft.io", status: "HOT", statusColor: "text-status-hot border-status-hot bg-status-hot/10", manager: "Jacob Müller", source: "Website", score: 9 },
    { id: 2, name: "Ethan Wilson", company: "Travel Ventures", email: "ethan@travelventures.com", status: "OPEN", statusColor: "text-status-open border-status-open bg-status-open/10", manager: "Olivia Davis", source: "LinkedIn", score: 6 },
    { id: 3, name: "Isabella Hernandez", company: "Design Studios", email: "isabella@designstudios.net", status: "NEW", statusColor: "text-status-new border-status-new bg-status-new/10", manager: "Liam Johnson", source: "X", score: 4 },
    { id: 4, name: "William Lee", company: "AI Dynamics", email: "w.lee@aidynamics.com", status: "HOT", statusColor: "text-status-hot border-status-hot bg-status-hot/10", manager: "James Smith", source: "Facebook", score: 7 },
    { id: 5, name: "Sophia Martinez", company: "EcoTech Solutions", email: "sophia@ecotech.io", status: "QUALIFIED", statusColor: "text-status-qualified border-status-qualified bg-status-qualified/10", manager: "Olivia Davis", source: "Instagram", score: 6 },
    { id: 6, name: "Ava Clark", company: "Smart Homes Inc.", email: "ava@smarthomes.com", status: "IN PROGRESS", statusColor: "text-status-info border-status-info bg-status-info/10", manager: "Noah Garcia", source: "Website", score: 3 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-crm-bg text-crm-text font-sans selection:bg-crm-primary/20">
      
      {/* Sidebar */}
      <aside className="w-64 bg-crm-surface border-r border-crm-border flex flex-col shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-crm-text rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
            <div>
              <div className="font-bold text-sm leading-tight text-crm-text">Conceptzilla</div>
              <div className="text-[10px] text-crm-muted font-medium">Free Workflow</div>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-crm-muted">
              <SearchIcon />
            </div>
            <input type="text" placeholder="Search" className="block w-full pl-9 pr-3 py-1.5 text-sm bg-crm-bg border-none rounded-md focus:ring-1 focus:ring-crm-primary" />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-crm-muted text-xs">/</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          
          <div>
            <div className="text-[10px] font-bold text-crm-muted tracking-wider uppercase mb-2 px-2">Sales Operations</div>
            <ul className="space-y-1">
              <li><a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors"><span>⏱</span> Dashboard</a></li>
              <li>
                <a href="#" className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold text-crm-text bg-crm-bg rounded-md">
                  <div className="flex items-center gap-3">
                    <UserIcon /> Leads
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-crm-primary"></div>
                </a>
              </li>
              <li><a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors"><span>📦</span> Orders</a></li>
              <li><a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors"><span>👥</span> Customers</a></li>
              <li>
                <a href="#" className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors">
                  <div className="flex items-center gap-3">
                    <span>💬</span> Messages
                  </div>
                  <span className="text-xs bg-crm-bg px-1.5 py-0.5 rounded text-crm-muted">4</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-bold text-crm-muted tracking-wider uppercase mb-2 px-2 flex justify-between items-center">
              Workspaces <button className="text-crm-muted hover:text-crm-text">+</button>
            </div>
            <ul className="space-y-1">
              <li><a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-crm-primary"></div> Sales</a></li>
              <li><a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Account Management</a></li>
              <li><a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium text-crm-muted hover:text-crm-text rounded-md hover:bg-crm-bg transition-colors"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Support & Success</a></li>
            </ul>
          </div>

        </nav>

        {/* Bottom Profile */}
        <div 
          className="p-4 border-t border-crm-border cursor-pointer hover:bg-crm-bg transition-colors"
          onClick={() => setProfileView({ name: 'Aiden Hudson', email: 'ahudson@gmail.com' })}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden"><img src="https://i.pravatar.cc/150?u=aiden" alt="User" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-crm-text truncate">Aiden Hudson</div>
              <div className="text-xs text-crm-muted truncate">ahudson@gmail.com</div>
            </div>
            <button className="text-crm-muted hover:text-crm-text"><SettingsIcon /></button>
          </div>
        </div>

        <CustomerProfileOverlay 
          isOpen={!!profileView || isProfileOpen} 
          onClose={() => { setProfileView(null); setIsProfileOpen(false); }} 
          customerName={profileView?.name || "Aiden Hudson"}
          customerEmail={profileView?.email || "ahudson@gmail.com"}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-crm-bg">
        
        {/* Header */}
        <header className="h-16 bg-crm-surface border-b border-crm-border flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-crm-text">Leads</h1>
            <span className="text-sm text-crm-muted font-medium">248</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-crm-muted hover:text-crm-text"><InfoIcon /></button>
            <button className="text-crm-muted hover:text-crm-text"><BellIcon /></button>
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?u=1" alt=""/>
              <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?u=2" alt=""/>
              <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?u=3" alt=""/>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-100 flex items-center justify-center text-xs font-bold text-crm-primary">+5</div>
            </div>
            <button className="bg-crm-primary hover:bg-crm-accent text-white px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
               <span>Share Access</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-crm-surface rounded-xl p-5 border border-crm-border shadow-sm flex flex-col justify-between">
              <div className="text-sm text-crm-muted font-medium mb-2">New Leads</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-crm-text">42</div>
                <div className="flex flex-col items-end">
                  <div className="text-green-500 text-xs font-bold flex items-center">↗ 12%</div>
                  <div className="w-16 h-8 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0wLDMwIEwxMCwyMCBMMjAsMjUgTDMwLDE1IEw0MCwxMCBMNTAsMTggTDYwLDUgTDcwLDEyIEw4MCwwIEw5MCwxMCBMMTAwLDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-contain"></div>
                </div>
              </div>
            </div>
            <div className="bg-crm-surface rounded-xl p-5 border border-crm-border shadow-sm flex flex-col justify-between">
              <div className="text-sm text-crm-muted font-medium mb-2">Qualified Leads</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-crm-text">18</div>
                <div className="flex flex-col items-end">
                  <div className="text-green-500 text-xs font-bold flex items-center">↗ 4.2%</div>
                  <div className="w-16 h-8 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0wLDMwIEwxMCwyMCBMMjAsMjUgTDMwLDE1IEw0MCwxMCBMNTAsMTggTDYwLDUgTDcwLDEyIEw4MCwwIEw5MCwxMCBMMTAwLDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-contain"></div>
                </div>
              </div>
            </div>
            <div className="bg-crm-surface rounded-xl p-5 border border-crm-border shadow-sm flex flex-col justify-between">
              <div className="text-sm text-crm-muted font-medium mb-2">Avg Response Time</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-crm-text">1.8h</div>
                <div className="flex flex-col items-end">
                  <div className="text-green-500 text-xs font-bold flex items-center">↗ 15%</div>
                  <div className="w-16 h-8 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0wLDMwIEwxMCwyMCBMMjAsMjUgTDMwLDE1IEw0MCwxMCBMNTAsMTggTDYwLDUgTDcwLDEyIEw4MCwwIEw5MCwxMCBMMTAwLDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-contain"></div>
                </div>
              </div>
            </div>
            <div className="bg-crm-surface rounded-xl p-5 border border-crm-border shadow-sm flex flex-col justify-between">
              <div className="text-sm text-crm-muted font-medium mb-2">Hot Leads</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-crm-text">9</div>
                <div className="flex flex-col items-end">
                  <div className="text-red-500 text-xs font-bold flex items-center">↘ 2%</div>
                  <div className="w-16 h-8 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMzAiPjxwYXRoIGQ9Ik0wLDMwIEwxMCwyMCBMMjAsMjUgTDMwLDE1IEw0MCwxMCBMNTAsMTggTDYwLDUgTDcwLDEyIEw4MCwwIEw5MCwxMCBMMTAwLDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2Y5NzMxNiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-contain"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-end justify-between relative z-10 w-full pl-2">
            <div className="flex items-end">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab;
                const isPrevActive = index > 0 && tabs[index - 1] === activeTab;
                const showSeparator = index > 0 && !isActive && !isPrevActive;

                return (
                  <div key={tab} className="flex items-center h-full relative">
                    {showSeparator && (
                      <div className="h-3 w-px bg-gray-300 mx-2 mb-3"></div>
                    )}
                    <button
                      onClick={() => setActiveTab(tab)}
                      className={`text-sm transition-colors px-6 py-3 relative ${
                        isActive
                          ? "bg-crm-surface text-crm-text font-semibold rounded-t-2xl translate-y-[1px] z-20 shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.05)] pb-4 before:content-[''] before:absolute before:bottom-0 before:-right-4 before:w-4 before:h-4 before:bg-[radial-gradient(circle_at_top_right,transparent_16px,#FFFFFF_16px)]"
                          : "text-crm-muted hover:text-crm-text mb-1 pb-3"
                      } ${isActive && index !== 0 ? "after:content-[''] after:absolute after:bottom-0 after:-left-4 after:w-4 after:h-4 after:bg-[radial-gradient(circle_at_top_left,transparent_16px,#FFFFFF_16px)]" : ""}`}
                    >
                      {tab}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="pb-3 pr-2 flex gap-4 text-crm-muted hover:text-crm-text cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
          </div>

          {/* Table Area */}
          <div className={`bg-crm-surface rounded-2xl ${activeTab === 'All' ? 'rounded-tl-none' : ''} shadow-sm overflow-hidden flex flex-col relative z-0`}>
            
            {/* Table Header Filter (Simulated) */}
            <div className="px-6 py-3 flex items-center gap-4 bg-crm-surface">
              <div className="relative flex-1 max-w-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-crm-muted">
                    <SearchIcon />
                 </div>
                 <input type="text" placeholder="Search" className="block w-full pl-9 pr-3 py-1.5 text-sm bg-crm-bg border-none rounded-md focus:ring-1 focus:ring-crm-primary" />
              </div>
              <div className="flex gap-2">
                 <button className="p-1.5 text-crm-muted hover:bg-crm-bg rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-y border-crm-border bg-crm-bg/50">
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">
                    <input type="checkbox" className="rounded border-gray-300 text-crm-primary focus:ring-crm-primary" />
                  </th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">Customer</th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">Company</th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">Email</th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">Status</th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">Manager</th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase">Source</th>
                  <th className="py-3 px-6 text-[10px] font-bold tracking-wider text-crm-muted uppercase text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-border">
                {leads.map(lead => (
                  <tr key={lead.id} className={`hover:bg-crm-bg/50 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-orange-50/50' : ''}`}>
                    <td className="py-3 px-6">
                      <input 
                        type="checkbox" 
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="rounded border-gray-300 text-crm-primary focus:ring-crm-primary" 
                      />
                    </td>
                    <td className="py-3 px-6 cursor-pointer group" onClick={() => setProfileView({ name: lead.name, email: lead.email })}>
                      <div className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/150?u=${lead.id + 10}`} className="w-8 h-8 rounded-full bg-gray-200" alt="" />
                        <span className="font-semibold text-sm text-crm-text group-hover:text-orange-500 transition-colors">{lead.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-crm-muted">{lead.company}</td>
                    <td className="py-3 px-6 text-sm text-crm-muted">{lead.email}</td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider ${lead.statusColor}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-crm-text">{lead.manager}</td>
                    <td className="py-3 px-6 text-sm text-crm-muted">{lead.source}</td>
                    <td className="py-3 px-6 text-right">
                       <div className="flex items-center justify-end gap-1">
                          {[1,2,3,4,5,6,7,8,9,10].map(i => (
                            <div key={i} className={`w-1 h-3 rounded-full ${i <= lead.score ? (lead.score > 7 ? 'bg-green-500' : lead.score > 4 ? 'bg-yellow-400' : 'bg-red-400') : 'bg-gray-200'}`}></div>
                          ))}
                          <span className="ml-2 text-xs font-semibold text-crm-muted border rounded px-1">{lead.score}/10</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Floating Action Bar */}
          {selectedLeads.length > 0 && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-200">
              <span className="text-sm font-semibold">Selected: {selectedLeads.length}</span>
              <div className="w-px h-4 bg-gray-700"></div>
              <button className="flex items-center gap-2 text-sm font-medium hover:text-crm-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Edit</button>
              <button className="flex items-center gap-2 text-sm font-medium hover:text-crm-primary transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> Assign to</button>
              <button className="flex items-center gap-2 text-sm font-medium hover:text-red-400 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete</button>
              <button className="bg-white text-gray-900 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-100 transition-colors ml-4" onClick={() => setSelectedLeads([])}>Discard</button>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
