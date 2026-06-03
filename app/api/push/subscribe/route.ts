import { NextRequest, NextResponse } from 'next/server';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface SubscribeRequestBody {
  subscription: PushSubscriptionJSON;
  shopId: string | null;
}

/**
 * POST /api/push/subscribe
 *
 * Accepts a push subscription from the client and stores it.
 * Currently logs the subscription; full database persistence will be
 * wired once the PushSubscription model is added to the schema.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeRequestBody;

    const { subscription, shopId } = body;

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: 'Invalid push subscription payload.' },
        { status: 400 }
      );
    }

    // TODO: Persist to database once PushSubscription model is available.
    // For now, log the subscription for verification during development.
    console.log('[Push Subscribe]', {
      endpoint: subscription.endpoint,
      shopId,
      keys: {
        p256dh: subscription.keys.p256dh.slice(0, 12) + '…',
        auth: subscription.keys.auth.slice(0, 8) + '…',
      },
    });

    return NextResponse.json(
      { success: true, message: 'Push subscription registered.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Push Subscribe Error]', error);
    return NextResponse.json(
      { error: 'Failed to process push subscription.' },
      { status: 500 }
    );
  }
}
