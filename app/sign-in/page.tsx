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
             // Keep the redirect URL if there's one, else send to home
             finalRedirectUrl = redirectUrl && redirectUrl !== '/' ? redirectUrl : '/';
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
      <div className="w-full max-w-md bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded-2xl shadow-2xl p-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-botanical-text mb-2">Welcome Back</h1>
          <p className="text-botanical-muted">Sign in to manage your appointments</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-6 text-sm text-center">{message}</div>}

        <form action={signInAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-botanical-muted mb-1.5">Email Address</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded-lg p-3 text-botanical-text focus:ring-2 focus:ring-botanical-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-botanical-muted mb-1.5">Password</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded-lg p-3 text-botanical-text focus:ring-2 focus:ring-botanical-primary focus:border-transparent outline-none" />
            <Link href="/recover-password" className="mt-2 block text-right text-sm text-botanical-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="w-full bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2">Sign In</button>
        </form>
        
        <p className="text-center text-sm text-botanical-muted mt-8">Don't have an account? <Link href="/sign-up" className="text-botanical-accent hover:underline">Sign Up</Link></p>
      </div>
    </div>
  );
}