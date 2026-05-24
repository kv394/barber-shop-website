import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ClientGrid from '@/components/clients/ClientGrid';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';

export const dynamic = 'force-dynamic';

async function getPageData(shopId: string, userId: string, pageStr: string) {
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

  // If staff or booth renter, force them to see only their clients
  if (data.userRole === 'STAFF' || data.userRole === 'BOOTH_RENTER') {
      whereClause = {
          role: 'CLIENT' as const,
          clientAppointments: {
              some: { shopId: shopId, staffId: data.user.id }
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

export default async function ClientsPage({ params, searchParams }: { params: Promise<{ shopId: string }>, searchParams: Promise<{ page?: string, openClient?: string }> }) {
  const { shopId } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return redirect('/');

  const pageData = await getPageData(shopId, userId, resolvedSearchParams.page || '1');

  if (!pageData) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <h1 className="font-bold text-status-cancelled mb-4 text-2xl font-bold">Access Denied</h1>
          <p className="text-crm-muted text-[13px]">You do not have permission to view this page.</p>
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
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-4 sm:mb-6 gap-4">
        {/* Buttons or other actions could go here in the future */}
      </div>
      
      {clients.length === 0 && !resolvedSearchParams.openClient ? (
        <p className="text-crm-muted italic text-center py-8 sm:py-12 border border-dashed border-crm-border rounded text-[13px]">No clients registered to this shop yet.</p>
      ) : (
        <>
          <ClientGrid clients={clients} shopId={shopId} initialSelectedClientId={resolvedSearchParams.openClient} currency={shop.currency} />
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/shop/${shopId}/clients?page=${p}`}
                  className={`w-8 h-8 flex items-center justify-center rounded text-[13px] font-bold transition-colors ${
                    p === currentPage
                      ? "bg-crm-primary text-white"
                      : "bg-crm-surface text-crm-muted hover:bg-crm-surface hover:text-crm-text"
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
