import BookingWizard from '@/components/booking/BookingWizard';

export default async function EmbedBookPage({ params, searchParams }: { params: Promise<{ shopId: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { shopId } = await params;
  const sp = searchParams ? await searchParams : {};
  const themeColor = typeof sp.themeColor === 'string' ? sp.themeColor : undefined;
  const templateType = typeof sp.templateType === 'string' ? sp.templateType : undefined;

  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-y-auto">
      <BookingWizard shopId={shopId} themeColor={themeColor} templateType={templateType} />
    </div>
  );
}
