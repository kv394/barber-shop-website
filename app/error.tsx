'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Extract error info even from non-standard Error objects
    const errorMsg = error?.message || error?.toString?.() || String(error) || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace';
    const errorDigest = (error as any)?.digest || undefined;

    console.error('[ErrorBoundary]', { errorMsg, errorDigest, error });

    // Send telemetry on unhandled UI errors within the app boundaries
    fetch('/api/debug/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Unhandled App Error Boundary Caught Exception', 
        errorMsg,
        stack: errorStack,
        digest: errorDigest,
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      })
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-botanical-text shadow-lg mx-auto w-full max-w-2xl mt-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 mb-6 border border-red-500/30">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-red-500">Something went wrong!</h2>
      <p className="mb-8 max-w-[400px] text-zinc-400">
        We apologize for the inconvenience. Our system has automatically been notified about this technical issue.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-botanical-primary px-6 py-2.5 font-bold text-botanical-bg transition-all hover:scale-105 active:scale-95"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-6 py-2.5 font-bold text-botanical-text transition-all hover:bg-zinc-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

