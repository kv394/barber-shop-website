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
      <div className="w-full max-w-md bg-crm-surface border border-crm-border shadow-sm rounded-2xl shadow-2xl p-8 mt-12 mb-12 relative">
        <div className="absolute -top-14 left-0">
          <BackButton />
        </div>
        <div className="text-center mb-8">
          <h1 className="font-serif font-bold text-crm-text mb-2 text-4xl md:text-5xl lg:text-6xl">Update Password</h1>
          <p className="text-crm-muted text-base md:text-lg">Enter your new password below</p>
        </div>

        {error && <div className="bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled p-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {message && <div className="bg-status-confirmed/10 border border-status-confirmed/30 text-status-confirmed p-3 rounded-lg mb-6 text-sm text-center">{message}</div>}

        <form action={updatePasswordAction} className="space-y-5">
          <div>
            <label className="block font-medium text-crm-muted mb-1.5 text-sm">New Password</label>
            <input name="password" type="password" required placeholder="••••••••" minLength={6} className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none" />
          </div>
          <button type="submit" className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors mt-2">Update Password</button>
        </form>
      </div>
    </div>
  );
}
