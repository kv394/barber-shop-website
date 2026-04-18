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
        <div className="flex min-h-screen items-center justify-center bg-crm-bg px-4 py-12">
          <div className="text-center max-w-md w-full bg-crm-surface p-8 rounded-lg shadow-sm border border-red-100">
            <h2 className="font-bold text-crm-text mb-4 text-xl font-bold">Something went wrong</h2>
            <p className="text-crm-muted mb-6 text-[13px]">
              A critical error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => reset()}
              className="bg-crm-surface text-crm-text px-4 py-2 rounded font-medium w-full hover:bg-crm-surface transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}