'use client';

import { useState, useEffect, FormEvent } from 'react';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import Link from 'next/link';
import DeleteShopButton from '@/components/shop-admin/DeleteShopButton';
import BarcodeScannerWrapper from '@/components/checkout/BarcodeScannerWrapper';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const KioskMode = dynamic(() => import('@/components/kiosk/KioskMode'), { ssr: false, loading: () => <div className="h-[100dvh] flex items-center justify-center bg-crm-bg text-crm-accent">Loading Kiosk...</div> });

type Shop = {
  id: string;
  name: string;
  description: string | null;
  users: { role: string }[];
};

type UserProfile = {
  id: string;
  role: 'SITE_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'CLIENT' | 'ATTENDANCE_KIOSK';
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
    if (userProfile?.role === 'SITE_ADMIN') {
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
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden flex items-center justify-center bg-crm-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-crm-muted animate-pulse font-medium tracking-wide uppercase text-[13px]">Initializing Platform...</p>
        </div>
      </div>
    );
  }

  if (userProfile?.role === 'ATTENDANCE_KIOSK') {
      return <KioskMode userProfile={userProfile} />;
  }

  // If they are a shop user and have a shop, they will be redirected by the useEffect above
  // We can return a loading state while the redirect happens
  if (userProfile?.shopId && userProfile.role !== 'SITE_ADMIN') {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden flex items-center justify-center bg-crm-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-crm-accent animate-pulse font-medium tracking-wide uppercase text-[13px]">Entering Shop Portal...</p>
        </div>
      </div>
    );
  }

  const isSignedIn = !!userProfile;

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-bg flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-grow">
        
        <header className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-12 sm:mb-20">
          <h1 className="font-serif font-bold tracking-tight text-2xl">
            {userProfile?.role === 'SITE_ADMIN' ? (
                <><span className="text-crm-text">Barber</span><span className="text-crm-accent">SaaS</span></>
            ) : userProfile?.shop?.name ? (
                <span className="text-crm-accent">{userProfile.shop.name}</span>
            ) : (
                <><span className="text-crm-text">Booking</span> <span className="text-crm-accent">Portal</span></>
            )}
          </h1>
          <div>
            <SupabaseAuthButton />
          </div>
        </header>

        <div className="text-center mb-12 sm:mb-20">
          <h2 className="font-serif font-bold leading-tight tracking-tight text-crm-text max-w-4xl mx-auto drop-shadow-sm text-xl">
            {isSignedIn ? `Welcome, ${userProfile?.name || 'User'}` : "Book Your Next Appointment"}
          </h2>
          <p className="mt-4 sm:mt-6 text-crm-accent/80 font-medium tracking-wide text-[13px]">
            {userProfile ? (userProfile.role === 'SITE_ADMIN' ? 'Platform Administrator Dashboard' : '') : (isSignedIn ? 'Loading...' : 'Please sign in to continue.')}
          </p>
        </div>

        <div>
          {userProfile?.role === 'SITE_ADMIN' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-crm-surface p-6 sm:p-8 rounded-lg border border-crm-border shadow-sm">
                <h2 className="font-serif text-crm-text mb-2 text-xl font-bold">Site Admin Control Panel</h2>
                <p className="text-crm-muted mb-6 text-[13px]">Manage the entire platform from the dedicated dashboard.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link href="/siteadmin" className="bg-crm-primary text-white px-6 py-4 rounded-lg font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors text-center">
                    📊 Platform Dashboard
                  </Link>
                  <Link href="/siteadmin/shops" className="bg-crm-surface text-crm-text px-6 py-4 rounded-lg font-semibold hover:bg-crm-surface transition-colors text-center">
                    🏪 Manage Shops
                  </Link>
                  <Link href="/siteadmin/logs" className="bg-status-cancelled/20 text-status-cancelled px-6 py-4 rounded-lg font-semibold hover:bg-red-800/50 transition-colors text-center border border-status-cancelled/30">
                    🚨 System Logs
                  </Link>
                </div>
              </div>

              {/* Quick Shop Create */}
              <div className="bg-crm-surface p-4 sm:p-6 md:p-8 rounded-lg border border-crm-border shadow-sm">
                <h2 className="font-serif text-crm-text mb-1 text-xl font-bold">Quick Create Shop</h2>
                <p className="text-crm-muted mb-4 text-[13px]">Provision a new tenant workspace.</p>

                {createError && (
                    <div className="mb-4 p-3 bg-status-cancelled/20 border border-status-cancelled text-red-200 rounded text-[13px]">
                        {createError}
                    </div>
                )}

                <form onSubmit={handleCreateShop} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                          <label className="block text-crm-muted mb-1 text-[13px]">Shop Name *</label>
                          <input 
                              type="text" 
                              value={newShopName} 
                              onChange={(e) => setNewShopName(e.target.value)} 
                              placeholder="e.g., Downtown Barbers" 
                              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md py-3 px-4 text-crm-text placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary" 
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-crm-muted mb-1 text-[13px]">Kiosk Email *</label>
                          <input
                              type="email" 
                              value={kioskEmail} 
                              onChange={(e) => setKioskEmail(e.target.value)} 
                              placeholder="kiosk@example.com" 
                              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md py-3 px-4 text-crm-text placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary" 
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-crm-muted mb-1 text-[13px]">Admin Email (Optional)</label>
                          <input
                              type="email" 
                              value={newShopAdminEmail} 
                              onChange={(e) => setNewShopAdminEmail(e.target.value)} 
                              placeholder="admin@shop.com" 
                              className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md py-3 px-4 text-crm-text placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary" 
                          />
                      </div>
                  </div>
                  <button type="submit" className="w-full bg-crm-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors">
                      Create Shop Workspace
                  </button>
                </form>
              </div>

              {/* Recent Shops Quick View */}
              {shops && shops.length > 0 && (
                <div>
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-4">
                    <h2 className="font-serif text-xl font-bold">Shops ({shops.length})</h2>
                    <Link href="/siteadmin/shops" className="text-crm-accent text-[13px] hover:underline">View All →</Link>
                  </div>
                  <div className="space-y-3">
                    {shops.slice(0, 5).map((shop) => {
                       const hasAdmin = (shop.users || []).some(u => u.role === 'SHOP_ADMIN');
                       return (
                          <div key={shop.id} className="bg-crm-surface p-4 sm:p-6 rounded-lg hover:bg-crm-surface transition-colors border border-crm-border shadow-sm shadow-md">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                              <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                      <h3 className="font-semibold text-crm-text truncate text-lg font-bold">{shop.name}</h3>
                                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[13px] font-bold ${hasAdmin ? 'bg-status-confirmed/20 text-status-confirmed' : 'bg-status-pending/20 text-status-pending'}`}>
                                          {hasAdmin ? 'Active' : 'Needs Admin'}
                                      </span>
                                  </div>
                                  <Link href={`/shop/${shop.id}/settings/team`} className="text-[11px] sm:text-[13px] text-crm-accent hover:underline mt-1 inline-block">
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
            <div className="bg-crm-surface p-8 rounded-lg text-center border border-crm-border shadow-sm">
              <h2 className="font-serif mb-4 text-xl font-bold">Welcome back!</h2>
              <p className="text-crm-muted mb-6 text-[13px]">Browse available shops and book your appointments.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/shops" className="inline-block bg-crm-surface text-crm-text px-8 py-3 rounded-md font-semibold hover:bg-crm-surface transition-colors">
                  Browse Shops
                </Link>
              </div>
            </div>
          )}
          
          {!userProfile && isSignedIn && (
            <div className="bg-crm-surface p-8 rounded-lg text-center border border-crm-border shadow-sm">
              <p className="text-crm-muted text-[13px]">Your profile is being set up. Please refresh the page.</p>
            </div>
          )}
          
          {!isSignedIn && (
            <div className="bg-crm-surface p-8 rounded-lg text-center border border-crm-border shadow-sm">
              <p className="text-crm-muted mb-6 text-[13px]">Sign in to access your portal or browse available shops.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/shops" className="inline-block bg-crm-surface text-crm-text px-8 py-3 rounded-md font-semibold hover:bg-crm-surface transition-colors">
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
