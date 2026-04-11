import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ClientGrid from '@/components/clients/ClientGrid';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, pageStr: string, view: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null;

  const page = parseInt(pageStr) || 1;
  const pageSize = 24;
  const skip = (page - 1) * pageSize;

  let whereClause: any = {
    role: 'CLIENT' as const,
    OR: [
        { shopId: shopId },
        { clientAppointments: { some: { shopId: shopId } } }
    ]
  };

  // If staff wants to see only their clients
  if (view === 'my' && data.userRole === 'STAFF') {
      const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: userId }] } });
      const actualUserId = dbUser?.id || userId;
      
      whereClause = {
          role: 'CLIENT' as const,
          clientAppointments: {
              some: { shopId: shopId, staffId: actualUserId }
          }
      };
  }

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

  const clientsWithLastVisit = clients.map((c: any) => ({
    ...c,
    lastVisit: c.clientAppointments[0]?.startTime || null,
    clientAppointments: undefined,
  }));

  return { 
    shop: data.shop,
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    clients: JSON.parse(JSON.stringify(clientsWithLastVisit)),
    totalPages,
    currentPage: page
  };
}

export default async function ClientsPage({ params, searchParams }: { params: Promise<{ shopId: string }>, searchParams: Promise<{ page?: string, view?: string }> }) {
  const { shopId } = await params;
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view || 'all';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const pageData = await getPageData(shopId, userId, resolvedSearchParams.page || '1', view);

  if (!pageData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const { shop, shopSlug, userRole, clients, totalPages, currentPage } = pageData;

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle="Client Directory"
      shopId={shopId}
      userRole={userRole as string}
      activeTab="clients"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Registered Clients</h2>
        
        {userRole === 'STAFF' && (
          <div className="flex bg-slate-800/80 p-1 rounded-lg border border-white/10">
            <a href={`/shop/${shopId}/clients?view=all`} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view !== 'my' ? 'bg-brand-gold text-slate-900' : 'text-gray-400 hover:text-white'}`}>All Clients</a>
            <a href={`/shop/${shopId}/clients?view=my`} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'my' ? 'bg-brand-gold text-slate-900' : 'text-gray-400 hover:text-white'}`}>My Clients</a>
          </div>
        )}
      </div>
      
      {clients.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8 sm:py-12 text-sm border border-dashed border-white/20 rounded">No clients registered to this shop yet.</p>
      ) : (
        <>
          <ClientGrid clients={clients} shopId={shopId} />
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/shop/${shopId}/clients?page=${p}`}
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
