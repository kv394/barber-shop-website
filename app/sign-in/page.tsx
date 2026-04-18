import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limiter';
import { prisma } from '@/lib/prisma';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string, redirect_url?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;
  const message = resolvedSearchParams.message;
  const redirectUrl = resolvedSearchParams.redirect_url || '/';

  // If the user is already signed in, redirect them immediately!
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return redirect(redirectUrl);
  }

  const signInAction = async (formData: FormData) => {
    'use server';
    
    // Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`login:${ip}`, 5, 60 * 5); // 5 attempts per 5 minutes
    
    if (!rateLimitResult.success) {
      return redirect(`/sign-in?error=${encodeURIComponent('Too many login attempts. Please try again later.')}&redirect_url=${encodeURIComponent(redirectUrl)}`);
    }

    const email = (formData.get('email') as string).trim().toLowerCase();
    const password = formData.get('password') as string;
    
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);

    // Aggressively clear legacy cookies to prevent 4KB domain cookie limits from blocking Supabase cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    allCookies.forEach((c) => {
      if (c.name.includes('__session') || c.name.includes('__client')) {
        cookieStore.delete(c.name);
      }
    });

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error(`[LOGIN FAILED] ${authError.message}`);
      return redirect(`/sign-in?error=${encodeURIComponent(authError.message)}&redirect_url=${encodeURIComponent(redirectUrl)}`);
    }

    console.log(`[LOGIN SUCCESS] ID: ${authData?.user?.id}`);
    revalidatePath('/');

    let finalRedirectUrl = redirectUrl;
    if (authData?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: authData.user.email },
        select: { role: true, shop: { select: { name: true } } }
      });
      
      if (dbUser) {
        if (dbUser.role === 'CLIENT') {
          // Always send clients to the shop landing page if we can determine their shop
          // But wait, clients can be linked to multiple shops potentially in some systems.
          // In our system, user belongs to ONE shopId primarily.
          const computedSlug = dbUser.shop?.name ? dbUser.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : null;
          if (computedSlug) {
            finalRedirectUrl = `/shops/${computedSlug}`;
          } else {
             // Keep the redirect URL if there's one, else send to shops directory
             finalRedirectUrl = redirectUrl && redirectUrl !== '/' ? redirectUrl : '/shops';
          }
        } else {
          // Send staff/admins to the base URL
          finalRedirectUrl = '/';
        }
      }
    }

    return redirect(finalRedirectUrl);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-crm-surface border border-crm-border shadow-sm rounded-2xl shadow-2xl p-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h1 className="font-serif font-bold text-crm-text mb-2 text-2xl font-bold">Welcome Back</h1>
          <p className="text-crm-muted text-[13px]">Sign in to manage your appointments</p>
        </div>
        
        {error && <div className="bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled p-3 rounded-lg mb-6 text-[13px] text-center">{error}</div>}
        {message && <div className="bg-status-confirmed/10 border border-status-confirmed/30 text-status-confirmed p-3 rounded-lg mb-6 text-[13px] text-center">{message}</div>}

        <form action={signInAction} className="space-y-5">
          <div>
            <label className="block font-medium text-crm-muted mb-1.5 text-[13px]">Email Address</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block font-medium text-crm-muted mb-1.5 text-[13px]">Password</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none" />
            <Link href="/recover-password" className="mt-2 block text-right text-[13px] text-crm-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors mt-2">Sign In</button>
        </form>
        
        <p className="text-center text-crm-muted mt-8 text-[13px]">Don't have an account? <Link href="/sign-up" className="text-crm-accent hover:underline">Sign Up</Link></p>
      </div>
    </div>
  );
}