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
 role: 'SITE_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'BOOTH_RENTER' | 'CLIENT' | 'ATTENDANCE_KIOSK';
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
      } else if (userProfile.role === 'SHOP_ADMIN' || userProfile.role === 'STAFF' || userProfile.role === 'BOOTH_RENTER') {
        if (userProfile.shopId) {
          router.push(`/shop/${userProfile.shopId}`);
        }
      } else if (userProfile.role === 'CLIENT' && userProfile.shop?.slug) {
        // Automatically redirect clients to their specific shop portal
        router.push(`/shops/${userProfile.shop.slug}`);
      }
      // Note: ATTENDANCE_KIOSK is rendered below via <KioskMode />
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

 // Handle authenticated users who don't have a valid role or shop assignment
 // (e.g., SITE_ADMIN role was removed, or user exists but has no matching dashboard)
 const knownRolesWithDashboard = ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'BOOTH_RENTER', 'ATTENDANCE_KIOSK', 'CLIENT'];
 const hasValidDashboard = userProfile && (
   knownRolesWithDashboard.includes(userProfile.role) && (
     userProfile.role === 'SITE_ADMIN' ||
     userProfile.role === 'ATTENDANCE_KIOSK' ||
     (userProfile.role === 'CLIENT' && userProfile.shop?.slug) ||
     ((userProfile.role === 'SHOP_ADMIN' || userProfile.role === 'STAFF' || userProfile.role === 'BOOTH_RENTER') && userProfile.shopId)
   )
 );

 if (userProfile && !hasValidDashboard) {
   const handleSignOut = async () => {
     try {
       await fetch('/api/auth/callback?action=signout', { method: 'POST' }).catch(() => {});
       window.location.href = '/logout';
     } catch {
       window.location.href = '/logout';
     }
   };

   return (
     <div className="min-h-screen overflow-x-hidden flex flex-col items-center justify-center bg-crm-bg p-4">
       <div className="w-full max-w-md bg-crm-surface border border-crm-border rounded-2xl shadow-2xl p-8 text-center">
         <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
           <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
           </svg>
         </div>
         <h2 className="font-serif font-bold text-crm-text text-xl mb-2">Account Not Configured</h2>
         <p className="text-crm-muted text-[13px] mb-2">
           Your account (<span className="font-medium text-crm-text">{userProfile.email}</span>) exists but is not currently assigned to a shop or role with dashboard access.
         </p>
         <p className="text-crm-muted text-[13px] mb-8">
           Please contact your shop administrator to get assigned to a shop.
         </p>
         <div className="flex flex-col gap-3">
           <Link href="/shops" className="w-full inline-block bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors text-center text-[13px]">
             Browse Shops
           </Link>
           <button
             onClick={handleSignOut}
             className="w-full bg-crm-surface text-crm-muted font-semibold py-3 rounded-lg border border-crm-border hover:bg-crm-bg hover:text-crm-text transition-colors text-[13px]"
           >
             Sign Out
           </button>
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
 <h2 className="font-serif font-bold leading-tight tracking-tight text-crm-text max-w-4xl mx-auto drop-shadow-sm text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
 {isSignedIn ? `Welcome, ${userProfile?.name || 'User'}` : "The Ultimate Operating System for Barbershops"}
 </h2>
 <p className="mt-4 sm:mt-6 text-crm-accent/80 font-medium tracking-wide text-sm sm:text-base md:text-lg">
 {isSignedIn ? 'Redirecting to your dashboard...' : 'Manage your shop, bookings, and team all in one place.'}
 </p>
 </div>

 <div>
 {!isSignedIn && (
 <div className="bg-crm-surface p-8 rounded-lg text-center border border-crm-border shadow-sm max-w-2xl mx-auto mt-12 transition-all duration-500 ease-in-out transform hover:-translate-y-1 hover:shadow-md">
 <h3 className="text-xl font-bold font-serif mb-4 text-crm-text">Ready to transform your business?</h3>
 <p className="text-crm-muted mb-8 text-[14px]">Join barbershops already growing with KutzApp to streamline their operations, increase bookings, and grow their revenue.</p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
 <Link href="/sign-up" className="w-full sm:w-auto text-center inline-block bg-crm-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors">
 Start Free Trial
 </Link>
 </div>
 </div>
 )}
 </div>

 </div>
 </main>
 );
}
