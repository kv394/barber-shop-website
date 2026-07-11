import Image from 'next/image';
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

  let showClassFeatures = false;
  if (user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        shopClients: {
          include: {
            shop: {
              select: { industryType: true }
            }
          }
        }
      }
    });
    
    if (dbUser) {
      const classIndustries = ['DANCE_STUDIO', 'FITNESS', 'MARTIAL_ARTS', 'MUSIC_SCHOOL'];
      showClassFeatures = dbUser.shopClients.some(sc => classIndustries.includes(sc.shop.industryType));
    }
  }

  return (
  <MyAppointmentsLayoutClient showClassFeatures={showClassFeatures}>
  {children}
  </MyAppointmentsLayoutClient>
  );
}