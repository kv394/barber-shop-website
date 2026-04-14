'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';

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
    return <div className="w-8 h-8 rounded-full bg-botanical-surface animate-pulse border border-botanical-border shadow-sm"></div>;
  }

  if (user) {
    const menuContent = (
      <>
        {/* Dark overlay for mobile, invisible on desktop */}
        <div 
          className="fixed inset-0 bg-black/60 sm:bg-transparent transition-opacity" 
          style={{ zIndex: 99998 }}
          onClick={() => setIsOpen(false)} 
        />
        
        {/* Responsive Menu: Bottom Sheet on Mobile, Dropdown on Desktop */}
        <div 
          className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:mt-2 w-full sm:w-72 bg-botanical-surface sm:border border-botanical-border shadow-sm rounded-t-3xl sm:rounded-xl shadow-2xl overflow-hidden pb-safe"
          style={{ zIndex: 99999 }}
        >
           <div className="p-6 sm:p-4 border-b border-botanical-border flex flex-col items-center bg-botanical-bg relative">
             {/* Mobile drag handle indicator */}
             <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-5 sm:hidden absolute top-3"></div>
             
             <p className="text-botanical-muted truncate mb-4 sm:mb-3 w-full text-center mt-2 sm:mt-0 text-base md:text-lg">{user.email}</p>
             <div className="bg-white p-3 sm:p-2 rounded-2xl shadow-inner inline-block border border-botanical-border shadow-sm">
               {/* QR Code scales down slightly on desktop */}
               <QRCodeSVG value={profile?.barcode || user.id} size={160} className="sm:w-[120px] sm:h-[120px]" level="L" />
             </div>
             <p className="text-botanical-muted mt-4 sm:mt-2 text-center uppercase tracking-widest font-bold text-base md:text-lg">My Check-in Code</p>
           </div>
           
           {/* Menu Actions */}
           <div className="p-4 sm:p-2 space-y-2 sm:space-y-1 bg-botanical-surface pb-20 sm:pb-2">
              <Link onClick={() => setIsOpen(false)} href="/my-appointments" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-botanical-text hover:text-botanical-primary hover:bg-botanical-bg rounded-xl transition-colors font-medium">
                My Appointments
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/my-appointments/profile" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-botanical-text hover:text-botanical-primary hover:bg-botanical-bg rounded-xl transition-colors font-medium">
                Edit Profile
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/update-password" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-botanical-text hover:text-botanical-primary hover:bg-botanical-bg rounded-xl transition-colors font-medium">
                Change Password
              </Link>
              
              <div className="h-px bg-botanical-border my-3 sm:my-1" />
              
              <button 
                onClick={() => { setIsOpen(false); handleSignOut(); }} 
                className="block w-full text-center sm:text-left px-4 py-4 sm:py-2 text-base sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-bold border border-red-200 sm:border-transparent bg-red-50 sm:bg-transparent"
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
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-botanical-surface hover:bg-botanical-bg border border-botanical-border shadow-sm px-3 py-1.5 rounded-full transition-colors shadow-sm"
        >
          <div className="w-6 h-6 rounded-full bg-botanical-primary flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>

        {isOpen && (mounted && isMobile ? createPortal(menuContent, document.body) : menuContent)}
      </div>
    );
  }

  return (
    <Link 
      href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl || typeof window !== 'undefined' ? window.location.pathname : '/')}`} 
      className="bg-botanical-surface hover:bg-botanical-bg text-botanical-text px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-botanical-border shadow-sm"
    >
      Sign In
    </Link>
  );
}