import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h2 className="font-bold mb-4 text-3xl md:text-4xl">Page Not Found</h2>
      <p className="text-crm-muted mb-8 max-w-md text-base md:text-lg">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-crm-primary text-white transition-all hover:scale-105 active:scale-95 hover:opacity-90"
      >
        Go Home
      </Link>
    </div>
  );
}

