import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirect_url = resolvedSearchParams.redirect_url;
  const error = resolvedSearchParams.error;

  const signInAction = async (formData: FormData) => {
    'use server';
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const redirectUrl = formData.get('redirectUrl') as string;
    
    const supabase = createClient();
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return redirect(`/sign-in?error=${encodeURIComponent(authError.message)}&redirect_url=${encodeURIComponent(redirectUrl)}`);
    }

    return redirect(redirectUrl || '/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form action={signInAction} className="space-y-5">
          <input type="hidden" name="redirectUrl" value={redirect_url || '/'} />
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-gold text-brand-dark font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account?{' '}
          <a href={`/sign-up?redirect_url=${encodeURIComponent(redirect_url || '/')}`} className="text-brand-gold hover:underline">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}
