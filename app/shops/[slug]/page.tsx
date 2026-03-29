import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import ClientPage from './ClientPage';

// Use this to ensure the page caches effectively unless revalidated
export const revalidate = 60;

async function getShopBySlug(slug: string) {
  // First, try to find by ID (for backward compatibility)
  let shop: any = await prisma.shop.findUnique({
    where: { id: slug },
    include: {
      services: {
        // ONLY GET CUSTOMER FACING SERVICES
        where: {
            type: 'CUSTOMER'
        },
        orderBy: { createdAt: 'desc' },
        // Optimization: Only select fields needed for the service cards
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
        }
      },
    },
  });

  if (!shop) {
    // If not found by ID, search by name (converted to slug format)
    const allShops = await prisma.shop.findMany({
      include: {
        services: {
          where: { type: 'CUSTOMER' },
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, description: true, price: true, duration: true }
        },
      },
    });

    shop = allShops.find(
      (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
    ) || null;
  }

  if (!shop) {
    return null;
  }

  // Serialize to plain objects and ensure customization is included
  const serialized = JSON.parse(JSON.stringify(shop));
  return {
    ...serialized,
    customization: serialized.customization || {},
    template: serialized.template || 'modern',
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);

  if (!shop) {
    return {
      title: 'Shop Not Found',
      description: 'The shop you are looking for does not exist.',
    };
  }

  return {
    title: `${shop.name} - Services & Booking`,
    description: shop.description || `Book services at ${shop.name}`,
    openGraph: {
      title: `${shop.name} - Services & Booking`,
      description: shop.description || `Book services at ${shop.name}`,
    },
  };
}

export default async function PublicShopPage({
  params,
}: {
  params: { slug: string };
}) {
  const shop = await getShopBySlug(params.slug);

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Shop Not Found</h1>
          <p className="text-gray-400">We couldn't find the shop you're looking for.</p>
        </div>
      </div>
    );
  }

  // Use the custom colors if they exist, otherwise fallback to defaults
  const primaryColor = shop.customization?.primaryColor || '#3b82f6'; // Default blue-500
  const secondaryColor = shop.customization?.secondaryColor || '#06b6d4'; // Default cyan-500
  const templateType = shop.template || 'modern';
  const sportRed = shop.customization?.primaryColor || '#d50000'; // Default to a strong red

  // Pass everything to the Client Component
  return (
      <ClientPage 
          shop={shop} 
          templateType={templateType} 
          primaryColor={primaryColor} 
          secondaryColor={secondaryColor} 
          sportRed={sportRed} 
      />
  );
}
