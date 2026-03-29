'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function DeleteUserPage() {
  const { userId } = useAuth();
  const [message, setMessage] = useState('Attempting to fix user account...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setMessage('Waiting for user to be logged in...');
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
