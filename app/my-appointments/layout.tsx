import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

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
     if (dbUser.shopId) {
        redirect(`/shop/${dbUser.shopId}`);
     } else {
        redirect('/');
     }
  }

  return (
    <div className="bg-botanical-surface h-[100dvh] overflow-y-auto overflow-x-hidden text-botanical-text font-sans">
      {children}
    </div>
  );
}