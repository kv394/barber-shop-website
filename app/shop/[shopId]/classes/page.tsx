import { redirect } from 'next/navigation';

export default async function ClassesPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  redirect(`/shop/${shopId}/classes/schedules`);
}
