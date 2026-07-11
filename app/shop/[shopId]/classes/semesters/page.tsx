import prisma from '@/lib/prisma';
import ClassSemesterManager from '@/components/shop-admin/classes/ClassSemesterManager';

export default async function SemestersPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;
  
  const terms = await prisma.academicTerm.findMany({
    where: { shopId },
    orderBy: { startDate: 'desc' }
  });

  return <ClassSemesterManager shopId={shopId} terms={terms} />;
}
