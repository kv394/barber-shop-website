import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import SystemLogsViewer from './SystemLogsViewer';

export const dynamic = 'force-dynamic';

export default async function SiteAdminLogsPage() {
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
      <SystemLogsViewer />
    </div>
  );
}
