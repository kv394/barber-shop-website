import { redirect } from 'next/navigation';

export default async function ClassesPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;
  redirect(`/shop/${shopId}/classes/schedules`);
}
