import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// This page acts as a redirector.
// It finds which shop the currently logged-in user belongs to and redirects them to the correct dashboard.
export default async function ShopRedirectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) {
    // If not logged in, send them to the sign-in page.
    return redirect('/sign-in');
  }

  // Find the user in our database to get their assigned shopId.
  const dbUser = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { email: user?.email || '' }] },
    select: { shopId: true, role: true },
  });

  if (dbUser?.shopId) {
    // If they belong to a shop, redirect to that shop's main dashboard.
    return redirect(`/shop/${dbUser.shopId}`);
  }

  if (dbUser?.role === 'SITE_ADMIN') {
    // If they are a Site Admin but not assigned to a shop, redirect to the main admin page.
    return redirect('/');
  }

  // Fallback for users who are logged in but not associated with any shop.
  return (
    <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">No Shop Assigned</h1>
        <p className="text-botanical-muted">Your user account is not currently assigned to a shop.</p>
        <a href="/" className="inline-block mt-8 text-botanical-accent hover:underline">Return to Home</a>
      </div>
    </div>
  );
}
