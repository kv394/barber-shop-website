import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil' as any,
});

export default stripe;

/**
 * Create a PaymentIntent for a no-show deposit (C5)
 */
export async function createDepositPaymentIntent(
  amount: number,
  metadata: Record<string, string>,
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    capture_method: 'manual', // authorize only, capture on no-show
    metadata,
  });
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Capture a previously authorized deposit (no-show) (C5)
 */
export async function captureDeposit(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Release/cancel a previously authorized deposit (C5)
 */
export async function releaseDeposit(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Refund a completed payment (I4)
 */
export async function refundStripePayment(
  paymentIntentId: string,
  amount?: number,
) {
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };
  if (amount) {
    params.amount = Math.round(amount * 100);
  }
  return stripe.refunds.create(params);
}

/**
 * Create a simple charge for gift card purchase (I5)
 */
export async function createGiftCardPaymentIntent(
  amount: number,
  metadata: Record<string, string>,
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

