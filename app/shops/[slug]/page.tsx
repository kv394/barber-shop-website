import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import ClientPage from './ClientPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getOrCreateFolder, downloadFileFromFolder } from '@/lib/google-drive';

// Use this to ensure the page caches effectively unless revalidated
export const revalidate = 60;

const serviceInclude = {
  services: {
    where: { type: 'CUSTOMER' as const },
    orderBy: { createdAt: 'desc' as const },
    select: { id: true, name: true, description: true, price: true, duration: true },
  },
};

const getShopBySlug = cache(async (slug: string) => {
  // 1. Try to find by exact ID (backward compat)
  let shop: any = await prisma.shop.findUnique({
    where: { id: slug },
    include: serviceInclude,
  });

  if (!shop) {
    // 2. Case-insensitive name search — avoids loading ALL shops into memory.
    //    The slug is derived from name via: lower → spaces→hyphens → strip non-word.
    //    Reverse the slug to a LIKE-able pattern (hyphens → space wildcard).
    const namePattern = slug.replace(/-/g, '%');
    const candidates = await prisma.shop.findMany({
      where: { name: { contains: namePattern.replace(/%/g, ' '), mode: 'insensitive' } },
      include: serviceInclude,
      take: 10, // Bounded — never fetches entire table
    });

    shop = candidates.find(
      (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
    ) || null;
  }

  if (!shop) return null;

  // Fetch reviews for this shop
  const reviews = await prisma.review.findMany({
    where: { shopId: shop.id },
    include: {
      user: { select: { name: true } },
      appointment: {
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const serialized = JSON.parse(JSON.stringify(shop));
  // SECURITY: Only expose public-facing customization fields to the client.
  // Internal settings like notifSettings, bookingSettings, businessHours are admin-only.
  const rawCustom = serialized.customization || {};
  
  // Format address if it's an object
  const rawAddress = rawCustom.address;
  const formattedAddress = typeof rawAddress === 'object' && rawAddress !== null
    ? [rawAddress.street, rawAddress.suite, rawAddress.city, rawAddress.state, rawAddress.zip, rawAddress.country].filter(Boolean).join(', ')
    : rawAddress;

  const publicCustomization = {
    primaryColor: rawCustom.primaryColor,
    secondaryColor: rawCustom.secondaryColor,
    logoUrl: rawCustom.logoUrl,
    bannerUrl: rawCustom.bannerUrl,
    tagline: rawCustom.tagline,
    address: formattedAddress,
    phone: rawCustom.phone,
    aboutText: rawCustom.aboutText,
    socialLinks: rawCustom.socialLinks,
    // Expose business hours for public schedule display
    businessHours: rawCustom.businessHours,
    pages: rawCustom.pages,
    editorialCustomization: rawCustom.editorialCustomization,
  };
  return {
    ...serialized,
    customization: publicCustomization,
    template: serialized.template || 'modern',
    reviews: JSON.parse(JSON.stringify(reviews)),
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams?.preview === 'true';
  const shop = await getShopBySlug(slug);

  if (!shop) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-botanical-text mb-4">Shop Not Found</h1>
          <p className="text-botanical-muted">We couldn't find the shop you're looking for.</p>
        </div>
      </div>
    );
  }

  // Automatically redirect STAFF and ADMINS to their dashboard (the BarberSaaS base URL)
  // Only CLIENTS should be viewing the public shop landing page.
  if (!isPreview) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true, shopId: true }
      });
      
      if (dbUser && dbUser.role !== 'CLIENT') {
         redirect('/');
      }
    }
  }

  // Use the custom colors if they exist, otherwise fallback to defaults
  const primaryColor = shop.customization?.primaryColor || '#3b82f6'; // Default blue-500
  const secondaryColor = shop.customization?.secondaryColor || '#06b6d4'; // Default cyan-500
  const templateType = shop.template || 'modern';
  const sportRed = shop.customization?.primaryColor || '#d50000'; // Default to a strong red

  let dynamicTemplateHtml = null;
  let dynamicTemplateCss = null;

  if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType)) {
    const dynamicTemplate = await prisma.dynamicTemplate.findUnique({
      where: { name: templateType }
    });

    if (dynamicTemplate) {
      let htmlCode = dynamicTemplate.htmlCode;
      let cssCode = dynamicTemplate.cssCode;

      try {
        const barbersaasFolderId = await getOrCreateFolder('barbersaas');
        if (barbersaasFolderId) {
          const shopFolderId = await getOrCreateFolder(shop.id, barbersaasFolderId);
          if (shopFolderId) {
            const templateFolderId = await getOrCreateFolder(templateType, shopFolderId);
            if (templateFolderId) {
              const driveHtml = await downloadFileFromFolder(templateFolderId, 'index.html');
              const driveCss = await downloadFileFromFolder(templateFolderId, 'styles.css');
              if (driveHtml) htmlCode = driveHtml;
              if (driveCss) cssCode = driveCss;
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch template from Google Drive, falling back to DB:', e);
      }

      try {
        const Handlebars = (await import('handlebars')).default;
        const compiledTemplate = Handlebars.compile(htmlCode);
        dynamicTemplateHtml = compiledTemplate({
          ...shop.customization,
          shop,
          primaryColor,
          secondaryColor
        });
        dynamicTemplateCss = cssCode;
      } catch (e) {
        console.error('Handlebars error:', e);
      }
    }
  }

  // Pass everything to the Client Component
  return (
      <ClientPage 
          shop={shop} 
          templateType={templateType} 
          primaryColor={primaryColor} 
          secondaryColor={secondaryColor} 
          sportRed={sportRed}
          reviews={shop.reviews || []}
          dynamicTemplateHtml={dynamicTemplateHtml}
          dynamicTemplateCss={dynamicTemplateCss}
      />
  );
}
