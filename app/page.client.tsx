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
  const [country, setCountry] = useState<'US'|'IN'>('US');
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

  // AUTOMATIC REDIRECTS FOR ROLES
  useEffect(() => {
    if (!isLoading && userProfile) {
      if (userProfile.role === 'SITE_ADMIN') {
        router.push('/siteadmin');
      } else if (userProfile.role === 'SHOP_ADMIN' || userProfile.role === 'STAFF') {
        if (userProfile.shopId) {
          router.push(`/shop/${userProfile.shopId}`);
        }
      } else if (userProfile.role === 'CLIENT' && userProfile.shop?.slug) {
        // Automatically redirect clients to their specific shop portal
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
            adminEmail: newShopAdminEmail.trim() || null,
            country: country
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
      <div className="min-h-screen overflow-x-hidden flex flex-col flex items-center justify-center bg-crm-bg">
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
      <div className="min-h-screen overflow-x-hidden flex flex-col flex items-center justify-center bg-crm-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-crm-accent animate-pulse font-medium tracking-wide uppercase text-[13px]">Entering Shop Portal...</p>
        </div>
      </div>
    );
  }

  const isSignedIn = !!userProfile;

  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col bg-crm-bg flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-grow">
        
        <header className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-12 sm:mb-20">
          <h1 className="font-serif font-bold tracking-tight text-2xl">
            <span className="text-crm-text">Barber</span><span className="text-crm-accent">SaaS</span>
          </h1>
          <div>
            <SupabaseAuthButton />
          </div>
        </header>

        <div className="text-center mb-12 sm:mb-20">
          <h2 className="font-serif font-bold leading-tight tracking-tight text-crm-text max-w-4xl mx-auto drop-shadow-sm text-xl">
            {isSignedIn ? `Welcome, ${userProfile?.name || 'User'}` : "The Ultimate Operating System for Barbershops"}
          </h2>
          <p className="mt-4 sm:mt-6 text-crm-accent/80 font-medium tracking-wide text-[13px]">
            {isSignedIn ? 'Redirecting to your dashboard...' : 'Manage your shop, bookings, and team all in one place.'}
          </p>
        </div>

        <div>
          {/* Landing Page Content */}
          {!isSignedIn && (
            <div className="bg-crm-surface p-8 rounded-lg text-center border border-crm-border shadow-sm max-w-2xl mx-auto mt-12">
              <h3 className="text-xl font-bold font-serif mb-4 text-crm-text">Ready to transform your business?</h3>
              <p className="text-crm-muted mb-8 text-[14px]">Join thousands of barbershops using Kutz to streamline their operations, increase bookings, and grow their revenue.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/sign-up" className="inline-block bg-crm-primary text-white px-8 py-3 rounded-md font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors">
                  Start Free Trial
                </Link>
                <Link href="/shops" className="inline-block bg-crm-surface text-crm-text px-8 py-3 rounded-md font-semibold hover:bg-crm-surface transition-colors border border-crm-border">
                  Browse Shops
                </Link>
              </div>
            </div>
          )}
          {/* Create Shop Form */}
          {!isSignedIn && (
            <form className="max-w-md mx-auto mt-8 space-y-4" onSubmit={handleCreateShop}>
              <input
                type="text"
                placeholder="Shop Name"
                value={newShopName}
                onChange={e => setNewShopName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-crm-primary"
                required
              />
              <input
                type="email"
                placeholder="Kiosk Email"
                value={kioskEmail}
                onChange={e => setKioskEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-crm-primary"
                required
              />
              <input
                type="email"
                placeholder="Admin Email (optional)"
                value={newShopAdminEmail}
                onChange={e => setNewShopAdminEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-crm-primary"
              />
              <select
                value={country}
                onChange={e => setCountry(e.target.value as 'US'|'IN')}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-crm-primary"
              >
                <option value="US">United States</option>
                <option value="IN">India</option>
              </select>
              {createError && <p className="text-red-500 text-sm">{createError}</p>}
              <button
                type="submit"
                className="w-full bg-crm-primary text-white py-2 rounded-md hover:bg-crm-primary/90"
              >
                Create Shop
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
