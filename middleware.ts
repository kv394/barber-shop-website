import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { rateLimit } from '@/lib/rate-limiter';

const publicRoutes = [
  '^/$',
  '^/api/admin/clean-shops$',
  '^/embed/book(?:/.*)?$',
  '^/shops(?:/.*)?$',
  '^/sign-in(?:/.*)?$',
  '^/sign-up(?:/.*)?$',
  '^/forgot-password(?:/.*)?$',
  '^/recover-password(?:/.*)?$',
  '^/update-password(?:/.*)?$',
  '^/api/auth/callback(?:/.*)?$',
  '^/api/shops$',
  '^/api/shops/[^/]+/appointments$',
  '^/api/shops/[^/]+/services$',
  '^/api/shops/[^/]+/staff$',
  '^/api/shops/[^/]+/business-hours$',
  '^/api/shops/[^/]+/reviews$',
  '^/api/shops/[^/]+/public-data$',
  '^/sites/[^/]+(?:/.*)?$',
  '^/api/users/init$',
  '^/api/users/me$',
  '^/api/inngest(?:/.*)?$',
  '^/api/webhooks(?:/.*)?$',
  '^/api/chat/booking(?:/.*)?$',
  '^/api/assets(?:/.*)?$'
];

const isPublicRoute = (path: string) => {
  return publicRoutes.some(pattern => new RegExp(pattern).test(path));
};

// Generate a strict Content Security Policy
const generateCsp = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stripe.com;
    img-src 'self' data: https://images.unsplash.com https://cdn.pixabay.com https://*.googleusercontent.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    frame-src 'self' https://*.stripe.com https://*.supabase.co https://www.google.com;
    font-src 'self' data: https://fonts.gstatic.com;
  `.replace(/\s{2,}/g, ' ').trim();
  
  return isDev ? '' : csp;
};

export async function middleware(req: NextRequest) {
  // Allow OPTIONS requests to pass through for CORS preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  
  const isApi = url.pathname.startsWith('/api');

  // ── Global API Rate Limiting ──
  // Skip rate limiting for server-to-server webhooks (they have their own signature verification)
  if (isApi && !url.pathname.startsWith('/api/inngest') && !url.pathname.startsWith('/api/webhooks')) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    let limit = 2000; // Raised from 300 to 2000 to prevent 429s on frequent polling components like TeamChat

    if (url.pathname.includes('/auth') || url.pathname.includes('/sign-in') || url.pathname.includes('/sign-up')) {
      limit = 50; // Stricter for auth
    } else if (url.pathname.includes('/appointments') && req.method === 'POST') {
      limit = 100; // Stricter for bookings
    }

    const { success } = await rateLimit(`mw:${ip}`, limit, 60);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }
  const isAdmin = url.pathname.startsWith('/siteadmin');
  const isStatic = url.pathname.startsWith('/_next') || url.pathname.startsWith('/static') || url.pathname.includes('.');
  
  // We identify root domains so we know when to treat a host as a tenant subdomain vs base saas
  const rootDomainStr = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
  const rootDomains = [
    'localhost:3000',
    'kutzapp.com',
    'www.kutzapp.com',
    'kutzapp.vercel.app',
    ...rootDomainStr.split(',').filter(Boolean),
  ];
  
  // Securely identify our Vercel preview environments
  // This prevents tenants using their own .vercel.app domains from bypassing the tenant routing logic.
  const vercelEnv = req.headers.get('x-vercel-env') || process.env.VERCEL_ENV;
  const vercelDeploymentUrl = req.headers.get('x-vercel-deployment-url') || process.env.VERCEL_URL;
  
  const isVercelPreview = hostname.endsWith('.vercel.app') && (vercelEnv === 'preview' || hostname === vercelDeploymentUrl);
  
  // Any standard Vercel project domain (e.g., project-name.vercel.app) has exactly 2 dots
  // This prevents it from being treated as a tenant custom domain.
  const isVercelBaseDomain = hostname.endsWith('.vercel.app') && hostname.split('.').length === 3;
  
  const shouldRewrite = !isApi && !isAdmin && !isStatic && !rootDomains.includes(hostname) && !isVercelPreview && !isVercelBaseDomain && !url.pathname.startsWith('/sites');

  const requestHeaders = new Headers(req.headers);
  const impersonateShopId = req.cookies.get('kutz_impersonate_shop')?.value;
  if (impersonateShopId) {
    requestHeaders.set('x-impersonated-shop-id', impersonateShopId);
  }

  let response: NextResponse;
  if (shouldRewrite) {
    response = NextResponse.rewrite(new URL(`/sites/${hostname}${url.pathname}`, req.url), {
      request: { headers: requestHeaders },
    });
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            const safeOptions = { ...options };
            if (process.env.NODE_ENV !== 'production') {
              safeOptions.secure = false;
            }
            response.cookies.set(name, value, safeOptions);
          });
        },
      },
    }
  );

  // Only call getUser() for non-public routes to avoid unnecessary network round-trips
  const isPublic = isPublicRoute(req.nextUrl.pathname);

  if (!isPublic) {
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect unauthenticated users to sign-in on protected routes
    if (!user) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = '/sign-in';
      return NextResponse.redirect(signInUrl);
    }

    // Cross-Shop Isolation Logic
    if (isApi && req.nextUrl.pathname.includes('/api/shops/')) {
      const match = req.nextUrl.pathname.match(/\/api\/shops\/([^/]+)/);
      if (match && match[1]) {
        // Pass the authenticated user's ID as a header so API routes can enforce shop-level access control
        response.headers.set('x-user-id', user.id);
      }
    }
  }

  // Inject pathname into request headers so server components can read the current URL
  response.headers.set('x-pathname', req.nextUrl.pathname);

  // Apply Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, etc)
  const csp = generateCsp();
  if (csp) {
    response.headers.set('Content-Security-Policy', csp);
  }
  
  // Prevent clickjacking for non-embed routes
  if (!req.nextUrl.pathname.startsWith('/embed/') && !req.nextUrl.pathname.startsWith('/my-appointments')) {
    response.headers.set('X-Frame-Options', 'DENY');
  }
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Strict Transport Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()');

  // Clean up old cookies
  const legacyCookies = req.cookies.getAll().filter(c => c.name.includes('__session') || c.name.includes('__client'));
  legacyCookies.forEach(c => {
    response.cookies.delete(c.name);
  });

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
