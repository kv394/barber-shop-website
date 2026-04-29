import MyAppointmentsNav from '@/components/MyAppointmentsNav';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export default async function MyAppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/sign-in?redirect_url=/my-appointments');
  }

  // Redirect STAFF/ADMIN out of client views
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email || '' },
    select: { role: true, shopId: true }
  });

  if (dbUser && dbUser.role !== 'CLIENT') {
     redirect('/');
  }

  const reqHeaders = await headers();
  const isIframe = reqHeaders.get('sec-fetch-dest') === 'iframe';

  return (
    <div className="bg-crm-surface h-[100dvh] overflow-y-auto overflow-x-hidden text-crm-text font-sans flex flex-col">
      {!isIframe && <MyAppointmentsNav />}
      <main className="flex-1 w-full bg-crm-bg">
        {children}
      </main>
    </div>
  );
}