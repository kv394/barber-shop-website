import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// Cache the directory page
export const revalidate = 60;

// Pagination configuration
const ITEMS_PER_PAGE = 12;

async function getShopsPage(page: number = 1) {
  const skip = (page - 1) * ITEMS_PER_PAGE;
  
  const [shops, totalCount] = await Promise.all([
    prisma.shop.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      // Performance: Only fetch what we need for the directory card
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: { services: true, users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shop.count()
  ]);

  return { shops, totalCount, totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE) };
}

export default async function ShopsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, shopId: true, shop: { select: { name: true } } }
    });
    
    if (dbUser && dbUser.role !== 'CLIENT') {
       redirect('/');
    } else if (dbUser && dbUser.role === 'CLIENT' && dbUser.shopId && dbUser.shop?.name) {
       const targetSlug = dbUser.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
       redirect(`/shops/${targetSlug}`);
    }
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const { shops, totalCount, totalPages } = await getShopsPage(currentPage);

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-crm-surface backdrop-blur-md border-b border-crm-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
          <div className="text-center">
            <h1 className="font-bold text-crm-text mb-4 sm:mb-6 text-4xl md:text-5xl lg:text-6xl">
              Discover Top Shops
            </h1>
            <p className="text-crm-muted max-w-2xl mx-auto text-base md:text-lg">
              Find the best services near you. Browse through our network of
              quality shops and book your appointment today.
            </p>
          </div>
        </div>
      </section>

      {/* Shops Grid Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        {shops && shops.length > 0 ? (
          <>
            <div className="mb-8 sm:mb-16 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
              <div>
                <h2 className="font-bold text-crm-text mb-2 sm:mb-4 text-3xl md:text-4xl">
                  Featured Shops
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                <p className="text-crm-muted mt-2 sm:mt-4 text-base md:text-lg">
                  Showing {shops.length} of {totalCount} shop{totalCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              {shops.map((shop: any) => {
                const shopSlug = shop.name
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^\w-]/g, '');

                return (
                  <Link key={shop.id} href={`/shops/${shopSlug}`}>
                    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-crm-border shadow-sm hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer h-full flex flex-col">
                      {/* Shop Image Placeholder */}
                      <div className="w-full h-48 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-colors flex items-center justify-center">
                        <div className="text-5xl">🏪</div>
                      </div>

                      {/* Shop Info */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-crm-text group-hover:text-status-info transition-colors mb-2 text-2xl md:text-3xl">
                          {shop.name}
                        </h3>

                        {shop.description && (
                          <p className="text-crm-muted mb-4 line-clamp-2 flex-grow text-base md:text-lg">
                            {shop.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex gap-4 py-4 border-t border-b border-crm-border mt-auto">
                          <div className="flex-1">
                            <p className="text-crm-muted uppercase tracking-wider text-base md:text-lg">
                              Services
                            </p>
                            <p className="text-crm-text font-bold text-base md:text-lg">
                              {shop._count?.services || 0}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-crm-muted uppercase tracking-wider text-base md:text-lg">
                              Team
                            </p>
                            <p className="text-crm-text font-bold text-base md:text-lg">
                              {shop._count?.users || 0}
                            </p>
                          </div>
                        </div>

                        {/* CTA */}
                        <button className="w-full mt-4 bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 font-semibold py-2 rounded-lg transition-colors">
                          View Shop →
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:space-x-4 border-t border-crm-border pt-6 sm:pt-8">
                {currentPage > 1 ? (
                  <Link 
                    href={`/shops?page=${currentPage - 1}`}
                    className="px-5 sm:px-6 py-2 bg-crm-surface hover:bg-crm-surface text-crm-text rounded-lg transition-colors border border-slate-600 text-sm w-full sm:w-auto text-center"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="px-5 sm:px-6 py-2 bg-crm-surface text-crm-muted rounded-lg border border-crm-border shadow-sm cursor-not-allowed text-sm w-full sm:w-auto text-center">
                    ← Previous
                  </span>
                )}
                
                <span className="text-crm-muted text-sm">
                  Page <span className="text-crm-text font-bold">{currentPage}</span> of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link 
                    href={`/shops?page=${currentPage + 1}`}
                    className="px-5 sm:px-6 py-2 bg-crm-surface hover:bg-crm-surface text-crm-text rounded-lg transition-colors border border-slate-600 text-sm w-full sm:w-auto text-center"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="px-5 sm:px-6 py-2 bg-crm-surface text-crm-muted rounded-lg border border-crm-border shadow-sm cursor-not-allowed text-sm w-full sm:w-auto text-center">
                    Next →
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-crm-muted mb-4 text-base md:text-lg">No shops available yet.</p>
            <p className="text-crm-muted text-base md:text-lg">
              Check back soon for new shops to explore!
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-crm-surface py-12 sm:py-20 border-t border-crm-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-bold text-crm-text text-center mb-8 sm:mb-16 text-3xl md:text-4xl">
            Why Choose Us?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                icon: '✓',
                title: 'Quality Services',
                description:
                  'All our partner shops are vetted and provide high-quality services.',
              },
              {
                icon: '🕐',
                title: 'Easy Booking',
                description:
                  'Book your appointment in minutes with our simple online system.',
              },
              {
                icon: '💬',
                title: 'Customer Support',
                description:
                  'We are here to help you 24/7 with any questions or concerns.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center bg-crm-surface rounded-lg p-6 sm:p-8 border border-crm-border shadow-sm hover:border-blue-500 transition-colors"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="font-bold text-crm-text mb-2 sm:mb-3 text-2xl md:text-3xl">
                  {feature.title}
                </h3>
                <p className="text-crm-muted text-base md:text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-bold text-crm-text mb-4 sm:mb-6 text-3xl md:text-4xl">
            Ready to Start?
          </h2>
          <p className="text-blue-100 mb-6 sm:mb-8 text-base md:text-lg">
            Browse our shops, find the perfect service, and book your appointment
            today.
          </p>
          <button className="bg-crm-surface hover:bg-gray-100 text-status-info font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            Explore Shops
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-crm-surface border-t border-crm-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-crm-text font-bold mb-4 text-2xl md:text-3xl">ShopHub</h3>
              <p className="text-crm-muted text-base md:text-lg">
                Your one-stop destination for quality services.
              </p>
            </div>
            <div>
              <h4 className="text-crm-text font-bold mb-4 text-xl md:text-2xl">Quick Links</h4>
              <ul className="space-y-2 text-crm-muted">
                <li>
                  <a href="#" className="hover:text-crm-text transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-crm-text transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-crm-text transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-crm-text font-bold mb-4 text-xl md:text-2xl">Follow Us</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-crm-muted hover:text-crm-text transition"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-crm-muted hover:text-crm-text transition"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-crm-muted hover:text-crm-text transition"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-crm-border pt-8 text-center text-crm-muted text-sm">
            <p className="text-base md:text-lg">&copy; {new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
