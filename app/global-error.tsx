"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/debug/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "ERROR",
        message: error.message || "Global app crash",
        stack: error.stack,
        path: window.location.pathname,
      }),
    }).catch((err) => console.error("Failed to log global error:", err));
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
          <div className="text-center max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-red-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-botanical-muted mb-6">
              A critical error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => reset()}
              className="bg-botanical-surface text-botanical-text px-4 py-2 rounded font-medium w-full hover:bg-botanical-surface transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}