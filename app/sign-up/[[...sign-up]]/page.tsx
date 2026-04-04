import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirect_url = resolvedSearchParams.redirect_url;
  const error = resolvedSearchParams.error;

  const signUpAction = async (formData: FormData) => {
    'use server';
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const redirectUrl = formData.get('redirectUrl') as string;
    
    const supabase = createClient();
    
    // Supabase Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return redirect(`/sign-up?error=${encodeURIComponent(authError.message)}&redirect_url=${encodeURIComponent(redirectUrl)}`);
    }

    if (!authData.user) {
      return redirect(`/sign-up?error=${encodeURIComponent('Failed to create account.')}&redirect_url=${encodeURIComponent(redirectUrl)}`);
    }

    // After Supabase creates the user, we immediately sync them to Prisma!
    try {
      const userBarcode = crypto.randomBytes(6).toString('hex').toUpperCase();

      // Use upsert to handle both new users and existing users from the Clerk migration
      await prisma.user.upsert({
        where: { email: authData.user.email! },
        update: {
          id: authData.user.id, // Update the ID to the new Supabase UUID
          name: name || undefined,
        },
        create: {
          id: authData.user.id,
          email: authData.user.email!,
          name: name || null,
          role: 'CLIENT', // Default role
          barcode: userBarcode,
        },
      });
    } catch (dbError) {
      console.error("Database sync failed on signup:", dbError);
      // This can happen if the DB is down, but the user is still created in Supabase Auth.
      // A webhook is the more robust, production-grade solution for this.
      return redirect(`/sign-up?error=${encodeURIComponent('Database error saving user profile.')}&redirect_url=${encodeURIComponent(redirectUrl)}`);
    }

    return redirect(redirectUrl || '/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join BarberSaaS today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form action={signUpAction} className="space-y-5">
          <input type="hidden" name="redirectUrl" value={redirect_url || '/'} />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input 
              name="name" 
              type="text" 
              required 
              className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              minLength={8}
              className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{' '}
          <a href={`/sign-in?redirect_url=${encodeURIComponent(redirect_url || '/')}`} className="text-brand-gold hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
