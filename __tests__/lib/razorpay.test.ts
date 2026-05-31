import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

const { mockCreateOrder, mockRefundPayment } = vi.hoisted(() => ({
  mockCreateOrder: vi.fn(),
  mockRefundPayment: vi.fn(),
}));

vi.mock('razorpay', () => {
  const RazorpayMock = vi.fn().mockImplementation(function(this: any) {
    this.orders = {
      create: mockCreateOrder,
    };
    this.payments = {
      refund: mockRefundPayment,
    };
  });
  return {
    default: RazorpayMock,
  };
});

import {
  getRazorpayClient,
  createRazorpayOrder,
  verifyRazorpaySignature,
  refundRazorpayPayment
} from '@/lib/razorpay';
import Razorpay from 'razorpay';

describe('razorpay.ts helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRazorpayClient', () => {
    it('creates a new Razorpay client', () => {
      getRazorpayClient('key1', 'sec1');
      expect(Razorpay).toHaveBeenCalledWith({
        key_id: 'key1',
        key_secret: 'sec1',
      });
    });
  });

  describe('createRazorpayOrder', () => {
    it('creates an order', async () => {
      mockCreateOrder.mockResolvedValue({ id: 'order_123' });

      const result = await createRazorpayOrder({
        amount: 50000,
        receipt: 'rec_1',
        keyId: 'k',
        keySecret: 's',
      });

      expect(mockCreateOrder).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'INR',
        receipt: 'rec_1',
        notes: {},
      });
      expect(result).toEqual({ id: 'order_123' });
    });
  });

  describe('verifyRazorpaySignature', () => {
    it('returns true for a valid signature', () => {
      const orderId = 'order_123';
      const paymentId = 'pay_123';
      const secret = 'secret';

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      expect(verifyRazorpaySignature({
        orderId, paymentId, signature: validSignature, keySecret: secret
      })).toBe(true);
    });

    it('returns false for an invalid signature', () => {
      expect(verifyRazorpaySignature({
        orderId: '1', paymentId: '2', signature: 'invalid', keySecret: 'secret'
      })).toBe(false);
    });
  });

  describe('refundRazorpayPayment', () => {
    it('refunds full amount if no amount provided', async () => {
      mockRefundPayment.mockResolvedValue({ id: 'rfnd_1' });
      await refundRazorpayPayment({ paymentId: 'pay_1', keyId: 'k', keySecret: 's' });
      expect(mockRefundPayment).toHaveBeenCalledWith('pay_1');
    });

    it('refunds partial amount if amount provided', async () => {
      mockRefundPayment.mockResolvedValue({ id: 'rfnd_1' });
      await refundRazorpayPayment({ paymentId: 'pay_1', amount: 100, keyId: 'k', keySecret: 's' });
      expect(mockRefundPayment).toHaveBeenCalledWith('pay_1', { amount: 100 });
    });
  });
});
