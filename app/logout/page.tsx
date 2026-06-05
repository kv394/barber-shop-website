import Image from 'next/image';
'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutPage() {
 const router = useRouter();

 useEffect(() => {
 const performLogout = async () => {
 let redirectUrl = '/';
 try {
 const res = await fetch('/api/my-appointments/profile');
 if (res.ok) {
 const user = await res.json();
 if (user?.role === 'CLIENT' && user?.shopId) {
 redirectUrl = `/shop/${user.shopId}`;
 }
 }
 } catch (e) {
 console.error('Error fetching profile during logout:', e);
 }

 const supabase = createClient();
 await supabase.auth.signOut();
 
 if (window.parent && window.parent !== window) {
 window.parent.location.href = redirectUrl;
 } else {
 window.location.href = redirectUrl;
 }
 };
 performLogout();
 }, []);

 return (
 <div className="h-[100dvh] flex items-center justify-center bg-crm-bg">
 <p className="text-[13px] text-crm-muted animate-pulse">Logging out...</p>
 </div>
 );
}