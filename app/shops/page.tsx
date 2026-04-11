import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const { shops, totalCount, totalPages } = await getShopsPage(currentPage);

  return (
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden">
      {/* Hero Section */}
      <section className="bg-black/40 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
              Discover Top Shops
            </h1>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
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
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
                  Featured Shops
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                <p className="text-gray-400 mt-2 sm:mt-4 text-sm">
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
                    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer h-full flex flex-col">
                      {/* Shop Image Placeholder */}
                      <div className="w-full h-48 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-colors flex items-center justify-center">
                        <div className="text-5xl">🏪</div>
                      </div>

                      {/* Shop Info */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                          {shop.name}
                        </h3>

                        {shop.description && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
                            {shop.description}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex gap-4 py-4 border-t border-b border-slate-700 mt-auto">
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs uppercase tracking-wider">
                              Services
                            </p>
                            <p className="text-white font-bold text-lg">
                              {shop._count?.services || 0}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs uppercase tracking-wider">
                              Team
                            </p>
                            <p className="text-white font-bold text-lg">
                              {shop._count?.users || 0}
                            </p>
                          </div>
                        </div>

                        {/* CTA */}
                        <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
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
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:space-x-4 border-t border-slate-700 pt-6 sm:pt-8">
                {currentPage > 1 ? (
                  <Link 
                    href={`/shops?page=${currentPage - 1}`}
                    className="px-5 sm:px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm w-full sm:w-auto text-center"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="px-5 sm:px-6 py-2 bg-slate-900 text-slate-600 rounded-lg border border-slate-800 cursor-not-allowed text-sm w-full sm:w-auto text-center">
                    ← Previous
                  </span>
                )}
                
                <span className="text-gray-400 text-sm">
                  Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link 
                    href={`/shops?page=${currentPage + 1}`}
                    className="px-5 sm:px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 text-sm w-full sm:w-auto text-center"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="px-5 sm:px-6 py-2 bg-slate-900 text-slate-600 rounded-lg border border-slate-800 cursor-not-allowed text-sm w-full sm:w-auto text-center">
                    Next →
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No shops available yet.</p>
            <p className="text-gray-500">
              Check back soon for new shops to explore!
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-black/40 py-12 sm:py-20 border-t border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-16">
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
                className="text-center bg-slate-800/50 rounded-lg p-6 sm:p-8 border border-slate-700 hover:border-blue-500 transition-colors"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Start?
          </h2>
          <p className="text-blue-100 text-base sm:text-lg mb-6 sm:mb-8">
            Browse our shops, find the perfect service, and book your appointment
            today.
          </p>
          <button className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            Explore Shops
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-slate-700 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">ShopHub</h3>
              <p className="text-gray-400">
                Your one-stop destination for quality services.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
