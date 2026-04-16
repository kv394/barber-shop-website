import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';

export const dynamic = 'force-dynamic';

export default async function SiteAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const userId = authUser?.id;
  if (!userId) return redirect('/');

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUser?.email || '' }] }, select: { role: true } });
  if (dbUser?.role !== 'SITE_ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-crm-bg text-crm-text">
      {/* Persistent Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-crm-surface border-r border-crm-border flex-shrink-0 z-10 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-crm-border">
           <Link href="/siteadmin" className="font-bold text-xl tracking-tight flex items-center gap-2">
             <span className="text-crm-text">Barber</span><span className="text-crm-primary">SaaS</span>
           </Link>
           <span className="ml-2 text-[10px] bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
             Admin
           </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavLink href="/siteadmin" label="📊 Dashboard" />
          <NavLink href="/siteadmin/shops" label="🏪 Shops" />
          <NavLink href="/siteadmin/tiers" label="💳 Pricing Tiers" />
          <NavLink href="/siteadmin/logs" label="🚨 System Logs" />
          <NavLink href="/siteadmin/templates" label="✨ AI Templates" />
        </nav>
        <div className="p-4 border-t border-crm-border">
           <SupabaseAuthButton redirectUrl="/" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-[100] flex justify-between items-center bg-crm-surface border-b border-crm-border px-4 py-3 shadow-sm">
          <div className="flex flex-col min-w-0 pr-4">
             <span className="text-crm-text font-black text-lg truncate leading-tight">BarberSaaS Admin</span>
          </div>
          <div className="shrink-0">
             <SupabaseAuthButton redirectUrl="/" />
          </div>
        </header>

        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 shrink-0 items-center justify-between px-8 bg-crm-surface border-b border-crm-border z-10 shadow-sm">
          <div className="flex items-center">
            <h1 className="font-semibold text-xl text-crm-text">System Administration</h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <SupabaseAuthButton redirectUrl="/" />
          </div>
        </header>

        {/* Main Scrolling Area */}
        <main className="flex-1 overflow-y-auto bg-crm-bg p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-sm font-medium text-crm-muted hover:text-crm-text hover:bg-crm-bg transition-colors"
    >
      {label}
    </Link>
  );
}
