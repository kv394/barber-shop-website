import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { getShopPublicData } from '@/lib/shop-public-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
 try {
 const { shopId } = await params;
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


    const url = new URL(request.url);
    if (url.searchParams.get('bust')) {
        await cacheService.invalidate(`api_public_data_v2:${resolvedShopId}`).catch(() => {});
    }

    const cachedData = await getShopPublicData(shopId, baseUrl);

    if (!cachedData) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { allowedDomains: cachedAllowedDomains, ...responseData } = cachedData as any;

    // Validate domain
    if (requestDomain && cachedAllowedDomains) {
        const isAllowed = cachedAllowedDomains.some((domain: string) =>
            requestDomain === domain || requestDomain.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
            logger.warn(`Unauthorized access attempt to shop data from domain: ${requestDomain}`);
            return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
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
            }
        } catch(e) {}
    }

    return NextResponse.json(responseData, { headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    } });

 } catch (error: any) {
 logger.error('Error fetching public shop data:', error);
 return NextResponse.json({ error: 'Failed to fetch public data' }, { status: 500, headers: {
 'Access-Control-Allow-Origin': '*',
 } });
 }
}

export async function OPTIONS(request: Request) {
 const origin = request.headers.get('origin');
 return new NextResponse(null, {
 status: 204,
 headers: {
 'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
 'Access-Control-Allow-Methods': 'GET, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 },
 });
}
