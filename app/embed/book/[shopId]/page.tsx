import BookingWizard from '@/components/booking/BookingWizard';

export default async function EmbedBookPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-y-auto">
      <BookingWizard shopId={shopId} />
    </div>
  );
}
