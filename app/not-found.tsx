import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-zinc-400 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-botanical-primary px-6 py-2.5 font-bold text-botanical-bg transition-all hover:scale-105 active:scale-95"
      >
        Go Home
      </Link>
    </div>
  );
}

