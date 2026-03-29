import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getShopLayoutData } from '@/lib/shop-data';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { ShopNav } from '@/app/components/ShopNav';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { shopId: string };
}) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const data = await getShopLayoutData(userId, params.shopId);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-900 text-white px-3 py-4 sm:p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-7xl">
        <header className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            <Link href="/">
              <span className="text-white">Barber</span>
              <span className="text-brand-gold">SaaS</span>
            </Link>
          </h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between sm:items-end border-b border-white/10 pb-4 sm:pb-6 gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-brand-gold mb-1 sm:mb-2 truncate">{data.shop.name}</h2>
          </div>
          <div className="flex shrink-0">
            <Link
              href={`/shops/${data.shopSlug}`}
              target="_blank"
              className="bg-brand-gold text-brand-dark hover:bg-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              View Public Page ↗
            </Link>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}

