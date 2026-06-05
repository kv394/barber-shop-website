'use client';
import { useTransition } from 'react';

export default function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [isPending] = useTransition();
  return (
    <button type="submit" disabled={isPending} className={`${className} disabled:opacity-60`}>
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Signing in...
        </span>
      ) : children}
    </button>
  );
}
