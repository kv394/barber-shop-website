"use client";
import React, { useState } from 'react';

export default function PillTabs() {
  const tabs = ["Lead Quality", "Day on Day", "Week on Week", "Month on Month"];
  const [activeTab, setActiveTab] = useState("Lead Quality");

  return (
    <div className="bg-gray-100/50 p-1 rounded-xl inline-flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm transition-colors ${
            activeTab === tab
              ? "bg-white text-gray-900 shadow-sm rounded-lg font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
