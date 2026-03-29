import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import ClientGrid from '@/components/ClientGrid';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, pageStr: string) {
  const userFromDb = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isSuperAdmin = userFromDb?.role === 'SUPER_ADMIN';
  const isShopAdmin = userFromDb?.role === 'SHOP_ADMIN' && userFromDb?.shopId === shopId;
  const isStaff = userFromDb?.role === 'STAFF' && userFromDb?.shopId === shopId;

  if (!isSuperAdmin && !isShopAdmin && !isStaff) {
    return { shop: null, userRole: null, clients: [], totalPages: 0, currentPage: 1 };
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  if (!shop) {
    return { shop: null, userRole: userFromDb?.role, clients: [], totalPages: 0, currentPage: 1 };
  }

  const page = parseInt(pageStr) || 1;
  const pageSize = 24; // Load 24 clients per page
  const skip = (page - 1) * pageSize;

  const whereClause = {
    role: 'CLIENT' as const,
    OR: [
        { shopId: shopId },
        { clientAppointments: { some: { shopId: shopId } } }
    ]
  };

  const [totalCount, clients] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      include: {
          _count: {
              select: {
                  clientAppointments: { where: { shopId: shopId } }
              }
          },
          clientAppointments: {
              where: { shopId: shopId },
              orderBy: { startTime: 'desc' },
              take: 1,
              select: { startTime: true },
          },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const clientsWithLastVisit = clients.map(c => ({
    ...c,
    lastVisit: c.clientAppointments[0]?.startTime || null,
    clientAppointments: undefined,
  }));

  return { 
    shop: JSON.parse(JSON.stringify(shop)), 
    userRole: userFromDb?.role,
    clients: JSON.parse(JSON.stringify(clientsWithLastVisit)),
    totalPages,
    currentPage: page
  };
}

export default async function ClientsPage({ params, searchParams }: { params: { shopId: string }, searchParams: { page?: string } }) {
  const { userId } = auth();
  if (!userId) return redirect('/');

  const { shop, userRole, clients, totalPages, currentPage } = await getPageData(params.shopId, userId, searchParams.page || '1');

  if (!shop) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
            </div>
        </div>
    )
  }

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Client Directory"
      shopId={params.shopId}
      userRole={userRole as string}
      activeTab="clients"
    >
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Registered Clients</h2>
      </div>
      
      {clients.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8 sm:py-12 text-sm border border-dashed border-white/20 rounded">No clients registered to this shop yet.</p>
      ) : (
        <>
          <ClientGrid clients={clients} shopId={params.shopId} />
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/shop/${params.shopId}/clients?page=${p}`}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${
                    p === currentPage
                      ? "bg-brand-gold text-brand-dark"
                      : "bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </ShopAdminLayout>
  );
}
