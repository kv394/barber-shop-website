import sys

with open('app/api/shops/[shopId]/public-data/route.ts', 'r') as f:
    content = f.read()

# 1. Add import
content = content.replace("import { logger } from '@/lib/logger';", "import { logger } from '@/lib/logger';\nimport { cacheService } from '@/lib/cache';")

# 2. Extract origin and referer handling before the cache block
start_str = """    const tenantClient = await getTenantClient(shopId);

 // 0. Fetch Shop Details First for Security Validation"""

new_start = """    // --- MOVED SECURITY INIT OUTSIDE CACHE ---
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const requestHost = request.headers.get('host') || 'localhost:3000';
    const protocol = requestHost.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${requestHost}`;

    let requestDomain = null;
    try {
        if (origin && origin !== 'null') {
            requestDomain = new URL(origin).hostname;
        } else if (referer && referer !== 'null') {
            requestDomain = new URL(referer).hostname;
        }
    } catch (e) {
        requestDomain = null;
    }

    const cachedData = await cacheService.getOrSet(`api_public_data:${shopId}`, async () => {
        const tenantClient = await getTenantClient(shopId);

 // 0. Fetch Shop Details First for Security Validation"""

content = content.replace(start_str, new_start)

# 3. Replace the return statement with the cache return
return_str = """ return NextResponse.json({
 shop: cleanShop,
 products: formattedProducts,
 services: formattedServices,
 staff: formattedStaff,
 reviews
 }, { headers: corsHeaders });"""

new_return = """ return {
 shop: cleanShop,
 products: formattedProducts,
 services: formattedServices,
 staff: formattedStaff,
 reviews,
 allowedDomains
 };
    }, 900); // 15 minutes cache

    if (!cachedData) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { allowedDomains: cachedAllowedDomains, ...responseData } = cachedData;

    // Validate domain
    if (requestDomain && cachedAllowedDomains) {
        const isAllowed = cachedAllowedDomains.some((domain: string) =>
            requestDomain === domain || requestDomain.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
            logger.warn(`Allowing unauthorized access to shop data from domain for demo: ${requestDomain}`);
        }
    }

    // CORS Headers for allowed requests
    const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Set dynamic CORS origin if valid
    if (origin && cachedAllowedDomains) {
        try {
            const originHost = new URL(origin).hostname;
            const isOriginAllowed = cachedAllowedDomains.some((domain: string) => originHost === domain || originHost.endsWith(`.${domain}`));
            if (isOriginAllowed) {
                corsHeaders['Access-Control-Allow-Origin'] = origin;
            } else {
                corsHeaders['Access-Control-Allow-Origin'] = origin;
            }
        } catch(e) {}
    }

    return NextResponse.json(responseData, { headers: corsHeaders });"""

content = content.replace(return_str, new_return)

# 4. Remove the old security and origin stuff inside the cache body
remove_1 = """ // --- SECURITY: Domain Validation (Anti-Scraping / Hacker Safe) ---
 const origin = request.headers.get('origin');
 const referer = request.headers.get('referer');
 
 let requestDomain = null;
 try {
 if (origin && origin !== 'null') {
 requestDomain = new URL(origin).hostname;
 } else if (referer && referer !== 'null') {
 requestDomain = new URL(referer).hostname;
 }
 } catch (e) {
 // Ignore URL parsing errors
 requestDomain = null;
 }"""

content = content.replace(remove_1, " // --- SECURITY AND DOMAIN MOVED OUTSIDE ---")

remove_2 = """ // If the request comes from a browser (has origin/referer), validate it
 // We strictly block requests from unknown origins to prevent data theft and unauthorized widget embedding
 if (requestDomain) {
 const isAllowed = allowedDomains.some(domain =>
 requestDomain === domain || requestDomain.endsWith(`.${domain}`)
 );

 if (!isAllowed) {
 // TEMPORARY: Allow all domains for demo/local testing purposes.
 // We log a warning instead of blocking to ensure the demo works seamlessly.
 logger.warn(`Allowing unauthorized access to shop data from domain for demo: ${requestDomain}`);
 }
 }

 // CORS Headers for allowed requests
 const corsHeaders: Record<string, string> = {
 'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
 'Access-Control-Allow-Methods': 'GET, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 };

 // Set dynamic CORS origin if valid
 if (origin) {
 try {
 const originHost = new URL(origin).hostname;
 const isOriginAllowed = allowedDomains.some(domain => originHost === domain || originHost.endsWith(`.${domain}`));
 if (isOriginAllowed) {
 corsHeaders['Access-Control-Allow-Origin'] = origin;
 } else {
 // For demo purposes, we will allow it, but in production we'd restrict it
 corsHeaders['Access-Control-Allow-Origin'] = origin;
 }
 } catch(e) {}
 }"""

content = content.replace(remove_2, " // CORS and origin logic moved outside cache")

remove_3 = """ const requestHost = request.headers.get('host') || 'localhost:3000';
 const protocol = requestHost.includes('localhost') ? 'http' : 'https';
 const baseUrl = `${protocol}://${requestHost}`;"""

content = content.replace(remove_3, "")

# Ensure we remove the early return since we are inside a map
early_return = " return NextResponse.json({ error: 'Shop not found' }, { status: 404 });"
content = content.replace(early_return, " return null;")

with open('app/api/shops/[shopId]/public-data/route.ts', 'w') as f:
    f.write(content)

