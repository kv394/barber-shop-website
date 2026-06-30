import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ClientHomePage from './page.client';
import { resolveRedirect } from '@/lib/auth/resolveRedirect';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email) {
    const redirected = await resolveRedirect(user.email, prisma);
    if (redirected) {
      // resolveRedirect already performed the redirect
      return null as any; // early exit, no further rendering
    }
  }

  return <ClientHomePage />;
}
