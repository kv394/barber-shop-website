'use client';

import { useState, useEffect } from 'react';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import Link from 'next/link';
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

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchUserData = async () => {
      try {
          let res = await fetch(`/api/users/me`);
          
          if (res.ok) {
              const profile = await res.json();
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

  useEffect(() => {
    if (!isLoading && userProfile) {
      if (userProfile.role === 'SITE_ADMIN') {
        router.push('/siteadmin');
      } else if (userProfile.role === 'SHOP_ADMIN' || userProfile.role === 'STAFF') {
        if (userProfile.shopId) {
          router.push(`/shop/${userProfile.shopId}`);
        }
      } else if (userProfile.role === 'CLIENT' && userProfile.shop?.slug) {
        router.push(`/shops/${userProfile.shop.slug}`);
      }
    }
  }, [isLoading, userProfile, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-crm-bg px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center w-full mb-12 sm:mb-20">
            <div className="h-8 bg-crm-surface/50 rounded w-32 animate-pulse border border-crm-border/30"></div>
            <div className="h-10 bg-crm-surface/50 rounded w-24 animate-pulse border border-crm-border/30"></div>
          </div>
          {/* Body Skeleton */}
          <div className="space-y-6 max-w-4xl mx-auto mt-20 text-center flex flex-col items-center">
            <div className="h-12 bg-crm-surface/60 rounded-lg w-[80%] animate-pulse border border-crm-border/30"></div>
            <div className="h-4 bg-crm-surface/40 rounded w-[40%] animate-pulse border border-crm-border/30"></div>
          </div>
        </div>
      </div>
    );
  }

  if (userProfile?.role === 'ATTENDANCE_KIOSK') {
      return <KioskMode userProfile={userProfile} />;
  }

  if (userProfile?.shopId && userProfile.role !== 'SITE_ADMIN') {
    return (
      <div className="min-h-screen flex flex-col bg-crm-bg px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full max-w-5xl mx-auto space-y-12">
          <div className="flex justify-between items-center w-full mb-12 sm:mb-20">
            <div className="h-8 bg-crm-surface/50 rounded w-32 animate-pulse border border-crm-border/30"></div>
            <div className="h-10 bg-crm-surface/50 rounded w-24 animate-pulse border border-crm-border/30"></div>
          </div>
          <div className="space-y-6 max-w-4xl mx-auto mt-20 text-center flex flex-col items-center">
            <div className="h-12 bg-crm-surface/60 rounded-lg w-[80%] animate-pulse border border-crm-border/30"></div>
            <p className="text-crm-accent animate-pulse font-medium tracking-wide uppercase text-[13px]">Entering Shop Portal...</p>
          </div>
        </div>
      </div>
    );
  }

  const isSignedIn = !!userProfile;

  return (
    <main className="min-h-screen overflow-x-hidden flex flex-col bg-crm-bg">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-grow">
        
        <header className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-12 sm:mb-20">
          <h1 className="font-serif font-bold tracking-tight text-2xl">
            <span className="text-crm-text">KutzApp</span>
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
          {!isSignedIn && (
            <div className="bg-crm-surface p-8 rounded-lg text-center border border-crm-border shadow-sm max-w-2xl mx-auto mt-12 transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:shadow-md">
              <h3 className="text-xl font-bold font-serif mb-4 text-crm-text">Ready to transform your business?</h3>
              <p className="text-crm-muted mb-8 text-[14px]">Join thousands of barbershops using KutzApp to streamline their operations, increase bookings, and grow their revenue.</p>
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
        </div>

      </div>
    </main>
  );
}
