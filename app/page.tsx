'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import Link from 'next/link';
import DeleteShopButton from '@/components/DeleteShopButton';
import BarcodeScannerWrapper from '@/components/BarcodeScannerWrapper';

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
  shop?: { name: string };
} | null;

type ActiveLog = {
    id: string;
    clockIn: string;
    user: {
        name: string | null;
        email: string;
    }
}

function KioskMode({ userProfile }: { userProfile: UserProfile }) {
    const [activeLogs, setActiveLogs] = useState<ActiveLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    const fetchActiveLogs = async () => {
        if (!userProfile?.shopId) return;
        try {
            const response = await fetch(`/api/shops/${userProfile.shopId}/attendance`);
            if (response.ok) {
                const data = await response.json();
                setActiveLogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch active logs", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchActiveLogs();
        // Refresh the list every 30 seconds
        const interval = setInterval(fetchActiveLogs, 30000);
        return () => clearInterval(interval);
    }, [userProfile?.shopId]);

    return (
        <main className="min-h-screen flex-col items-center justify-center bg-brand-dark text-white p-4 md:p-8">
            <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <UserButton afterSignOutUrl="/" />
            </div>
            <div className="text-center w-full max-w-7xl mx-auto">
                <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-bold text-brand-gold mb-2">
                    {userProfile?.shop?.name || "Shop Hub"}
                </h1>
                <h2 className="text-lg sm:text-xl md:text-3xl mb-6 sm:mb-8 md:mb-12 text-gray-300">Time & Attendance Kiosk</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                    <div className="bg-white/5 p-4 sm:p-6 md:p-12 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center">
                        <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-xl">Staff, please scan your ID card to clock in or out.</p>
                        
                        {userProfile?.shopId ? (
                            <div className="transform scale-125 md:scale-150 origin-center inline-block">
                                <BarcodeScannerWrapper shopId={userProfile.shopId} services={[]} />
                            </div>
                        ) : (
                            <p className="text-red-400">Error: Kiosk not assigned to a shop.</p>
                        )}
                    </div>

                    <div className="bg-white/5 p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl">
                        <h3 className="text-xl sm:text-3xl font-serif text-brand-gold mb-4 sm:mb-6">Currently Clocked In</h3>
                        {isLoadingLogs ? (
                            <p className="text-gray-400 text-sm">Loading...</p>
                        ) : activeLogs.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4 text-left">
                                {activeLogs.map(log => (
                                    <div key={log.id} className="bg-black/40 p-3 sm:p-4 rounded-lg flex justify-between items-center gap-2">
                                        <span className="font-semibold text-white text-sm sm:text-lg truncate">{log.user.name || log.user.email}</span>
                                        <span className="text-sm sm:text-lg text-gray-300 font-mono shrink-0">
                                            {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic py-12 text-center">No staff currently clocked in.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}


export default function Home() {
  const { isSignedIn, user: clerkUser } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [newShopName, setNewShopName] = useState('');
  const [newShopAdminEmail, setNewShopAdminEmail] = useState('');
  const [kioskEmail, setKioskEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

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
    const fetchUserData = async () => {
      if (isSignedIn && clerkUser) {
        try {
            let res = await fetch(`/api/users/clerk/${clerkUser.id}`);
            
            if (!res.ok && res.status === 404) {
              const initRes = await fetch('/api/users/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: clerkUser.emailAddresses[0]?.emailAddress,
                  name: clerkUser.firstName,
                }),
              });
              
              if (initRes.ok) {
                res = initRes;
              }
            }
            
            if (res.ok) {
                const profile = await res.json();
                setUserProfile(profile);
            } else {
                setUserProfile(null); 
            }
        } catch (e) {
            setUserProfile(null);
        }
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    if (userProfile?.role === 'SUPER_ADMIN') {
      fetchShops();
    }
  }, [userProfile]);

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
    return <div className="flex min-h-screen items-center justify-center bg-brand-dark text-white">Loading...</div>;
  }

  if (userProfile?.role === 'ATTENDANCE_KIOSK') {
      return <KioskMode userProfile={userProfile} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-brand-dark text-white p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl">
        
        <header className="flex justify-between items-center mb-8 sm:mb-12">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            <span className="text-white">Barber</span><span className="text-brand-gold">SaaS</span>
          </h1>
          <div>
            {isSignedIn ? <UserButton afterSignOutUrl="/" /> : 
              <div className="bg-brand-gold text-brand-dark px-6 py-2.5 rounded-md font-semibold hover:bg-white transition-colors"><SignInButton /></div>
            }
          </div>
        </header>

        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold">
            {isSignedIn ? `Welcome, ${clerkUser?.firstName}` : "Future of Barber Shop Management"}
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-brand-gold">
            {userProfile ? `You are logged in as: ${userProfile.role}` : (isSignedIn ? 'Checking your role...' : 'Please sign in.')}
          </p>
        </div>

        <div>
          {userProfile?.role === 'SUPER_ADMIN' && (
            <div>
              <div className="mb-8 sm:mb-12 bg-white/10 p-4 sm:p-6 md:p-8 rounded-lg border border-white/10">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-white">Provision a New Shop</h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Create a new tenant workspace, assign its primary administrator, and provide an email for the attendance kiosk.</p>
                  </div>
                  <Link href="/superadmin/logs" className="bg-red-900/30 hover:bg-red-800/50 text-red-400 text-xs font-bold px-4 py-2 rounded-lg border border-red-500/30 transition">
                    🚨 Monitor System Logs
                  </Link>
                </div>
                
                {createError && (
                    <div className="mb-4 mt-6 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
                        {createError}
                    </div>
                )}

                <form onSubmit={handleCreateShop} className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <label className="block text-sm text-gray-400 mb-1">Kiosk Email Address *</label>
                          <input 
                              type="email" 
                              value={kioskEmail} 
                              onChange={(e) => setKioskEmail(e.target.value)} 
                              placeholder="kiosk@example.com" 
                              className="w-full bg-black/40 border border-white/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                              required
                          />
                      </div>
                      <div className="md:col-span-2">
                          <label className="block text-sm text-gray-400 mb-1">Primary Shop Admin Email (Optional)</label>
                          <input 
                              type="email" 
                              value={newShopAdminEmail} 
                              onChange={(e) => setNewShopAdminEmail(e.target.value)} 
                              placeholder="admin@shop.com" 
                              className="w-full bg-black/40 border border-white/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                          />
                      </div>
                  </div>
                  <button type="submit" className="w-full bg-brand-gold text-brand-dark px-8 py-3 rounded-md font-semibold hover:bg-white transition-colors mt-2">
                      Create Shop Workspace
                  </button>
                </form>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif mb-4">Existing Shops</h2>
                {shops && shops.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {shops.map((shop) => {
                       const hasAdmin = shop.users.some(u => u.role === 'SHOP_ADMIN');
                       const statusText = hasAdmin ? "Active" : "Needs Admin";
                       const statusColor = hasAdmin ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400";
                       const linkText = hasAdmin ? "Manage Tenant" : "Assign Admin";
                       const linkPath = hasAdmin ? `/shop/${shop.id}/config` : `/shop/${shop.id}/settings/team`;

                       return (
                          <div key={shop.id} className="bg-white/5 p-4 sm:p-6 rounded-lg hover:bg-white/10 transition-colors border border-white/5 shadow-md group">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                              <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                      <h3 className="text-base sm:text-xl font-semibold text-white truncate">{shop.name}</h3>
                                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${statusColor}`}>
                                          {statusText}
                                      </span>
                                  </div>
                                  <Link href={linkPath} className="text-xs sm:text-sm text-brand-gold hover:underline mt-1 inline-block">
                                      {linkText}
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
                ) : (
                  <div className="bg-white/5 p-6 rounded-lg text-center">
                    <p className="text-gray-400">No shops created yet. Create one above to get started!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {(userProfile?.role === 'SHOP_ADMIN' || userProfile?.role === 'STAFF') && (
            <div className="bg-white/10 p-4 sm:p-6 md:p-8 rounded-lg text-center">
              <h2 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">{userProfile.role === 'STAFF' ? 'Staff Portal' : 'Shop Admin Dashboard'}</h2>
              {userProfile.shop ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 mb-2">You are assigned to:</p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-brand-gold mb-4 sm:mb-6">{userProfile.shop.name}</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <Link href={`/shop/${userProfile.shopId}/bookings`} className="inline-block bg-brand-gold text-brand-dark px-8 py-3 rounded-md font-semibold hover:bg-white transition-colors">
                        Enter Dashboard
                    </Link>
                    <BarcodeScannerWrapper shopId={userProfile.shopId} services={[]} />
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 p-6 rounded-lg text-center">
                  <p className="text-gray-400">You haven't been assigned to a shop yet.</p>
                </div>
              )}
            </div>
          )}
          
          {userProfile?.role === 'CLIENT' && (
            <div className="bg-white/10 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-serif mb-4">Welcome!</h2>
              <p className="text-gray-300 mb-6">Browse available shops and book your appointments.</p>
              <Link href="/shops" className="inline-block bg-brand-gold text-brand-dark px-8 py-3 rounded-md font-semibold hover:bg-white transition-colors">
                Browse Shops
              </Link>
            </div>
          )}
          
          {!userProfile && isSignedIn && (
            <div className="bg-white/10 p-8 rounded-lg text-center">
              <p className="text-gray-300">Your profile is being set up. Please refresh the page.</p>
            </div>
          )}
          
          {!isSignedIn && (
            <div className="bg-white/10 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-serif mb-4">Get Started</h2>
              <p className="text-gray-300 mb-6">Sign in to access your dashboard or browse available shops.</p>
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
