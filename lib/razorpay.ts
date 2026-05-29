import Razorpay from 'razorpay';
import crypto from 'crypto';

export function getRazorpayClient(keyId: string, keySecret: string) {
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates a Razorpay order for online payment (e.g. deposit or checkout).
 */
export async function createRazorpayOrder({
  amount,
  currency = 'INR',
  receipt,
  keyId,
  keySecret,
  notes = {},
}: {
  amount: number; // in minor units (e.g., paise for INR)
  currency?: string;
  receipt: string;
  keyId: string;
  keySecret: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayClient(keyId, keySecret);

  const options = {
    amount,
    currency: currency.toUpperCase(),
    receipt,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verifies the signature of the Razorpay payment callback to ensure authenticity.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  keySecret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Refunds a Razorpay payment.
 */
export async function refundRazorpayPayment({
  paymentId,
  amount,
  keyId,
  keySecret,
}: {
  paymentId: string;
  amount?: number; // Optional, full refund if not provided
  keyId: string;
  keySecret: string;
}) {
  const razorpay = getRazorpayClient(keyId, keySecret);
  
  if (amount) {
    return (razorpay.payments as any).refund(paymentId, { amount });
  }
  return (razorpay.payments as any).refund(paymentId);
}
