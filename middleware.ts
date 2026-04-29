import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const publicRoutes = [
  '^/$',
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
  '^/api/cron$',
  '^/api/apply-heritage$',
  '^/api/debug-kiosk-login$',
  '^/api/chat/booking(?:/.*)?$'
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
    img-src 'self' data: https://images.unsplash.com https://cdn.pixabay.com;
    style-src 'self' 'unsafe-inline';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    font-src 'self' data:;
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
  const isAdmin = url.pathname.startsWith('/siteadmin');
  const isStatic = url.pathname.startsWith('/_next') || url.pathname.startsWith('/static') || url.pathname.includes('.');
  
  // We identify root domains so we know when to treat a host as a tenant subdomain vs base saas
  const rootDomainStr = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000,barbersaas.vercel.app,barbersaas-henna.vercel.app';
  const rootDomains = rootDomainStr.split(',');
  
  const shouldRewrite = !isApi && !isAdmin && !isStatic && !rootDomains.includes(hostname) && !url.pathname.startsWith('/sites');

  let response: NextResponse;
  if (shouldRewrite) {
    response = NextResponse.rewrite(new URL(`/sites/${hostname}${url.pathname}`, req.url), {
      request: { headers: new Headers(req.headers) },
    });
  } else {
    response = NextResponse.next({
      request: { headers: new Headers(req.headers) },
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          response = NextResponse.next({ request: { headers: new Headers(req.headers) } });
          cookiesToSet.forEach(({ name, value, options }) => {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (req.nextUrl.pathname === '/api/users/me') {
    console.log('[MIDDLEWARE] /api/users/me -> user:', user?.email || 'null');
    console.log('[MIDDLEWARE] cookies received:', req.cookies.getAll().map(c => c.name));
  }

  if (!isPublicRoute(req.nextUrl.pathname) && !user) {
    const signInUrl = req.nextUrl.clone();
    signInUrl.pathname = '/sign-in';
    return NextResponse.redirect(signInUrl);
  }

  // Inject pathname into request headers so server components can read the current URL
  response.headers.set('x-pathname', req.nextUrl.pathname);

  // Apply Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, etc)
  const csp = generateCsp();
  if (csp) {
    response.headers.set('Content-Security-Policy', csp);
  }
  
  // Prevent clickjacking for non-embed routes
  if (!req.nextUrl.pathname.startsWith('/embed/')) {
    response.headers.set('X-Frame-Options', 'DENY');
  }
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Strict Transport Security (HSTS)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), interest-cohort=()');

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
