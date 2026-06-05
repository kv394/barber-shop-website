import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import PlatformSettingsClient from './PlatformSettingsClient';

export const dynamic = 'force-dynamic';

export default async function GlobalSettingsPage() {
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
 <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl">Global Platform Settings</h1>
 <p className="text-crm-muted text-[13px]">Manage platform-wide configurations, fees, and feature toggles.</p>
 </div>
 <PlatformSettingsClient />
 </div>
 );
}
