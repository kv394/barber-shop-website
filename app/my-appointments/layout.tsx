import MyAppointmentsLayoutClient from '@/components/MyAppointmentsLayoutClient';
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

 // Note: We used to redirect STAFF/ADMIN out of here, but they need access to /my-appointments/profile
 // to edit their global account details (name, phone, etc.).

 return (
 <MyAppointmentsLayoutClient>
 {children}
 </MyAppointmentsLayoutClient>
 );
}