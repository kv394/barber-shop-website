"use client";
import React, { useState } from 'react';
import CustomerProfileOverlay from './CustomerProfileOverlay';

type LeadStatus = 'GOOD' | 'NEEDS REVIEW';

export interface Lead {
  id: string;
  date: string;
  isNew: boolean;
  company: string;
  email: string;
  utmLink: string;
  status: LeadStatus;
  country: string;
  servicesRequired: string[];
  referrerSource: string;
  potentialRevenue: number;
  potentialRevenueText: string;
  leadScoreText: string;
  notes: string;
  aiScore: number;
}

function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );
}

function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 17L17 7"></path>
      <path d="M7 7h10v10"></path>
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18"></path>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  );
}

function ChevronUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m18 15-6-6-6 6"></path>
    </svg>
  );
}

export default function LeadQualityRow({ lead }: { lead: Lead }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const rowContent = (
    <div className="grid grid-cols-6 items-center px-4 py-3 cursor-pointer w-full">
      <div className="flex items-center gap-3 col-span-1">
        <div className={`w-1.5 h-1.5 rounded-full ${lead.isNew ? 'bg-red-500' : 'bg-transparent'}`}></div>
        <div className={`text-[13px] ${lead.isNew ? 'font-semibold text-crm-text' : 'font-medium text-crm-muted'}`}>{lead.date}</div>
      </div>
      <div className={`text-[13px] ${lead.company !== '-' ? 'font-medium text-crm-text' : 'text-crm-muted'} col-span-1`}>{lead.company}</div>
      <div 
        className="text-[13px] font-normal text-crm-muted col-span-1 hover:text-orange-500 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsProfileOpen(true);
        }}
      >
        {lead.email}
      </div>
      <div className="text-[13px] font-normal text-crm-muted underline decoration-gray-300 underline-offset-2 col-span-1">{lead.utmLink}</div>
      <div className="col-span-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
          lead.status === 'GOOD' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : 'bg-orange-50 text-orange-600 border-orange-100'
        }`}>
          {lead.status}
        </span>
      </div>
      <div className="flex items-center justify-between col-span-1">
        <div className="text-[13px] font-medium text-crm-text">{lead.country}</div>
        <div className="text-crm-muted">
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </div>
    </div>
  );

  if (isExpanded) {
    return (
      <div className="my-2 bg-white rounded-xl shadow-sm border border-crm-border overflow-hidden relative">
        {/* Top Orange Border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500 z-10"></div>
        
        <div onClick={() => setIsExpanded(false)}>
          {rowContent}
        </div>

        <div className="px-6 pb-6 pt-2">
          <div className="border-t border-crm-border mb-6 w-[calc(100%-80px)]"></div>
          
          <div className="flex justify-between">
            {/* Left Data Area */}
            <div className="flex gap-12">
              {/* Labels */}
              <div className="flex flex-col gap-3">
                <div className="text-[13px] text-crm-muted">Services Required</div>
                <div className="text-[13px] text-crm-muted">Referrer Source</div>
                <div className="flex items-center gap-1.5 text-[13px] text-crm-muted">
                  Potential Revenue <span className="inline-flex items-center px-1 rounded text-[9px] font-bold border border-crm-border text-crm-muted">AI</span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-crm-muted">
                  Lead Score <span className="inline-flex items-center px-1 rounded text-[9px] font-bold border border-crm-border text-crm-muted">AI</span>
                </div>
              </div>

              {/* Values */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 h-5 items-center">
                  {lead.servicesRequired.map((service, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-blue-200 text-blue-700 bg-white">
                      {service}
                    </span>
                  ))}
                </div>
                <div className="text-[13px] font-medium text-crm-text h-5 flex items-center">{lead.referrerSource}</div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-crm-text h-5">
                  ${lead.potentialRevenue.toLocaleString()} <span className="text-crm-muted font-normal">({lead.potentialRevenueText})</span>
                  <button className="text-crm-muted hover:text-crm-muted transition-colors ml-1"><EditIcon /></button>
                </div>
                <div className="text-[13px] font-medium text-crm-text h-5 flex items-center">{lead.aiScore} <span className="text-crm-muted font-normal ml-1">({lead.leadScoreText})</span></div>
              </div>

              {/* Notes Area */}
              <div className="ml-12 w-64">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-medium text-crm-text underline decoration-gray-300 underline-offset-4">Note</span>
                  <span className="text-[13px] text-crm-muted">(Aug 3, 15:17)</span>
                  <button className="text-crm-muted hover:text-crm-muted transition-colors ml-1"><EditIcon /></button>
                </div>
                <div className="text-[13px] text-crm-muted flex items-center gap-1 cursor-pointer hover:text-crm-muted transition-colors mt-4">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg> New Note
                </div>
              </div>
            </div>

            {/* AI Score Donut */}
            <div className="flex flex-col items-center justify-center shrink-0 pr-4">
              <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="36" cy="36" r="32" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                  <circle cx="36" cy="36" r="32" stroke="currentColor" strokeWidth="4" fill="transparent" 
                    strokeDasharray={201} 
                    strokeDashoffset={201 - (201 * lead.aiScore) / 100}
                    className="text-orange-500 transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-crm-text leading-none">{lead.aiScore}</span>
                  <span className="text-[9px] font-bold text-crm-muted mt-0.5">AI Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm">
                View Campaign
                <ArrowUpRightIcon />
              </button>
              <button className="flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors">
                Assign to Team
                <UsersIcon />
              </button>
            </div>
            
            <button className="flex items-center justify-center gap-2 bg-white border border-crm-border hover:bg-crm-bg text-crm-text px-4 py-2 rounded-lg text-[13px] font-medium transition-colors">
              Archive Lead
              <TrashIcon />
            </button>
          </div>
        </div>

        <CustomerProfileOverlay 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          customerEmail={lead.email}
          customerName={lead.company !== '-' ? lead.company : lead.email.split('@')[0]}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-crm-border bg-transparent hover:bg-crm-bg transition-colors group">
      <div onClick={() => setIsExpanded(true)}>
        {rowContent}
      </div>
      
      <CustomerProfileOverlay 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        customerEmail={lead.email}
        customerName={lead.company !== '-' ? lead.company : lead.email.split('@')[0]}
      />
    </div>
  );
}