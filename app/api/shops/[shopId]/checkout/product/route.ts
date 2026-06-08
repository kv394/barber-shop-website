import { logger } from "@/lib/logger";
import { getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
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

    // Look up the product and verify it exists and is sellable
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

    // Create a Stripe Checkout Session following the createBoothRenterCheckoutSession pattern
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
  } catch (error) {
    logger.error('Error creating product checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500, headers: corsHeaders }
    );
  }
}
