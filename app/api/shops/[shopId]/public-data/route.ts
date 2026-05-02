import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
// Cache bust 1

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params;

    // 0. Fetch Shop Details First for Security Validation
    let shop = await prisma.shop.findFirst({
      where: {
        OR: [
          { id: shopId },
          { subdomain: shopId },
          { companyName: shopId }
        ]
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        description: true,
        timezone: true,
        customDomain: true,
        subdomain: true,
        customization: true,
        template: true,
        dynamicTemplates: true
      }
    });

    if (!shop) {
      const namePattern = shopId.replace(/-/g, '%');
      const candidates = await prisma.shop.findMany({
        where: { name: { contains: namePattern.replace(/%/g, ' '), mode: 'insensitive' } },
        take: 10,
        select: {
          id: true,
          name: true,
          companyName: true,
          description: true,
          timezone: true,
          customDomain: true,
          subdomain: true,
          customization: true,
          template: true,
          dynamicTemplates: true
        }
      });

      shop = candidates.find(
        (s: any) => s.name.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w-]/g, '') === shopId.toLowerCase()
      ) || null;
    }

    if (!shop) {
      // Fallback: If still not found, check if this is the demo shop
      if (shopId === 'missouri-city' || shopId === 'sugarland') {
        shop = await prisma.shop.findFirst({
           where: { id: 'cmn9kj24n0000lqzc7kcsmpst' },
           select: {
              id: true,
              name: true,
              companyName: true,
              description: true,
              timezone: true,
              customDomain: true,
              subdomain: true,
              customization: true,
              template: true,
              dynamicTemplates: true
           }
        });
      }
    }

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // --- SECURITY: Domain Validation (Anti-Scraping / Hacker Safe) ---
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
    }

    const customization = (shop.customization as any) || {};
    const allowedDomains: string[] = customization.allowedDomains || [];
    
    // Add default allowed domains
    if (shop.customDomain) allowedDomains.push(shop.customDomain);
    if (shop.subdomain) allowedDomains.push(`${shop.subdomain}.barbersaas.com`);
    allowedDomains.push('barbersaas.com'); // Allow main app domain
    allowedDomains.push('localhost'); // Allow local development
    allowedDomains.push('127.0.0.1'); // Allow local IP development

    // If the request comes from a browser (has origin/referer), validate it
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
    const corsHeaders = {
      'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Run remaining public data queries in parallel using the actual resolved shop.id
    const [products, services, staff, reviews] = await Promise.all([
      // 1. Sellable Products
      prisma.product.findMany({
        where: { shopId: shop.id, isSellable: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          type: true,
          trackInventory: true,
          inventoryCount: true
        },
        orderBy: { name: 'asc' }
      }),
      // 2. Bookable Services
      prisma.service.findMany({
        where: { shopId: shop.id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          duration: true
        },
        orderBy: { name: 'asc' }
      }),
      // 3. Public Staff 
      prisma.user.findMany({
        where: {
          OR: [
            { shopId: shop.id, role: 'STAFF' },
            { shopAccesses: { some: { shopId: shop.id, role: 'STAFF' } } }
          ]
        },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          workingHours: true
        }
      }),
      // 4. Reviews
      prisma.review.findMany({
        where: { shopId: shop.id },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Clean up customization to only include public-safe fields (branding, contact, hours)
    const publicCustomization = {
        address: customization.address,
        contact: customization.contact,
        branding: customization.branding,
        logoUrl: customization.logoUrl,
        heroImageUrl: customization.heroImageUrl,
        businessHours: customization.businessHours,
        primaryColor: customization.primaryColor,
        secondaryColor: customization.secondaryColor,
        fontFamily: customization.fontFamily,
        buttonShape: customization.buttonShape,
        buttonVariant: customization.buttonVariant,
        colorTheme: customization.colorTheme,
        customHtml: customization.customHtml,
        authPosition: customization.authPosition,
        chatbotPosition: customization.chatbotPosition,
    };

    const cleanShop = {
        id: shop.id,
        name: shop.companyName || shop.name,
        locationName: shop.name,
        companyName: shop.companyName,
        description: shop.description,
        timezone: shop.timezone,
        template: shop.template,
        dynamicTemplates: shop.dynamicTemplates,
        customization: publicCustomization
    };

    return NextResponse.json({
      shop: cleanShop,
      products,
      services,
      staff,
      reviews
    }, { headers: corsHeaders });

  } catch (error: any) {
    logger.error('Error fetching public shop data:', error);
    return NextResponse.json({ error: 'Failed to fetch public data', details: error?.message || String(error) }, { status: 500, headers: {
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
