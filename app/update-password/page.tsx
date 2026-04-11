import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limiter';
import BackButton from '@/components/BackButton';

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;
  const message = resolvedSearchParams.message;

  const updatePasswordAction = async (formData: FormData) => {
    'use server';
    
    // Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`update-pw:${ip}`, 5, 60 * 15); // 5 attempts per 15 minutes
    
    if (!rateLimitResult.success) {
      return redirect(`/update-password?error=${encodeURIComponent('Too many password update attempts. Please try again later.')}`);
    }

    const password = formData.get('password') as string;

    const supabase = await createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return redirect(`/update-password?error=${encodeURIComponent(updateError.message)}`);
    }

    return redirect('/?message=' + encodeURIComponent('Password updated successfully.'));
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-botanical-surface border border-botanical-border rounded-2xl shadow-2xl p-8 mt-12 mb-12 relative">
        <div className="absolute -top-14 left-0">
          <BackButton />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-botanical-text mb-2">Update Password</h1>
          <p className="text-botanical-muted">Enter your new password below</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-6 text-sm text-center">{message}</div>}

        <form action={updatePasswordAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-botanical-muted mb-1.5">New Password</label>
            <input name="password" type="password" required placeholder="••••••••" minLength={6} className="w-full bg-botanical-surface border border-botanical-border rounded-lg p-3 text-botanical-text focus:ring-2 focus:ring-botanical-primary focus:border-transparent outline-none" />
          </div>
          <button type="submit" className="w-full bg-botanical-primary text-white font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2">Update Password</button>
        </form>
      </div>
    </div>
  );
}
