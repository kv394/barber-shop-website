import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import ClientPage from '@/app/shops/[slug]/ClientPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 60;

const serviceInclude = {
  services: {
    where: { type: 'CUSTOMER' as const },
    orderBy: { createdAt: 'desc' as const },
    select: { id: true, name: true, description: true, price: true, duration: true },
  },
};

const getShopBySite = cache(async (site: string) => {
  // If it's a subdomain on vercel, extract the subdomain
  let subdomain = site;
  let customDomain = site;
  
  if (site.includes('.vercel.app')) {
    subdomain = site.split('.')[0];
  } else if (site.includes('localhost')) {
    subdomain = site.split(':')[0]; // Just in case, though middleware excludes localhost
  }

  // 1. Try to find by customDomain
  let shop: any = await prisma.shop.findUnique({
    where: { customDomain: site },
    include: serviceInclude,
  });

  // 2. Try to find by subdomain
  if (!shop && subdomain) {
    shop = await prisma.shop.findUnique({
      where: { subdomain },
      include: serviceInclude,
    });
  }
  
  // Fallback (for testing / backward compat): treat site as slug/ID
  if (!shop) {
    shop = await prisma.shop.findUnique({
      where: { id: site.split('.')[0] },
      include: serviceInclude,
    });
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
  const rawCustom = serialized.customization || {};
  
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

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
  const { site } = await params;
  const shop = await getShopBySite(decodeURIComponent(site));

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

export default async function SitePage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const shop = await getShopBySite(decodeURIComponent(site));

  if (!shop) {
    return (
      <div className="h-[100dvh] overflow-y-auto overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-botanical-text mb-4">Shop Not Found</h1>
          <p className="text-botanical-muted">We couldn't find the shop for this domain ({site}).</p>
        </div>
      </div>
    );
  }

  const primaryColor = shop.customization?.primaryColor || '#3b82f6';
  const secondaryColor = shop.customization?.secondaryColor || '#06b6d4';
  const templateType = shop.template || 'modern';
  const sportRed = shop.customization?.primaryColor || '#d50000';

  let dynamicTemplateHtml = null;
  let dynamicTemplateCss = null;

  if (!['modern', 'classic', 'minimal', 'sporty', 'corporate', 'noir', 'sunset', 'editorial'].includes(templateType)) {
    const dynamicTemplate = await prisma.dynamicTemplate.findUnique({
      where: { name: templateType }
    });

    if (dynamicTemplate) {
      try {
        const Handlebars = (await import('handlebars')).default;
        const compiledTemplate = Handlebars.compile(dynamicTemplate.htmlCode);
        dynamicTemplateHtml = compiledTemplate({
          shop,
          primaryColor,
          secondaryColor
        });
        dynamicTemplateCss = dynamicTemplate.cssCode;
      } catch (e) {
        console.error('Handlebars error:', e);
      }
    }
  }

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
