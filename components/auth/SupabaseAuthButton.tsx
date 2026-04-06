'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SupabaseAuthButton({ 
  redirectUrl 
}: { 
  redirectUrl?: string 
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };

    fetchUser();

    // Listen for auth changes (like signing in from another tab)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
      <div className="relative group inline-block z-50">
        <button className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 px-3 py-1.5 rounded-full transition-colors">
          <div className="w-6 h-6 rounded-full bg-brand-gold flex items-center justify-center text-brand-dark font-bold text-xs">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </button>
        {/* Dropdown Menu */}
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
           <div className="p-3 border-b border-white/5">
             <p className="text-xs text-gray-400 truncate">{user.email}</p>
           </div>
           <div className="p-1">
              <Link href="/my-appointments" className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                My Appointments
              </Link>
              <Link href="/update-password" className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Change Password
              </Link>
              <button 
                onClick={handleSignOut} 
                className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
              >
                Sign Out
              </button>
           </div>
        </div>
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
