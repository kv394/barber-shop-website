import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limiter';

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;
  const message = resolvedSearchParams.message;

  const recoverAction = async (formData: FormData) => {
    'use server';
    
    // Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`recover:${ip}`, 3, 60 * 15); // 3 attempts per 15 minutes
    
    if (!rateLimitResult.success) {
      return redirect(`/recover-password?error=${encodeURIComponent('Too many password reset attempts. Please try again later.')}`);
    }

    const email = formData.get('email') as string;

    const supabase = await createClient();
    
    // Attempt to determine the base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/api/auth/callback?redirect_to=/update-password`,
    });

    if (authError) {
      return redirect(`/recover-password?error=${encodeURIComponent(authError.message)}`);
    }

    return redirect(`/recover-password?message=${encodeURIComponent('Check your email for the password reset link.')}`);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Recover Password</h1>
          <p className="text-gray-400">Enter your email to reset your password</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-6 text-sm text-center">{message}</div>}

        <form action={recoverAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <button type="submit" className="w-full bg-brand-gold text-black font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2">Send Reset Link</button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">Remember your password? <Link href="/sign-in" className="text-brand-gold hover:underline">Sign In</Link></p>
      </div>
    </div>
  );
}
