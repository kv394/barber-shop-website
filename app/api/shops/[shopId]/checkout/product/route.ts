import { logger } from "@/lib/logger";
import { getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';
import stripe from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function isAllowedOrigin(origin: string, customDomain?: string | null): boolean {
  try {
    const host = new URL(origin).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.endsWith('.vercel.app')) return true;
    if (host === 'kutzapp.com' || host.endsWith('.kutzapp.com')) return true;
    if (customDomain && host === customDomain) return true;
    return false;
  } catch {
    return false;
  }
}

function getCorsHeaders(origin: string | null, customDomain?: string | null): Record<string, string> {
  const allowedOrigin = origin && isAllowedOrigin(origin, customDomain) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(allowedOrigin ? { 'Vary': 'Origin' } : {}),
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const origin = request.headers.get('origin');
  let corsHeaders = getCorsHeaders(origin);

  try {
    const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);

    const body = await request.json();
    const { productId, quantity, successUrl, cancelUrl } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'successUrl and cancelUrl are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitResult = await rateLimit(`checkout:${ip}`, 5, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: corsHeaders });
    }

    const shop = await tenantClient.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: corsHeaders });
    }

    corsHeaders = getCorsHeaders(origin, shop.customDomain);

    const isValidUrl = (urlStr: string) => {
      try {
        const url = new URL(urlStr);
        const host = url.hostname;
        if (host === 'localhost') return true;
        if (host.endsWith('.vercel.app')) return true;
        if (host === 'kutzapp.com' || host.endsWith('.kutzapp.com')) return true;
        if (shop.customDomain && host === shop.customDomain) return true;
        return false;
      } catch (e) {
        return false;
      }
    };

    if (!isValidUrl(successUrl) || !isValidUrl(cancelUrl)) {
      return NextResponse.json(
        { error: 'Invalid redirect URL domain' },
        { status: 400, headers: corsHeaders }
      );
    }

    const product = await tenantClient.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        isSellable: true,
        shopId: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!product.isSellable) {
      return NextResponse.json(
        { error: 'This product is not available for purchase' },
        { status: 400, headers: corsHeaders }
      );
    }

    const itemQuantity = Math.max(1, parseInt(quantity) || 1);
    const unitAmountCents = Math.round(product.price * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: itemQuantity,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmountCents,
            product_data: { name: product.name },
          },
        },
      ],
      metadata: {
        type: 'product_purchase',
        shopId: shopId,
        productId: product.id,
        quantity: String(itemQuantity),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json(
      { url: session.url, sessionId: session.id },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    logger.error('Error creating product checkout session:', error);
    const message = error?.message || 'Failed to create checkout session';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
