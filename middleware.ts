import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes — be MINIMAL: only what unauthenticated users truly need
// SECURITY: Use exact path patterns — avoid wildcards that match sub-routes
// (e.g., /appointments should NOT match /appointments/[id]/checkout)
const isPublicRoute = createRouteMatcher([
  '/',
  '/shops',
  '/shops/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/shops',                          // Shop listing for public directory
  '/api/shops/([^/]+)/appointments',     // Public booking slot listing (GET only, POST has own auth)
  '/api/shops/([^/]+)/staff',            // Public staff list for booking UI
  '/api/shops/([^/]+)/reviews',          // Public reviews display (GET only)
  '/api/users/init',                     // User initialization on first login
  '/api/cron',                           // Cron (has its own secret-based auth)
]);

// Generate a strict Content Security Policy
// Note: Clerk requires certain unsafe-eval and unsafe-inline policies for their scripts/styles to function correctly in development/production
const generateCsp = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.stripe.com;
    connect-src 'self' https://*.clerk.com https://*.stripe.com wss://*.clerk.com;
    img-src 'self' data: https://*.clerk.com https://images.unsplash.com https://cdn.pixabay.com;
    style-src 'self' 'unsafe-inline';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    font-src 'self' data:;
  `.replace(/\s{2,}/g, ' ').trim();
  
  // In dev, Next.js needs more relaxed CSP for HMR. We enforce strict CSP in production.
  return isDev ? '' : csp;
};

// Match shop pages (but NOT API routes or the team page)
// Note: SUPER_ADMIN restriction is enforced in the shop layout via x-pathname header

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Inject pathname into request headers so server components can read the current URL
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
  
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, etc)
  const csp = generateCsp();
  if (csp) {
    response.headers.set('Content-Security-Policy', csp);
  }
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Strict Transport Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
