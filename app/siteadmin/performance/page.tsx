import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import PerformanceDashboardClient from './PerformanceDashboardClient';

export const dynamic = 'force-dynamic';

export default async function SiteAdminPerformancePage() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) redirect('/sign-in');

 const dbUser = await prisma.user.findUnique({
 where: { email: user.email! }
 });

 if (dbUser?.role !== 'SITE_ADMIN') {
 redirect('/');
 }

 return (
 <div>
 <div className="mb-8">
 <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl">System Performance</h1>
 <p className="text-crm-muted text-[13px]">Monitor platform health, shop activity, and usage metrics across Kutzapp.</p>
 </div>
 <PerformanceDashboardClient />
 </div>
 );
}
