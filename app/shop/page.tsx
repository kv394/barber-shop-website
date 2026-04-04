import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This page acts as a redirector.
// It finds which shop the currently logged-in user belongs to and redirects them to the correct dashboard.
export default async function ShopRedirectPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    // If not logged in, send them to the sign-in page.
    return redirect('/sign-in');
  }

  // Find the user in our database to get their assigned shopId.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { shopId: true, role: true },
  });

  if (user?.shopId) {
    // If they belong to a shop, redirect to that shop's main dashboard.
    return redirect(`/shop/${user.shopId}`);
  }

  if (user?.role === 'SUPER_ADMIN') {
    // If they are a Super Admin but not assigned to a shop, redirect to the main admin page.
    return redirect('/');
  }

  // Fallback for users who are logged in but not associated with any shop.
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No Shop Assigned</h1>
        <p className="text-gray-400">Your user account is not currently assigned to a shop.</p>
        <a href="/" className="inline-block mt-8 text-brand-gold hover:underline">Return to Home</a>
      </div>
    </div>
  );
}
