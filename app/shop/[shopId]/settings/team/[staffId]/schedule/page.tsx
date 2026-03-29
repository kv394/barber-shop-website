import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
import ScheduleEditor from './ScheduleEditor';

async function getPageData(shopId: string, userId: string, staffId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== 'SUPER_ADMIN' && user.shopId !== shopId)) {
    return null;
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return null;

  const staffMember = await prisma.user.findUnique({
    where: { id: staffId, shopId: shopId, role: 'STAFF' },
    include: {
        leaves: {
            where: { date: { gte: new Date() } },
            orderBy: { date: 'asc' },
        }
    }
  });

  if (!staffMember) return null;

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    userRole: user.role, 
    staffMember: JSON.parse(JSON.stringify(staffMember)) 
  };
}

export default async function SchedulePage({ params }: { params: { shopId: string, staffId: string } }) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const pageData = await getPageData(params.shopId, userId, params.staffId);
  if (!pageData) return <div className="p-8 text-white">Access denied or user not found.</div>;

  const { shop, userRole, staffMember } = pageData;
  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={`Edit Schedule for ${staffMember.name}`}
      shopId={params.shopId}
      userRole={userRole}
      activeTab="team"
    >
      <ScheduleEditor 
        staffMember={staffMember} 
        shopId={shop.id}
      />
    </ShopAdminLayout>
  );
}
