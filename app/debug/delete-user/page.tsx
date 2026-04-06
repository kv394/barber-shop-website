'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function DeleteUserPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('Checking login status...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setMessage('Attempting to fix user account...');
      } else {
        setMessage('Waiting for user to be logged in...');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fixAccount = async () => {
      try {
        const response = await fetch('/api/debug/delete-user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'commoninfo2all@gmail.com' }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'An unknown error occurred.');
        }

        setMessage(data.message + ' You can now log out and log back in.');
      } catch (err: any) {
        setError(err.message);
        setMessage('An error occurred while trying to fix the account.');
      }
    };

    fixAccount();
  }, [userId]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Account Fix Utility</h1>
      <p>{message}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
