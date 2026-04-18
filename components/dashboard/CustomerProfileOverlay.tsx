"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Icons
const GripVertical = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="9" cy="12" r="1"></circle>
    <circle cx="9" cy="5" r="1"></circle>
    <circle cx="9" cy="19" r="1"></circle>
    <circle cx="15" cy="12" r="1"></circle>
    <circle cx="15" cy="5" r="1"></circle>
    <circle cx="15" cy="19" r="1"></circle>
  </svg>
);

const ExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-gray-600 cursor-pointer">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const XIcon = ({ onClick }: { onClick?: () => void }) => (
  <svg onClick={onClick} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-gray-600 cursor-pointer">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const BuildingIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M9 22v-4h6v4"></path>
    <path d="M8 6h.01"></path>
    <path d="M16 6h.01"></path>
    <path d="M12 6h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 10h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M8 14h.01"></path>
  </svg>
);

const MailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const Edit2Icon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const PaperclipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const MicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const AtIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
  </svg>
);

const SlidersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
);

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

interface CustomerProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  customerEmail?: string;
}

export default function CustomerProfileOverlay({ 
  isOpen, 
  onClose,
  customerName = "Emma Johansson",
  customerEmail = "emma@nordicsoft.io"
}: CustomerProfileOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timeout = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isRendered || !mounted) return null;

  const overlayContent = (
    <div 
      className={`fixed right-6 top-20 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 z-[99999] flex flex-col max-h-[85vh] overflow-hidden font-sans transition-all duration-300 origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
    >
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-500">
          <GripVertical />
          <span className="text-sm font-semibold text-gray-700">Customer Profile</span>
        </div>
        <div className="flex items-center gap-3">
          <ExternalLink />
          <XIcon onClick={onClose} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
        {/* Profile Info */}
        <div className="flex flex-col items-center pt-6 px-6 pb-4">
          <img src="https://i.pravatar.cc/150?u=emma" alt={customerName} className="w-16 h-16 rounded-full border-2 border-white shadow-sm mb-3" />
          <h2 className="text-lg font-bold text-gray-900 leading-tight mb-3">{customerName}</h2>
          
          <div className="flex flex-col gap-2 w-full ml-10">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BuildingIcon />
              <span>Nordic Soft AB</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MailIcon />
              <span className="truncate">{customerEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PhoneIcon />
              <span>+1 (202) 555-0198</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full mt-5">
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
              <CalendarIcon />
              Schedule a Call
            </button>
            <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Edit2Icon />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 border-b border-gray-100">
          {['Activity', 'Notes', 'Deals', 'Docs'].map(tab => (
            <div 
              key={tab} 
              className={`flex-1 text-center py-3 text-sm font-medium cursor-pointer relative ${
                tab === 'Notes' ? 'text-orange-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'Notes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full"></div>
              )}
            </div>
          ))}
        </div>

        {/* Notes Content */}
        <div className="flex-1 bg-gray-50/50 p-5 flex flex-col gap-5 overflow-y-auto">
          {/* Note 1 */}
          <div className="flex gap-3">
            <img src="https://i.pravatar.cc/150?u=jacob" alt="Jacob Müller" className="w-6 h-6 rounded-full shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold text-gray-900">Jacob Müller</span>
                <span className="text-[10px] text-gray-400">15 mins ago</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed bg-white p-2.5 border border-gray-100 rounded-lg rounded-tl-none shadow-sm mb-1.5">
                Got it. I'll send the update after my meeting this afternoon.
              </p>
              <div className="flex">
                <button className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50">
                  <span>🎯</span> 1
                </button>
              </div>
            </div>
            <div className="ml-auto text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </div>
          </div>

          {/* Note 2 */}
          <div className="flex gap-3">
            <img src="https://i.pravatar.cc/150?u=aiden" alt="Aiden Hudson" className="w-6 h-6 rounded-full shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold text-gray-900">Aiden Hudson</span>
                <span className="text-[10px] text-gray-400">Yesterday</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed bg-white p-2.5 border border-gray-100 rounded-lg rounded-tl-none shadow-sm mb-1.5">
                Please prepare an update for Emma on the onboarding timeline.
              </p>
              <div className="flex">
                <button className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50">
                  <span>🎯</span> 2
                </button>
              </div>
            </div>
            <div className="ml-auto text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="bg-gray-50 border border-gray-200 rounded-lg flex flex-col p-2">
          <textarea 
            placeholder="Write a note..." 
            className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 resize-none h-10 w-full px-1"
            defaultValue="Perfect. Ke|"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2.5 px-1">
              <PaperclipIcon />
              <MicIcon />
              <AtIcon />
              <SlidersIcon />
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 w-7 h-7 rounded-md flex items-center justify-center transition-colors">
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

    </div>
  );

  return createPortal(overlayContent, document.body);
}