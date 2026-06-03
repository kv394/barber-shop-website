import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import FeatureRequestsPanel from '@/components/siteadmin/FeatureRequestsPanel';

export const dynamic = 'force-dynamic';

export default async function SiteAdminShopDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true }
      },
      _count: {
        select: {
          appointments: true,
          products: true,
          services: true,
          reviews: true,
          shopClients: true,
        }
      }
    }
  });

  if (!shop) {
    notFound();
  }

  const admins = shop.users.filter((u: any) => u.role === 'SHOP_ADMIN');
  const staffCount = shop.users.filter((u: any) => u.role === 'STAFF').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/siteadmin/shops" className="text-crm-accent hover:underline text-sm mb-4 inline-block">
            ← Back to Shops
          </Link>
          <h1 className="font-serif font-bold text-crm-text text-3xl">{shop.name}</h1>
          <p className="text-crm-muted font-mono text-sm mt-1">ID: {shop.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/shop/${shop.id}`}
            className="bg-brand-indigo hover:bg-brand-indigo/90 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-brand-indigo/20 transition-all flex items-center gap-2"
          >
            <span>👤</span> Impersonate Shop
          </Link>
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5">
        <h3 className="text-indigo-300 font-bold mb-2 flex items-center gap-2">
          <span>ℹ️</span> About Impersonation
        </h3>
        <p className="text-indigo-200/80 text-sm leading-relaxed">
          As a Site Administrator, you can bypass shop-level restrictions. Clicking <strong>Impersonate Shop</strong> navigates you directly to this shop's dashboard. Your SITE_ADMIN role automatically grants you full visibility into their operations without needing separate authentication or changing your user token.
        </p>
      </div>

      {/* Feature Requests Panel */}
      <FeatureRequestsPanel shopId={shop.id} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-crm-surface border border-crm-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-crm-text mb-4 border-b border-crm-border pb-2">Overview</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-crm-muted">Created</dt>
              <dd className="text-crm-text font-medium">{new Date(shop.createdAt).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Company Name</dt>
              <dd className="text-crm-text font-medium">{shop.companyName || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Template</dt>
              <dd className="text-crm-text font-medium capitalize">{shop.template}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Timezone</dt>
              <dd className="text-crm-text font-medium">{shop.timezone}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-crm-surface border border-crm-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-crm-text mb-4 border-b border-crm-border pb-2">Metrics</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-crm-muted">Total Appointments</dt>
              <dd className="text-crm-text font-medium">{shop._count.appointments}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Total Clients</dt>
              <dd className="text-crm-text font-medium">{shop._count.shopClients}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Services Offered</dt>
              <dd className="text-crm-text font-medium">{shop._count.services}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Products</dt>
              <dd className="text-crm-text font-medium">{shop._count.products}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">Reviews</dt>
              <dd className="text-crm-text font-medium">{shop._count.reviews}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-crm-muted">AI Tokens</dt>
              <dd className="text-crm-text font-medium">{shop.aiTokens}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-crm-surface border border-crm-border rounded-xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-crm-text mb-4 border-b border-crm-border pb-2">Team</h2>
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-crm-muted uppercase tracking-wider mb-2">Shop Admins ({admins.length})</h3>
              {admins.length > 0 ? (
                <ul className="space-y-2">
                  {admins.map((admin: any) => (
                    <li key={admin.id} className="text-sm text-crm-text flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-crm-primary/20 text-crm-primary flex items-center justify-center font-bold text-xs">
                        {admin.name?.charAt(0) || admin.email.charAt(0)}
                      </span>
                      <span className="truncate">{admin.name || admin.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-status-pending bg-status-pending/10 px-2 py-1 rounded inline-block font-medium">No Admins Assigned</p>
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-crm-muted uppercase tracking-wider mb-2">Staff Members</h3>
              <p className="text-sm text-crm-text">{staffCount} total staff</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
