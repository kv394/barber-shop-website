import { NextResponse } from 'next/server';

/**
 * Returns CORS headers based on the request origin.
 * Allows origins matching configured root domains and Vercel preview deploys.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedDomains = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').split(',').map(d => d.trim());
  const isAllowed = allowedDomains.some(domain => origin.includes(domain)) || origin.includes('vercel.app');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * Validates whether the request origin is allowed for a specific shop.
 * Checks custom domains, subdomains, root domains, configured websites,
 * and Vercel preview sub-paths.
 */
export function isOriginAllowedForShop(
  req: Request,
  shop: { customDomain: string | null; subdomain: string | null; name: string },
  shopId: string,
  configuredWebsite: string
): boolean {
  const originHeader = req.headers.get('origin') || '';
  const refererHeader = req.headers.get('referer') || '';
  const origin = originHeader || refererHeader;

  const allowedOrigins = [
    `https://${shop.customDomain}`,
    `http://${shop.customDomain}`,
    `https://${shop.subdomain}.kutzapp.com`,
    `http://${shop.subdomain}.kutzapp.com`,
    `http://localhost:3000`,
  ];
  const rootDomainStr = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000,kutzapp.vercel.app';
  rootDomainStr.split(',').forEach(d => {
    allowedOrigins.push(`https://${d}`);
    allowedOrigins.push(`http://${d}`);
  });

  if (configuredWebsite) {
    allowedOrigins.push(configuredWebsite);
    try {
      const urlObj = new URL(configuredWebsite.startsWith('http') ? configuredWebsite : `https://${configuredWebsite}`);
      allowedOrigins.push(urlObj.origin);
    } catch (e) {
      // ignore invalid urls
    }
  }

  const isSaaSSubPath = refererHeader && shop.subdomain && refererHeader.includes(`/shops/${shop.subdomain}`);
  const isSaaSIdPath = refererHeader && refererHeader.includes(`/shops/${shopId}`);
  const slug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const isSaaSSlugPath = refererHeader && refererHeader.includes(`/shops/${slug}`);

  return !origin || allowedOrigins.some(ao => origin.startsWith(ao)) || !!isSaaSSubPath || !!isSaaSIdPath || !!isSaaSSlugPath;
}

/**
 * Handler for CORS preflight OPTIONS requests.
 */
export function handleOptions(req: Request): NextResponse {
  return new NextResponse(null, { headers: getCorsHeaders(req) });
}
