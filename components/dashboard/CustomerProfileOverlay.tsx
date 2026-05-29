"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  GripVertical, 
  ExternalLink, 
  X, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  Edit2, 
  Paperclip, 
  Mic, 
  AtSign, 
  Sliders, 
  Send,
  MoreHorizontal
} from 'lucide-react';

interface CustomerProfileOverlayProps {
 isOpen: boolean;
 onClose: () => void;
 customerName?: string;
 customerEmail?: string;
}

export default function CustomerProfileOverlay({ 
 isOpen, 
 onClose,
 customerName,
 customerEmail
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
 className={`fixed right-6 top-20 w-[360px] bg-crm-surface rounded-xl shadow-2xl border border-crm-border z-[99999] flex flex-col max-h-[85vh] overflow-hidden transition-all duration-300 origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
 >
 
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-crm-border">
 <div className="flex items-center gap-2 text-crm-muted">
 <GripVertical size={14} />
 <span className="text-[13px] font-semibold text-crm-text">Customer Profile</span>
 </div>
 <div className="flex items-center gap-3">
 <ExternalLink size={14} className="text-crm-muted hover:text-crm-text cursor-pointer" />
 <X size={14} className="text-crm-muted hover:text-crm-text cursor-pointer" onClick={onClose} />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
 {/* Profile Info */}
 <div className="flex flex-col items-center pt-6 px-6 pb-4">
 <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${customerName || 'Client'}`} alt={customerName || 'Client'} className="w-16 h-16 rounded-full border-2 border-white shadow-sm mb-3" />
 <h2 className="text-lg font-bold text-crm-text leading-tight mb-3">{customerName || 'Unknown Client'}</h2>
 
 <div className="flex flex-col gap-2 w-full ml-10">
 <div className="flex items-center gap-2 text-[13px] text-crm-muted">
 <Building size={12} className="text-crm-muted" />
 <span>Client</span>
 </div>
 <div className="flex items-center gap-2 text-[13px] text-crm-muted">
 <Mail size={12} className="text-crm-muted" />
 <span className="truncate">{customerEmail || 'No email provided'}</span>
 </div>
 <div className="flex items-center gap-2 text-[13px] text-crm-muted">
 <Phone size={12} className="text-crm-muted" />
 <span>No phone provided</span>
 </div>
 </div>

 <div className="flex items-center gap-3 w-full mt-5">
 <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-[13px] font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
 <Calendar size={14} />
 Schedule a Call
 </button>
 <button className="flex-1 bg-crm-bg hover:bg-crm-surface text-crm-text border border-crm-border py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2">
 <Edit2 size={14} />
 Edit Profile
 </button>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex items-center px-4 border-b border-crm-border">
 {['Activity', 'Notes', 'Deals', 'Docs'].map(tab => (
 <button 
 key={tab} 
 className={`flex-1 text-center py-3 text-[13px] font-medium cursor-pointer relative ${
 tab === 'Notes' ? 'text-orange-500' : 'text-crm-muted hover:text-crm-text'
 }`}
 >
 {tab}
 {tab === 'Notes' && (
 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full"></div>
 )}
 </button>
 ))}
 </div>

 {/* Notes Content */}
 <div className="flex-1 bg-crm-bg/50 p-5 flex flex-col gap-5 overflow-y-auto">
 {/* Note 1 */}
 <div className="flex gap-3">
 <img src="https://i.pravatar.cc/150?u=jacob" alt="Jacob Müller" className="w-6 h-6 rounded-full shrink-0" />
 <div className="flex flex-col">
 <div className="flex items-baseline gap-2 mb-1">
 <span className="text-[11px] font-bold text-crm-text">Jacob Müller</span>
 <span className="text-[10px] text-crm-muted">15 mins ago</span>
 </div>
 <p className="text-[11px] text-crm-muted leading-relaxed bg-crm-surface p-2.5 border border-crm-border rounded-lg rounded-tl-none shadow-sm mb-1.5">
 Got it. I'll send the update after my meeting this afternoon.
 </p>
 <div className="flex">
 <button className="flex items-center gap-1 bg-crm-surface border border-crm-border rounded-full px-1.5 py-0.5 text-[10px] text-crm-muted hover:bg-crm-bg">
 <span>🎯</span> 1
 </button>
 </div>
 </div>
 <div className="ml-auto text-gray-300">
 <MoreHorizontal size={14} />
 </div>
 </div>

 {/* Note 2 */}
 <div className="flex gap-3">
 <img src="https://i.pravatar.cc/150?u=aiden" alt="Aiden Hudson" className="w-6 h-6 rounded-full shrink-0" />
 <div className="flex flex-col">
 <div className="flex items-baseline gap-2 mb-1">
 <span className="text-[11px] font-bold text-crm-text">Aiden Hudson</span>
 <span className="text-[10px] text-crm-muted">Yesterday</span>
 </div>
 <p className="text-[11px] text-crm-muted leading-relaxed bg-crm-surface p-2.5 border border-crm-border rounded-lg rounded-tl-none shadow-sm mb-1.5">
 Please prepare an update for Emma on the onboarding timeline.
 </p>
 <div className="flex">
 <button className="flex items-center gap-1 bg-crm-surface border border-crm-border rounded-full px-1.5 py-0.5 text-[10px] text-crm-muted hover:bg-crm-bg">
 <span>🎯</span> 2
 </button>
 </div>
 </div>
 <div className="ml-auto text-gray-300">
 <MoreHorizontal size={14} />
 </div>
 </div>
 </div>
 </div>

 {/* Input Area */}
 <div className="p-3 bg-crm-surface border-t border-crm-border">
 <div className="bg-crm-bg border border-crm-border rounded-lg flex flex-col p-2">
 <textarea 
 placeholder="Write a note..." 
 className="bg-transparent border-none outline-none text-[13px] text-crm-text placeholder:text-crm-muted resize-none h-10 w-full px-1"
 defaultValue="Perfect. Ke|"
 />
 <div className="flex items-center justify-between mt-2">
 <div className="flex items-center gap-2.5 px-1">
 <Paperclip size={14} className="text-crm-muted" />
 <Mic size={14} className="text-crm-muted" />
 <AtSign size={14} className="text-crm-muted" />
 <Sliders size={14} className="text-crm-muted" />
 </div>
 <button className="bg-orange-500 hover:bg-orange-600 w-7 h-7 rounded-lg flex items-center justify-center transition-colors">
 <Send size={14} className="text-white" />
 </button>
 </div>
 </div>
 </div>

 </div>
 );

 return createPortal(overlayContent, document.body);
}