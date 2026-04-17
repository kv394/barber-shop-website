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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
        {/* Dark overlay for both mobile and desktop */}
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
          style={{ zIndex: 99998 }}
          onClick={() => setIsOpen(false)} 
        />
        
        {/* Responsive Menu: Centered Modal Overlay */}
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-crm-surface border border-crm-border shadow-2xl rounded-2xl overflow-hidden"
          style={{ zIndex: 99999 }}
        >
           <div className="p-6 border-b border-crm-border flex flex-col items-center bg-crm-bg relative">
             <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
             
             <p className="text-crm-text font-bold truncate mb-5 w-full text-center text-lg">{user.email}</p>
             <div className="bg-crm-surface p-4 rounded-2xl shadow-inner inline-block border border-crm-border">
               <QRCodeSVG value={profile?.barcode || user.id} size={160} level="L" />
             </div>
             <p className="text-crm-muted mt-5 text-center uppercase tracking-widest font-bold text-xs">My Check-in Code</p>
           </div>
           
           {/* Menu Actions */}
           <div className="p-3 space-y-1.5 bg-crm-surface">
              <Link onClick={() => setIsOpen(false)} href="/my-appointments" className="block w-full text-center px-4 py-3 text-sm text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-semibold">
                My Appointments
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/my-appointments/profile" className="block w-full text-center px-4 py-3 text-sm text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-semibold">
                Edit Profile
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/update-password" className="block w-full text-center px-4 py-3 text-sm text-crm-text hover:text-crm-primary hover:bg-crm-bg rounded-xl transition-colors font-semibold">
                Change Password
              </Link>
              
              <div className="h-px bg-crm-border my-2" />
              
              <button 
                onClick={() => { setIsOpen(false); handleSignOut(); }} 
                className="block w-full text-center px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors font-bold"
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
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-crm-surface hover:bg-crm-bg border border-crm-border shadow-sm px-3 py-1.5 rounded-full transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-crm-primary flex items-center justify-center text-white font-bold text-xs shadow-inner hover:opacity-90">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>

        {isOpen && mounted && createPortal(menuContent, document.body)}
      </div>
    );
  }

  return (
    <Link 
      href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl || typeof window !== 'undefined' ? window.location.pathname : '/')}`} 
      className="bg-crm-surface hover:bg-crm-bg text-crm-text px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm border border-crm-border"
    >
      Sign In
    </Link>
  );
}