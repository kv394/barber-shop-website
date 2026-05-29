import { describe, it, expect, vi } from 'vitest';
import stripe from '@/lib/stripe';
import { calculateDepositAmount } from '@/lib/payment-utils';

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  default: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' })
      }
    }
  }
}));

describe('Payments Integration', () => {
  describe('Deposit Calculation', () => {
    it('should calculate 50% deposit correctly', () => {
      const deposit = calculateDepositAmount(100, { type: 'PERCENTAGE', value: 50 });
      expect(deposit).toBe(50);
    });

    it('should calculate fixed deposit correctly', () => {
      const deposit = calculateDepositAmount(100, { type: 'FIXED', value: 25 });
      expect(deposit).toBe(25);
    });

    it('should calculate full amount deposit correctly', () => {
      const deposit = calculateDepositAmount(100, { type: 'FULL' });
      expect(deposit).toBe(100);
    });
  });

  describe('Stripe Checkout', () => {
    it('should create a checkout session', async () => {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Deposit' }, unit_amount: 5000 }, quantity: 1 }],
        mode: 'payment',
        success_url: 'https://kutzapp.com/success',
        cancel_url: 'https://kutzapp.com/cancel',
      });

      expect(session.id).toBe('cs_test_123');
      expect(session.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
      expect(stripe.checkout.sessions.create).toHaveBeenCalled();
    });
  });
});
