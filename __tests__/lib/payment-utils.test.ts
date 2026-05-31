import { calculateDepositAmount } from '@/lib/payment-utils';
import { describe, it, expect } from 'vitest';

describe('calculateDepositAmount', () => {
  it('should return 0 if no rule is provided', () => {
    expect(calculateDepositAmount(100)).toBe(0);
  });

  it('should return full amount for FULL type', () => {
    expect(calculateDepositAmount(100, { type: 'FULL' })).toBe(100);
  });

  it('should return fixed amount for FIXED type', () => {
    expect(calculateDepositAmount(100, { type: 'FIXED', value: 25 })).toBe(25);
  });

  it('should return 0 for FIXED type if no value provided', () => {
    expect(calculateDepositAmount(100, { type: 'FIXED' })).toBe(0);
  });

  it('should return percentage amount for PERCENTAGE type', () => {
    expect(calculateDepositAmount(200, { type: 'PERCENTAGE', value: 15 })).toBe(30);
  });

  it('should return 0 for PERCENTAGE type if no value provided', () => {
    expect(calculateDepositAmount(200, { type: 'PERCENTAGE' })).toBe(0);
  });

  it('should return 0 for unknown type', () => {
    // @ts-expect-error testing invalid type
    expect(calculateDepositAmount(200, { type: 'UNKNOWN', value: 50 })).toBe(0);
  });
});
