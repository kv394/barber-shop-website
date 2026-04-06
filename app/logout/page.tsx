'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    };
    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark text-white">
      <p>Logging out...</p>
    </div>
  );
}