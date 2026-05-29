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
  stripeAccountId?: string | null,
  currency: string = 'usd'
) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: currency.toLowerCase(),
    capture_method: 'manual', // authorize only, capture on no-show
    metadata,
  }, options);
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Capture a previously authorized deposit (no-show) (C5)
 */
export async function captureDeposit(paymentIntentId: string, stripeAccountId?: string | null) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  return stripe.paymentIntents.capture(paymentIntentId, options);
}

/**
 * Release/cancel a previously authorized deposit (C5)
 */
export async function releaseDeposit(paymentIntentId: string, stripeAccountId?: string | null) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  return stripe.paymentIntents.cancel(paymentIntentId, options);
}

/**
 * Refund a completed payment (I4)
 */
export async function refundStripePayment(
  paymentIntentId: string,
  amount?: number,
  stripeAccountId?: string | null,
) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };
  if (amount) {
    params.amount = Math.round(amount * 100);
  }
  return stripe.refunds.create(params, options);
}

/**
 * Create a simple charge for gift card purchase (I5)
 */
export async function createGiftCardPaymentIntent(
  amount: number,
  metadata: Record<string, string>,
  stripeAccountId?: string | null,
  currency: string = 'usd'
) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  }, options);
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Create a Stripe SetupIntent to save a card on file for No-Show protection.
 */
export async function createSetupIntent(customerId: string, metadata: Record<string, string>, stripeAccountId?: string | null) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    metadata,
  }, options);
  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
}

/**
 * Charge a saved card on file for a No-Show fee.
 */
export async function chargeNoShowFee(customerId: string, paymentMethodId: string, amount: number, metadata: Record<string, string>, stripeAccountId?: string | null, currency: string = 'usd') {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    metadata,
  }, options);
  return paymentIntent;
}

/**
 * Create a Stripe Terminal ConnectionToken for BBPOS / Tap to Pay.
 */
export async function createTerminalConnectionToken(stripeAccountId?: string | null) {
  const options = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
  const connectionToken = await stripe.terminal.connectionTokens.create({}, options);
  return connectionToken.secret;
}

/**
 * Create a Stripe Checkout Session for a booth renter booking (Phase 2).
 * Money goes directly to the renter's Stripe Connect account.
 * Platform optionally takes application_fee_amount (set PLATFORM_FEE_PERCENT env var, e.g. "5").
 */
export async function createBoothRenterCheckoutSession({
  renterStripeAccountId,
  serviceId,
  serviceName,
  amount,
  currency,
  renterId,
  shopId,
  slotStart,
  slotEnd,
  clientName,
  clientEmail,
  clientPhone,
  successUrl,
  cancelUrl,
}: {
  renterStripeAccountId: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  currency: string;
  renterId: string;
  shopId: string;
  slotStart: string;
  slotEnd: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const amountCents = Math.round(amount * 100);

  const { getPlatformSettings } = await import('@/lib/platform-settings');
  const settings = await getPlatformSettings();
  const feePct = (settings.platformFeePercent || 0) / 100;
  
  const applicationFeeAmount = feePct > 0 ? Math.round(amountCents * feePct) : undefined;

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: amountCents,
            product_data: { name: serviceName },
          },
        },
      ],
      customer_email: clientEmail,
      ...(applicationFeeAmount ? { payment_intent_data: { application_fee_amount: applicationFeeAmount } } : {}),
      metadata: {
        type: 'booth_renter_booking',
        renterId,
        shopId,
        serviceId,
        slotStart,
        slotEnd,
        clientName,
        clientEmail,
        clientPhone: clientPhone || '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    { stripeAccount: renterStripeAccountId }
  );

  return { url: session.url, sessionId: session.id };
}
