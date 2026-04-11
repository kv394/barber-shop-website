import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export const dynamic = 'force-dynamic';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const userId = authUser?.id;
  if (!userId) return redirect('/');

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUser?.email || '' }] }, select: { role: true } });
  if (dbUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-botanical-muted">Only Super Admins can access this area.</p>
          <Link href="/" className="text-botanical-accent hover:underline mt-4 inline-block">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] bg-botanical-surface text-botanical-text overflow-y-auto overflow-x-hidden scroll-smooth">
      {/* Top Bar */}
      <header className="border-b border-botanical-border bg-botanical-surface sticky top-0 z-50 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-2xl font-bold">
              <span className="text-botanical-text">Barber</span><span className="text-botanical-accent">SaaS</span>
            </Link>
            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <SupabaseAuthButton redirectUrl="/" />
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-botanical-border bg-botanical-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-2">
            <NavLink href="/superadmin" label="📊 Dashboard" />
            <NavLink href="/superadmin/shops" label="🏪 Shops" />
            <NavLink href="/superadmin/tiers" label="💳 Pricing Tiers" />
            <NavLink href="/superadmin/logs" label="🚨 System Logs" />
            <NavLink href="/superadmin/templates" label="✨ AI Templates" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </div>
    </main>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-botanical-muted hover:text-botanical-text hover:bg-botanical-surface rounded-lg transition whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
