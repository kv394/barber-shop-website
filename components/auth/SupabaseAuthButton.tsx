'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';

export default function SupabaseAuthButton({ 
  redirectUrl,
  primaryColor,
  secondaryColor 
}: { 
  redirectUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const openModal = (url: string) => {
    let finalUrl = url;
    if (primaryColor) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + `themeColor=${encodeURIComponent(primaryColor)}`;
    }
    setModalUrl(finalUrl);
  };
  const closeModal = () => {
    setModalUrl(null);
  };

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
    
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        // Fetch extra profile data for the barcode
        fetch('/api/my-appointments/profile')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) setProfile(data);
          })
          .catch(err => console.error(err));
      }
      setLoading(false);
    };

    fetchUser();

    // Listen for auth changes (like signing in from another tab)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (!session?.user) setProfile(null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Update position when menu opens or window resizes
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const alignRight = rect.left > window.innerWidth / 2;
        
        let style: React.CSSProperties = {};
        
        // If there's more space above than below, and space below is tight (< 400px), open upwards
        if (spaceBelow < 400 && spaceAbove > spaceBelow) {
          style.bottom = window.innerHeight - rect.top + 8;
        } else {
          // Open downwards
          style.top = rect.bottom + 8;
        }

        // Align horizontally
        if (alignRight) {
          style.right = window.innerWidth - rect.right;
        } else {
          style.left = rect.left;
        }

        setMenuStyle(style);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    window.location.href = '/logout';
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-crm-surface animate-pulse border border-crm-border shadow-sm"></div>;
  }

  if (user) {
    const menuContent = (
      <>
        {/* Invisible overlay just to catch clicks outside */}
        <div 
          className={`fixed inset-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
          style={{ zIndex: 99998, pointerEvents: isOpen ? 'auto' : 'none' }}
          onClick={() => setIsOpen(false)} 
        />
        
        {/* Floating Menu Pop-up with Animation */}
        <div 
          ref={menuRef}
          className={`fixed w-72 bg-crm-surface border border-crm-border shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
          style={{ zIndex: 99999, ...menuStyle }}
        >
           <div className="p-5 border-b border-crm-border flex flex-col items-center bg-crm-bg relative">
             <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-crm-muted hover:text-crm-muted transition-colors">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
             
             <p className="text-crm-text font-bold truncate mb-4 w-full text-center text-[13px]">{user.email}</p>
             <div className="bg-crm-surface p-3 rounded-2xl shadow-inner inline-block border border-crm-border">
               <QRCodeSVG value={profile?.barcode || user.id} size={120} level="L" />
             </div>
             <p className="text-crm-muted mt-4 text-center uppercase tracking-widest font-bold text-[10px]">My Check-in Code</p>
           </div>
           
           {/* Menu Actions */}
           <div className="p-2 space-y-1 bg-crm-surface">
              <button onClick={() => { setIsOpen(false); openModal('/my-appointments'); }} className="block w-full text-left px-3 py-2.5 text-[13px] text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-semibold">
                My Appointments
              </button>
              <button onClick={() => { setIsOpen(false); openModal('/my-appointments/profile'); }} className="block w-full text-left px-3 py-2.5 text-[13px] text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-semibold">
                Edit Profile
              </button>
              <button onClick={() => { setIsOpen(false); openModal('/update-password'); }} className="block w-full text-left px-3 py-2.5 text-[13px] text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-semibold">
                Change Password
              </button>
              
              <div className="h-px bg-crm-border my-1.5" />
              
              <button 
                onClick={() => { setIsOpen(false); handleSignOut(); }} 
                className="block w-full text-left px-3 py-2.5 text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-bold"
              >
                Sign Out
              </button>
           </div>
        </div>
      </>
    );

    return (
      <div className="relative inline-block z-50">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-crm-surface hover:bg-crm-bg border border-crm-border shadow-sm px-3 py-1.5 rounded-full transition-colors"
        >
          <div 
            className="w-6 h-6 rounded-full bg-crm-primary flex items-center justify-center text-white font-bold text-[11px] shadow-inner hover:opacity-90"
            style={{ backgroundColor: primaryColor || undefined }}
          >
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>
        {isRendered && mounted && typeof document !== 'undefined' ? createPortal(menuContent, document.body) : null}
        {/* Iframe Modal Overlay */}
        {modalUrl && mounted && typeof document !== 'undefined' ? createPortal(
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-crm-surface w-full max-w-4xl h-[90vh] max-h-[900px] rounded-2xl shadow-2xl overflow-hidden relative flex flex-col border border-crm-border animate-in zoom-in-95 duration-300">
              <div className="absolute top-3 right-3 z-50">
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-crm-surface hover:bg-crm-border text-crm-text transition-colors shadow-sm border border-crm-border">✕</button>
              </div>
              <iframe src={modalUrl} className="w-full flex-1 border-none bg-crm-bg" />
            </div>
          </div>,
          document.body
        ) : null}
      </div>
    );
  }

  return (
    <Link 
      href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl || (typeof window !== 'undefined' ? window.location.pathname : '/'))}`} 
      className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm border"
      style={{ 
        backgroundColor: primaryColor || 'var(--crm-surface)', 
        color: primaryColor ? '#ffffff' : 'var(--crm-text)',
        borderColor: primaryColor || 'var(--crm-border)'
      }}
    >
      Sign In
    </Link>
  );
}