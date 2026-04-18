"use client";
import React, { useState } from 'react';

export default function PillTabs() {
  const tabs = ["Lead Quality", "Day on Day", "Week on Week", "SQR", "Keyword Performance"];
  const [activeTab, setActiveTab] = useState("Lead Quality");

  return (
    <div className="flex items-center space-x-1 pl-4 pt-2">
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab;
        const isPrevActive = index > 0 && tabs[index - 1] === activeTab;
        const showSeparator = index > 0 && !isActive && !isPrevActive;

        return (
          <div key={tab} className="flex items-center">
            {showSeparator && (
              <div className="h-4 w-px bg-gray-300 mx-1"></div>
            )}
            <button
              onClick={() => setActiveTab(tab)}
              className={`text-[13px] transition-colors px-5 py-3 ${
                isActive
                  ? "bg-white text-crm-text font-medium rounded-t-xl shadow-[0_-4px_6px_-2px_rgba(0,0,0,0.05)] relative z-10"
                  : "text-crm-muted hover:text-crm-text"
              }`}
            >
              {tab}
            </button>
          </div>
        );
      })}
    </div>
  );
}