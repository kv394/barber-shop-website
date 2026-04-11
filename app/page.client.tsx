'use client';

import { useState, useEffect, FormEvent } from 'react';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import Link from 'next/link';
import DeleteShopButton from '@/components/shop-admin/DeleteShopButton';
import BarcodeScannerWrapper from '@/components/checkout/BarcodeScannerWrapper';
import { useRouter } from 'next/navigation';

type Shop = {
  id: string;
  name: string;
  description: string | null;
  users: { role: string }[];
};

type UserProfile = {
  id: string;
  role: 'SUPER_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'CLIENT' | 'ATTENDANCE_KIOSK';
  name: string | null;
  email: string;
  shopId?: string;
  shop?: { name: string, id: string, slug?: string };
} | null;

type ActiveLog = {
    id: string;
    clockIn: string;
    user: {
        name: string | null;
        email: string;
    }
}

type WaitlistEntry = {
    id: string;
    clientName: string;
    status: string;
    position: number;
    createdAt: string;
}

function KioskMode({ userProfile }: { userProfile: UserProfile }) {
    const [activeLogs, setActiveLogs] = useState<ActiveLog[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    const fetchKioskData = async () => {
        if (!userProfile?.shopId) return;
        try {
            const [attendanceRes, waitlistRes] = await Promise.all([
                fetch(`/api/shops/${userProfile.shopId}/attendance`),
                fetch(`/api/shops/${userProfile.shopId}/waitlist`)
            ]);
            
            if (attendanceRes.ok) {
                const attendanceData = await attendanceRes.json();
                setActiveLogs(attendanceData);
            }
            if (waitlistRes.ok) {
                const waitlistData = await waitlistRes.json();
                setWaitlist(waitlistData);
            }
        } catch (error) {
            console.error("Failed to fetch kiosk data", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchKioskData();
        // Refresh the list every 30 seconds
        const interval = setInterval(fetchKioskData, 30000);
        return () => clearInterval(interval);
    }, [userProfile?.shopId]);

    return (
        <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
                <SupabaseAuthButton />
            </div>
            
            {/* Header */}
            <div className="text-center w-full max-w-7xl mx-auto flex-shrink-0 mb-6 md:mb-10 mt-4">
                <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl font-bold text-brand-gold mb-2">
                    {userProfile?.shop?.name || "Shop Hub"}
                </h1>
                <h2 className="text-xl md:text-2xl lg:text-4xl text-gray-300">Time & Attendance Kiosk</h2>
            </div>
            
            {/* Main Content */}
            <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col justify-center pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full min-h-[600px]">
                    
                    {/* Scanner Section (Left Side on Large Screens) */}
                    <div className="lg:col-span-5 bg-white/5 p-6 md:p-8 lg:p-12 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-brand-gold/10 transition-colors duration-700"></div>

                        <div className="bg-brand-gold/10 text-brand-gold p-4 rounded-full mb-6 z-10 border border-brand-gold/20">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                            </svg>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center z-10">Scan ID</h3>
                        <p className="text-gray-400 mb-8 md:mb-12 text-center text-lg z-10 max-w-xs">Staff members, please scan your personal QR code to clock in or out.</p>
                        
                        {userProfile?.shopId ? (
                            <div className="transform scale-125 md:scale-150 lg:scale-[1.7] origin-center inline-block bg-white p-3 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 border-4 border-slate-200">
                                <BarcodeScannerWrapper shopId={userProfile.shopId} services={[]} />
                            </div>
                        ) : (
                            <p className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500/30 z-10">Error: Kiosk not assigned to a shop.</p>
                        )}
                    </div>

                    {/* Lists Section (Right Side on Large Screens) */}
                    <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
                        
                        {/* Clocked In Staff */}
                        <div className="flex-1 bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[50vh] lg:max-h-[350px]">
                            <div className="flex items-center gap-4 mb-6 shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/30">👥</div>
                                <h3 className="text-2xl md:text-3xl font-serif text-white">Currently Clocked In</h3>
                                <span className="ml-auto bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/30">
                                    {activeLogs.length} Staff
                                </span>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                {isLoadingLogs ? (
                                    <div className="flex justify-center items-center h-full min-h-[100px]">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                                    </div>
                                ) : activeLogs.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {activeLogs.map(log => (
                                            <div key={log.id} className="bg-black/40 p-4 rounded-xl flex justify-between items-center gap-3 border border-white/5 hover:border-white/20 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white text-lg truncate">{log.user.name || log.user.email.split('@')[0]}</p>
                                                    <p className="text-xs text-gray-500 truncate">{log.user.email}</p>
                                                </div>
                                                <div className="text-right shrink-0 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">In since</p>
                                                    <span className="text-brand-gold font-mono text-base font-bold">
                                                        {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8 min-h-[150px]">
                                        <span className="text-4xl mb-3 opacity-50">📭</span>
                                        <p className="italic text-lg">No staff currently clocked in.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Checked-In Clients */}
                        <div className="flex-1 bg-white/5 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[50vh] lg:max-h-[350px]">
                            <div className="flex items-center gap-4 mb-6 shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl border border-purple-500/30">🛋️</div>
                                <h3 className="text-2xl md:text-3xl font-serif text-white">Checked-In Clients</h3>
                                <span className="ml-auto bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-500/30">
                                    {waitlist.length} Waiting
                                </span>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                {isLoadingLogs ? (
                                    <div className="flex justify-center items-center h-full min-h-[100px]">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                                    </div>
                                ) : waitlist.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {waitlist.map(entry => (
                                            <div key={entry.id} className={`p-4 rounded-xl flex justify-between items-center gap-3 border ${entry.status === 'SERVING' ? 'bg-green-900/20 border-green-500/30' : 'bg-black/40 border-white/5'}`}>
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-lg shrink-0 border ${entry.status === 'SERVING' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-slate-800 text-gray-400 border-slate-700'}`}>
                                                        {entry.position}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white text-lg truncate">{entry.clientName}</p>
                                                        <p className="text-xs text-gray-400">Arrived {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${entry.status === 'SERVING' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8 min-h-[150px]">
                                        <span className="text-4xl mb-3 opacity-50">✨</span>
                                        <p className="italic text-lg">No clients currently waiting.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    )
}


export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [newShopName, setNewShopName] = useState('');
  const [newShopAdminEmail, setNewShopAdminEmail] = useState('');
  const [kioskEmail, setKioskEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const router = useRouter();

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      setShops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      setShops([]);
    }
  };

  useEffect(() => {
    // Fetch user data from our own API using Supabase
    const fetchUserData = async () => {
      try {
          let res = await fetch(`/api/users/me`);
          
          if (res.ok) {
              const profile = await res.json();
              
              // Construct a slug for redirecting CLIENTs if they have a shop
              if (profile.shopId && profile.shop) {
                  profile.shop.slug = profile.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
              }
              
              setUserProfile(profile);
          } else {
              setUserProfile(null); 
          }
      } catch (e) {
          setUserProfile(null);
      } finally {
          setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userProfile?.role === 'SUPER_ADMIN') {
      fetchShops();
    }
  }, [userProfile]);

  // AUTOMATIC REDIRECTS FOR SHOP ROLES
  useEffect(() => {
    if (!isLoading && userProfile) {
      if (userProfile.role === 'SHOP_ADMIN' || userProfile.role === 'STAFF') {
        if (userProfile.shopId) {
          router.push(`/shop/${userProfile.shopId}`);
        }
      } else if (userProfile.role === 'CLIENT' && userProfile.shop?.slug) {
        // Automatically redirect clients to their specific shop portal instead of the generic homepage
        router.push(`/shops/${userProfile.shop.slug}`);
      }
    }
  }, [isLoading, userProfile, router]);

  const handleCreateShop = async (e: FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !kioskEmail.trim()) {
        setCreateError("Shop Name and Kiosk Email are required.");
        return;
    };
    setCreateError(null);

    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: newShopName,
            kioskEmail: kioskEmail,
            adminEmail: newShopAdminEmail.trim() || null
        }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create shop');
      }

      setNewShopName('');
      setNewShopAdminEmail('');
      setKioskEmail('');
      fetchShops();
    } catch (error: any) {
      console.error('Failed to create shop:', error);
      setCreateError(error.message || 'An unexpected error occurred');
    }
  };

  const handleShopDeleted = () => {
    fetchShops();
  };

  if (isLoading) {
    return <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">Loading...</div>;
  }

  if (userProfile?.role === 'ATTENDANCE_KIOSK') {
      return <KioskMode userProfile={userProfile} />;
  }

  // If they are a shop user and have a shop, they will be redirected by the useEffect above
  // We can return a loading state while the redirect happens
  if (userProfile?.shopId && userProfile.role !== 'SUPER_ADMIN') {
    return <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">Redirecting to your shop portal...</div>;
  }

  const isSignedIn = !!userProfile;

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-4xl">
        
        <header className="flex justify-between items-center mb-8 sm:mb-12">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            {userProfile?.role === 'SUPER_ADMIN' ? (
                <><span className="text-white">Barber</span><span className="text-brand-gold">SaaS</span></>
            ) : userProfile?.shop?.name ? (
                <span className="text-brand-gold">{userProfile.shop.name}</span>
            ) : (
                <><span className="text-white">Booking</span> <span className="text-brand-gold">Portal</span></>
            )}
          </h1>
          <div>
            <SupabaseAuthButton />
          </div>
        </header>

        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold">
            {isSignedIn ? `Welcome, ${userProfile?.name || 'User'}` : "Book Your Next Appointment"}
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-brand-gold">
            {userProfile ? (userProfile.role === 'SUPER_ADMIN' ? 'Platform Administrator' : '') : (isSignedIn ? 'Loading...' : 'Please sign in to continue.')}
          </p>
        </div>

        <div>
          {userProfile?.role === 'SUPER_ADMIN' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white/10 p-6 sm:p-8 rounded-lg border border-white/10">
                <h2 className="text-xl sm:text-2xl font-serif text-white mb-2">Super Admin Control Panel</h2>
                <p className="text-sm text-gray-400 mb-6">Manage the entire platform from the dedicated dashboard.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link href="/superadmin" className="bg-brand-gold text-brand-dark px-6 py-4 rounded-lg font-semibold hover:bg-white transition-colors text-center">
                    📊 Platform Dashboard
                  </Link>
                  <Link href="/superadmin/shops" className="bg-white/10 text-white px-6 py-4 rounded-lg font-semibold hover:bg-white/20 transition-colors text-center">
                    🏪 Manage Shops
                  </Link>
                  <Link href="/superadmin/logs" className="bg-red-900/30 text-red-400 px-6 py-4 rounded-lg font-semibold hover:bg-red-800/50 transition-colors text-center border border-red-500/30">
                    🚨 System Logs
                  </Link>
                </div>
              </div>

              {/* Quick Shop Create */}
              <div className="bg-white/10 p-4 sm:p-6 md:p-8 rounded-lg border border-white/10">
                <h2 className="text-xl sm:text-2xl font-serif text-white mb-1">Quick Create Shop</h2>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">Provision a new tenant workspace.</p>

                {createError && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
                        {createError}
                    </div>
                )}

                <form onSubmit={handleCreateShop} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label className="block text-sm text-gray-400 mb-1">Shop Name *</label>
                          <input 
                              type="text" 
                              value={newShopName} 
                              onChange={(e) => setNewShopName(e.target.value)} 
                              placeholder="e.g., Downtown Barbers" 
                              className="w-full bg-black/40 border border-white/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-gray-400 mb-1">Kiosk Email *</label>
                          <input
                              type="email" 
                              value={kioskEmail} 
                              onChange={(e) => setKioskEmail(e.target.value)} 
                              placeholder="kiosk@example.com" 
                              className="w-full bg-black/40 border border-white/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-gray-400 mb-1">Admin Email (Optional)</label>
                          <input
                              type="email" 
                              value={newShopAdminEmail} 
                              onChange={(e) => setNewShopAdminEmail(e.target.value)} 
                              placeholder="admin@shop.com" 
                              className="w-full bg-black/40 border border-white/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                          />
                      </div>
                  </div>
                  <button type="submit" className="w-full bg-brand-gold text-brand-dark px-8 py-3 rounded-md font-semibold hover:bg-white transition-colors">
                      Create Shop Workspace
                  </button>
                </form>
              </div>

              {/* Recent Shops Quick View */}
              {shops && shops.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl sm:text-2xl font-serif">Shops ({shops.length})</h2>
                    <Link href="/superadmin/shops" className="text-brand-gold text-sm hover:underline">View All →</Link>
                  </div>
                  <div className="space-y-3">
                    {shops.slice(0, 5).map((shop) => {
                       const hasAdmin = (shop.users || []).some(u => u.role === 'SHOP_ADMIN');
                       return (
                          <div key={shop.id} className="bg-white/5 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-colors border border-white/5 shadow-md">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                              <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                      <h3 className="text-base sm:text-xl font-semibold text-white truncate">{shop.name}</h3>
                                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${hasAdmin ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                          {hasAdmin ? 'Active' : 'Needs Admin'}
                                      </span>
                                  </div>
                                  <Link href={`/shop/${shop.id}/settings/team`} className="text-xs sm:text-sm text-brand-gold hover:underline mt-1 inline-block">
                                      Assign Team
                                  </Link>
                              </div>
                              <div className="shrink-0">
                                <DeleteShopButton shopId={shop.id} shopName={shop.name} onSuccess={handleShopDeleted} />
                              </div>
                            </div>
                          </div>
                       );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* CLIENT Fallback (if they don't have a shopId yet) */}
          {userProfile?.role === 'CLIENT' && !userProfile.shopId && (
            <div className="bg-white/10 p-8 rounded-lg text-center border border-white/10">
              <h2 className="text-2xl font-serif mb-4">Welcome back!</h2>
              <p className="text-gray-300 mb-6">Browse available shops and book your appointments.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/shops" className="inline-block bg-white/20 text-white px-8 py-3 rounded-md font-semibold hover:bg-white/30 transition-colors">
                  Browse Shops
                </Link>
              </div>
            </div>
          )}
          
          {!userProfile && isSignedIn && (
            <div className="bg-white/10 p-8 rounded-lg text-center border border-white/10">
              <p className="text-gray-300">Your profile is being set up. Please refresh the page.</p>
            </div>
          )}
          
          {!isSignedIn && (
            <div className="bg-white/10 p-8 rounded-lg text-center border border-white/10">
              <p className="text-gray-300 mb-6">Sign in to access your portal or browse available shops.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/shops" className="inline-block bg-white/20 text-white px-8 py-3 rounded-md font-semibold hover:bg-white/30 transition-colors">
                  Browse Shops
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
