'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function RecoverPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const errorParam = searchParams?.get('error');
  const messageParam = searchParams?.get('message');

  const [method, setMethod] = useState<'email' | 'totp'>('email');
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState(errorParam || '');
  const [message, setMessage] = useState(messageParam || '');

  // Email form state
  const [email, setEmail] = useState('');

  // TOTP form state
  const [totpEmail, setTotpEmail] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleEmailRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const supabase = createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/api/auth/callback?redirect_to=/update-password`,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setMessage('Check your email for the password reset link.');
    }
  };

  const handleTotpRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/totp/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: totpEmail, token: totpCode, newPassword })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to recover password');
      }

      setMessage(data.message);
      
      setTimeout(() => {
        router.push('/sign-in?message=' + encodeURIComponent('Password recovered successfully. Please sign in.'));
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-crm-surface border border-crm-border shadow-sm rounded-2xl shadow-2xl p-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h1 className="font-serif font-bold text-crm-text mb-2 text-2xl font-bold">Recover Password</h1>
          <p className="text-crm-muted text-[13px]">Choose how you want to reset your password</p>
        </div>

        {error && <div className="bg-status-cancelled/10 border border-status-cancelled/30 text-status-cancelled p-3 rounded-lg mb-6 text-[13px] text-center">{error}</div>}
        {message && <div className="bg-status-confirmed/10 border border-status-confirmed/30 text-status-confirmed p-3 rounded-lg mb-6 text-[13px] text-center">{message}</div>}

        <div className="flex gap-2 mb-6 bg-crm-surface p-1 rounded-lg border border-crm-border shadow-sm">
          <button
            onClick={() => setMethod('email')}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors ${method === 'email' ? 'bg-crm-surface text-crm-text' : 'text-crm-muted hover:text-crm-text'}`}
          >
            Email Link
          </button>
          <button
            onClick={() => setMethod('totp')}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors ${method === 'totp' ? 'bg-crm-surface text-crm-text' : 'text-crm-muted hover:text-crm-text'}`}
          >
            Authenticator App
          </button>
        </div>

        {method === 'email' ? (
          <form onSubmit={handleEmailRecover} className="space-y-5">
            <div>
              <label className="block font-medium text-crm-muted mb-1.5 text-[13px]">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none" 
              />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotpRecover} className="space-y-5">
            <div>
              <label className="block font-medium text-crm-muted mb-1.5 text-[13px]">Email Address</label>
              <input 
                type="email" 
                required 
                value={totpEmail}
                onChange={(e) => setTotpEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none" 
              />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-1.5 text-[13px]">6-Digit Code</label>
              <input 
                type="text" 
                maxLength={6}
                required 
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" 
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none tracking-widest text-center" 
              />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-1.5 text-[13px]">New Password</label>
              <input 
                type="password" 
                required 
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-3 text-crm-text focus:ring-2 focus:ring-crm-primary focus:border-transparent outline-none" 
              />
            </div>
            <button type="submit" disabled={loading || totpCode.length !== 6 || newPassword.length < 8} className="w-full bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Recovering...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-crm-muted mt-8 text-[13px]">Remember your password? <Link href="/sign-in" className="text-crm-accent hover:underline">Sign In</Link></p>
      </div>
    </div>
  );
}

export default function RecoverPasswordPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] overflow-y-auto overflow-x-hidden">Loading...</div>}>
      <RecoverPasswordForm />
    </Suspense>
  );
}
