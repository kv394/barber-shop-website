'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import CustomerProfileOverlay from '@/components/dashboard/CustomerProfileOverlay';

export default function SupabaseAuthButton({ 
  redirectUrl 
}: { 
  redirectUrl?: string 
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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
      window.removeEventListener('resize', checkMobile);
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-crm-surface animate-pulse border border-crm-border shadow-sm"></div>;
  }

  if (user) {
    const menuContent = (
      <>
        {/* Dark overlay for mobile, invisible on desktop */}
        <div 
          className="fixed inset-0 bg-crm-darkBase/60 sm:bg-transparent transition-opacity" 
          style={{ zIndex: 99998 }}
          onClick={() => setIsOpen(false)} 
        />
        
        {/* Responsive Menu: Bottom Sheet on Mobile, Dropdown on Desktop */}
        <div 
          className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:mt-2 w-full sm:w-72 bg-crm-surface sm:border border-crm-border shadow-sm rounded-t-3xl sm:rounded-xl shadow-2xl overflow-hidden pb-safe"
          style={{ zIndex: 99999 }}
        >
           <div className="p-6 sm:p-4 border-b border-crm-border flex flex-col items-center bg-crm-bg relative">
             {/* Mobile drag handle indicator */}
             <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-5 sm:hidden absolute top-3"></div>
             
             <p className="text-crm-muted truncate mb-4 sm:mb-3 w-full text-center mt-2 sm:mt-0 text-base md:text-lg">{user.email}</p>
             <div className="bg-crm-surface p-3 sm:p-2 rounded-2xl shadow-inner inline-block border border-crm-border shadow-sm">
               {/* QR Code scales down slightly on desktop */}
               <QRCodeSVG value={profile?.barcode || user.id} size={160} className="sm:w-[120px] sm:h-[120px]" level="L" />
             </div>
             <p className="text-crm-muted mt-4 sm:mt-2 text-center uppercase tracking-widest font-bold text-base md:text-lg">My Check-in Code</p>
           </div>
           
           {/* Menu Actions */}
           <div className="p-4 sm:p-2 space-y-2 sm:space-y-1 bg-crm-surface pb-20 sm:pb-2">
              <Link onClick={() => setIsOpen(false)} href="/my-appointments" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-medium">
                My Appointments
              </Link>
              <button onClick={() => { setIsOpen(false); setIsOverlayOpen(true); }} className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-medium">
                Profile
              </button>
              <Link onClick={() => setIsOpen(false)} href="/update-password" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-medium">
                Change Password
              </Link>
              
              <div className="h-px bg-crm-border my-3 sm:my-1" />
              
              <button 
                onClick={() => { setIsOpen(false); handleSignOut(); }} 
                className="block w-full text-center sm:text-left px-4 py-4 sm:py-2 text-base sm:text-sm text-status-cancelled hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-bold border border-red-200 sm:border-transparent bg-red-50 sm:bg-transparent"
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
          onClick={() => {
            // For the user request, let's open the profile overlay directly
            setIsOverlayOpen(true);
            // setIsOpen(!isOpen); // Keep dropdown or override it entirely? Let's just open overlay directly to be safe and match "click on the profile".
          }}
          className="flex items-center gap-2 bg-crm-surface hover:bg-crm-bg border border-crm-border shadow-sm px-3 py-1.5 rounded-full transition-colors shadow-sm"
        >
          <div className="w-6 h-6 rounded-full bg-crm-primary flex items-center justify-center text-white font-bold text-xs shadow-inner hover:opacity-90">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>

        {isOpen && (mounted && isMobile ? createPortal(menuContent, document.body) : menuContent)}
        
        <CustomerProfileOverlay 
          isOpen={isOverlayOpen} 
          onClose={() => setIsOverlayOpen(false)} 
          customerName={user.email?.split('@')[0]}
          customerEmail={user.email}
        />
      </div>
    );
  }

  return (
    <Link 
      href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl || typeof window !== 'undefined' ? window.location.pathname : '/')}`} 
      className="bg-crm-surface hover:bg-crm-bg text-crm-text px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-crm-border shadow-sm"
    >
      Sign In
    </Link>
  );
}