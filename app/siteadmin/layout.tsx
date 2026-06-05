import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import SiteAdminSidebarLinks from '@/components/siteadmin/SiteAdminSidebarLinks';
import MobileHeader from '@/components/siteadmin/MobileHeader';
import SiteAdminMobileBottomNav from '@/components/siteadmin/SiteAdminMobileBottomNav';

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
 <aside className="hidden md:flex flex-col w-64 bg-white/60 backdrop-blur-xl border-r border-white/40 flex-shrink-0 z-10 shadow-sm">
 <div className="h-16 flex items-center px-6 border-b border-white/40">
 <Link href="/siteadmin" className="font-bold text-xl tracking-tight flex items-center gap-2">
 <span className="text-crm-text">KutzApp</span><span className="text-crm-primary">Admin</span>
 </Link>
 </div>
 <nav className="flex-1 overflow-y-auto py-4 px-3">
 <SiteAdminSidebarLinks />
 </nav>
 <div className="p-4 border-t border-white/40 flex items-center justify-between">
 <div>
 <span className="block text-[11px] font-semibold text-crm-muted uppercase tracking-wider mb-2">SITE ADMIN</span>
 <SupabaseAuthButton redirectUrl="/" />
 </div>
 </div>
 </aside>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
 <MobileHeader />

 {/* Main Scrolling Area */}
 <main className="flex-1 overflow-y-auto bg-crm-bg relative p-4 md:p-8 pt-8 pb-24 md:pb-8">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-indigo/10 via-crm-bg/20 to-crm-bg pointer-events-none"></div>
 <div className="mx-auto max-w-7xl relative z-10">
 {children}
 </div>
 </main>
 </div>

 <SiteAdminMobileBottomNav />
 </div>
 );
}
