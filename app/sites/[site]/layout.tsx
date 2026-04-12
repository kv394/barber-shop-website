import { cache } from 'react';
import { prisma } from '@/lib/prisma';

const getShopBySite = cache(async (site: string) => {
  let subdomain = site;
  if (site.includes('.vercel.app')) {
    subdomain = site.split('.')[0];
  } else if (site.includes('localhost')) {
    subdomain = site.split(':')[0];
  }

  let shop = await prisma.shop.findUnique({
    where: { customDomain: site },
    select: { customization: true, template: true }
  });

  if (!shop && subdomain) {
    shop = await prisma.shop.findUnique({
      where: { subdomain },
      select: { customization: true, template: true }
    });
  }

  if (!shop) {
    shop = await prisma.shop.findUnique({
      where: { id: site.split('.')[0] },
      select: { customization: true, template: true }
    });
  }

  return shop;
});

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ site: string }>;
}) {
  const { site } = await params;
  const shop = await getShopBySite(decodeURIComponent(site));

  if (!shop) {
    return <>{children}</>;
  }

  const custom = shop.customization as any || {};
  const primaryColor = custom.primaryColor || '#3b82f6';
  const secondaryColor = custom.secondaryColor || '#06b6d4';
  const fontMain = custom.fontFamily || 'sans-serif';

  const cssVars = `
    :root {
      --primary: ${primaryColor};
      --accent: ${secondaryColor};
      --font-main: ${fontMain};
    }
  `;

  return (
    <>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      {children}
    </>
  );
}
