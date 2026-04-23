import BookingWizard from '@/components/booking/BookingWizard';

export default function EmbedBookPage({ params }: { params: { shopId: string } }) {
  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-y-auto">
      <BookingWizard shopId={params.shopId} />
    </div>
  );
}
