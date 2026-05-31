import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockCreatePaymentIntent,
  mockCapturePaymentIntent,
  mockCancelPaymentIntent,
  mockCreateRefund,
  mockCreateSetupIntent,
  mockCreateConnectionToken,
  mockCreateCheckoutSession,
} = vi.hoisted(() => ({
  mockCreatePaymentIntent: vi.fn(),
  mockCapturePaymentIntent: vi.fn(),
  mockCancelPaymentIntent: vi.fn(),
  mockCreateRefund: vi.fn(),
  mockCreateSetupIntent: vi.fn(),
  mockCreateConnectionToken: vi.fn(),
  mockCreateCheckoutSession: vi.fn(),
}));

vi.mock('stripe', () => {
  const StripeMock = vi.fn();
  StripeMock.prototype.paymentIntents = {
    create: mockCreatePaymentIntent,
    capture: mockCapturePaymentIntent,
    cancel: mockCancelPaymentIntent,
  };
  StripeMock.prototype.refunds = {
    create: mockCreateRefund,
  };
  StripeMock.prototype.setupIntents = {
    create: mockCreateSetupIntent,
  };
  StripeMock.prototype.terminal = {
    connectionTokens: {
      create: mockCreateConnectionToken,
    },
  };
  StripeMock.prototype.checkout = {
    sessions: {
      create: mockCreateCheckoutSession,
    },
  };
  return {
    default: StripeMock,
  };
});

vi.mock('@/lib/platform-settings', () => ({
  getPlatformSettings: vi.fn().mockResolvedValue({ platformFeePercent: 5 }),
}));

import {
  createDepositPaymentIntent,
  captureDeposit,
  releaseDeposit,
  refundStripePayment,
  createGiftCardPaymentIntent,
  createSetupIntent,
  chargeNoShowFee,
  createTerminalConnectionToken,
  createBoothRenterCheckoutSession
} from '@/lib/stripe';

describe('stripe.ts helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDepositPaymentIntent', () => {
    it('creates a payment intent with manual capture', async () => {
      mockCreatePaymentIntent.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret_123',
      });

      const result = await createDepositPaymentIntent(50, { bookingId: '1' }, 'acct_123', 'usd');

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        capture_method: 'manual',
        metadata: { bookingId: '1' },
      }, { stripeAccount: 'acct_123' });

      expect(result).toEqual({
        clientSecret: 'secret_123',
        paymentIntentId: 'pi_123',
      });
    });
  });

  describe('captureDeposit', () => {
    it('captures a payment intent', async () => {
      mockCapturePaymentIntent.mockResolvedValue({ id: 'pi_123', status: 'succeeded' });

      await captureDeposit('pi_123', 'acct_123');

      expect(mockCapturePaymentIntent).toHaveBeenCalledWith('pi_123', { stripeAccount: 'acct_123' });
    });
  });

  describe('releaseDeposit', () => {
    it('cancels a payment intent', async () => {
      mockCancelPaymentIntent.mockResolvedValue({ id: 'pi_123', status: 'canceled' });

      await releaseDeposit('pi_123', 'acct_123');

      expect(mockCancelPaymentIntent).toHaveBeenCalledWith('pi_123', { stripeAccount: 'acct_123' });
    });
  });

  describe('refundStripePayment', () => {
    it('creates a refund for full amount', async () => {
      mockCreateRefund.mockResolvedValue({ id: 're_123' });

      await refundStripePayment('pi_123', undefined, 'acct_123');

      expect(mockCreateRefund).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
      }, { stripeAccount: 'acct_123' });
    });

    it('creates a refund for partial amount', async () => {
      mockCreateRefund.mockResolvedValue({ id: 're_123' });

      await refundStripePayment('pi_123', 25, 'acct_123');

      expect(mockCreateRefund).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 2500,
      }, { stripeAccount: 'acct_123' });
    });
  });

  describe('createGiftCardPaymentIntent', () => {
    it('creates payment intent with automatic payment methods', async () => {
      mockCreatePaymentIntent.mockResolvedValue({ id: 'pi_123', client_secret: 'sec_123' });

      await createGiftCardPaymentIntent(100, { gc: 'true' });

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        metadata: { gc: 'true' },
        automatic_payment_methods: { enabled: true },
      }, undefined);
    });
  });

  describe('createSetupIntent', () => {
    it('creates setup intent', async () => {
      mockCreateSetupIntent.mockResolvedValue({ id: 'seti_123', client_secret: 'sec_123' });

      await createSetupIntent('cus_123', { reason: 'noshow' });

      expect(mockCreateSetupIntent).toHaveBeenCalledWith({
        customer: 'cus_123',
        payment_method_types: ['card'],
        metadata: { reason: 'noshow' },
      }, undefined);
    });
  });

  describe('chargeNoShowFee', () => {
    it('charges a saved payment method', async () => {
      mockCreatePaymentIntent.mockResolvedValue({ id: 'pi_123' });

      await chargeNoShowFee('cus_123', 'pm_123', 40, { bookingId: '1' });

      expect(mockCreatePaymentIntent).toHaveBeenCalledWith({
        amount: 4000,
        currency: 'usd',
        customer: 'cus_123',
        payment_method: 'pm_123',
        off_session: true,
        confirm: true,
        metadata: { bookingId: '1' },
      }, undefined);
    });
  });

  describe('createTerminalConnectionToken', () => {
    it('creates terminal token', async () => {
      mockCreateConnectionToken.mockResolvedValue({ secret: 'term_123' });

      const token = await createTerminalConnectionToken();
      expect(token).toBe('term_123');
      expect(mockCreateConnectionToken).toHaveBeenCalledWith({}, undefined);
    });
  });

  describe('createBoothRenterCheckoutSession', () => {
    it('creates checkout session and applies platform fee', async () => {
      mockCreateCheckoutSession.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/123' });

      const result = await createBoothRenterCheckoutSession({
        renterStripeAccountId: 'acct_123',
        serviceId: 'srv_1',
        serviceName: 'Haircut',
        amount: 100,
        currency: 'usd',
        renterId: 'r_1',
        shopId: 's_1',
        slotStart: '2023-10-10T10:00:00Z',
        slotEnd: '2023-10-10T11:00:00Z',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: 10000,
            product_data: { name: 'Haircut' },
          },
        }],
        customer_email: 'john@example.com',
        payment_intent_data: { application_fee_amount: 500 }, // 5% of 10000
        metadata: {
          type: 'booth_renter_booking',
          renterId: 'r_1',
          shopId: 's_1',
          serviceId: 'srv_1',
          slotStart: '2023-10-10T10:00:00Z',
          slotEnd: '2023-10-10T11:00:00Z',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '',
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      }, { stripeAccount: 'acct_123' });

      expect(result).toEqual({ url: 'https://checkout.stripe.com/123', sessionId: 'cs_123' });
    });
  });
});
