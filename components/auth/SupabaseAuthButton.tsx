'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function SupabaseAuthButton({ 
  redirectUrl 
}: { 
  redirectUrl?: string 
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
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
    return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>;
  }

  if (user) {
    return (
      <div className="relative inline-block z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 px-3 py-1.5 rounded-full transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-brand-gold flex items-center justify-center text-brand-dark font-bold text-xs">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>

        {isOpen && (
          <>
            {/* Dark overlay for mobile, invisible on desktop */}
            <div 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none transition-opacity" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Responsive Menu: Bottom Sheet on Mobile, Dropdown on Desktop */}
            <div className="fixed sm:absolute bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:mt-2 w-full sm:w-72 bg-slate-900 sm:border border-white/10 rounded-t-3xl sm:rounded-xl shadow-2xl z-50 overflow-hidden transform transition-transform duration-300 translate-y-0 sm:translate-y-0 animate-in slide-in-from-bottom-10 sm:slide-in-from-top-2 sm:fade-in">
               <div className="p-6 sm:p-4 border-b border-white/5 flex flex-col items-center bg-slate-800/50 relative">
                 {/* Mobile drag handle indicator */}
                 <div className="w-12 h-1.5 bg-gray-600 rounded-full mb-5 sm:hidden absolute top-3"></div>
                 
                 <p className="text-sm sm:text-xs text-gray-400 truncate mb-4 sm:mb-3 w-full text-center mt-2 sm:mt-0">{user.email}</p>
                 <div className="bg-white p-3 sm:p-2 rounded-2xl shadow-inner inline-block">
                   {/* QR Code scales down slightly on desktop */}
                   <QRCodeSVG value={profile?.barcode || user.id} size={160} className="sm:w-[120px] sm:h-[120px]" level="L" />
                 </div>
                 <p className="text-xs sm:text-[10px] text-gray-500 mt-4 sm:mt-2 text-center uppercase tracking-widest font-bold">My Check-in Code</p>
               </div>
               
               {/* Menu Actions */}
               <div className="p-4 sm:p-2 space-y-2 sm:space-y-1 bg-slate-900 pb-8 sm:pb-2">
                  <Link onClick={() => setIsOpen(false)} href="/my-appointments" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">
                    My Appointments
                  </Link>
                  <Link onClick={() => setIsOpen(false)} href="/my-appointments/profile" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">
                    My QR Code
                  </Link>
                  <Link onClick={() => setIsOpen(false)} href="/my-appointments/profile" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">
                    Edit Profile
                  </Link>
                  <Link onClick={() => setIsOpen(false)} href="/update-password" className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium">
                    Change Password
                  </Link>
                  
                  <div className="h-px bg-white/10 my-3 sm:my-1" />
                  
                  <button 
                    onClick={() => { setIsOpen(false); handleSignOut(); }} 
                    className="block w-full text-center sm:text-left px-4 py-3.5 sm:py-2 text-base sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                  >
                    Sign Out
                  </button>
               </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Link 
      href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl || typeof window !== 'undefined' ? window.location.pathname : '/')}`} 
      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
    >
      Sign In
    </Link>
  );
}
