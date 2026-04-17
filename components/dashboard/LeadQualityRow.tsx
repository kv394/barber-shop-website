"use client";
import React, { useState } from 'react';

type LeadStatus = 'GOOD' | 'NEEDS REVIEW';

export interface Lead {
  id: string;
  company: string;
  email: string;
  utmLink: string;
  status: LeadStatus;
  country: string;
  servicesRequired: string[];
  potentialRevenue: number;
  notes: string;
  aiScore: number;
}

function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}

export default function LeadQualityRow({ lead }: { lead: Lead }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Collapsed State */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="grid grid-cols-5 items-center p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors bg-white"
      >
        <div className="text-sm font-medium text-gray-800">{lead.company}</div>
        <div className="text-sm font-normal text-gray-500">{lead.email}</div>
        <div className="text-sm font-normal text-gray-500 truncate pr-4">{lead.utmLink}</div>
        <div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            lead.status === 'GOOD' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
            {lead.status}
          </span>
        </div>
        <div className="text-sm font-medium text-gray-800">{lead.country}</div>
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <div className="border-t-2 border-orange-500 bg-gray-50 p-6 shadow-inner relative mt-[-1px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Services Required */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Services Required</h4>
              <div className="flex flex-wrap gap-2">
                {lead.servicesRequired.map(service => (
                  <span key={service} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Financials</h4>
              <p className="text-sm text-gray-500 mb-1">Potential Revenue</p>
              <p className="text-3xl font-bold tracking-tight text-gray-900">
                ${lead.potentialRevenue.toLocaleString()}
              </p>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                 <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes</h4>
                 <button className="text-gray-400 hover:text-gray-600 transition-colors">
                   <EditIcon className="w-4 h-4" />
                 </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-800 shadow-sm min-h-[80px]">
                {lead.notes}
              </div>
            </div>

            {/* AI Score & Actions */}
            <div className="flex flex-col items-center justify-between h-full">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={226} 
                    strokeDashoffset={226 - (226 * lead.aiScore) / 100}
                    className="text-[#f05a28] transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-gray-900">{lead.aiScore}</span>
                </div>
                <div className="absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider text-gray-400">AI Score</div>
              </div>

              <div className="flex flex-col w-full gap-2 mt-8">
                <button className="flex items-center justify-center gap-2 w-full bg-[#f05a28] hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                  View Campaign
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
                <button className="w-full bg-transparent hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-gray-200">
                  Assign to Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}