import { describe, it, expect } from 'vitest';
import { toShopTzDayBounds, formatTimeWithTz } from '@/lib/timezone';

describe('timezone utilities', () => {
  it('computes correct day boundaries for a given timezone', () => {
    // Testing Eastern Time day boundaries for Jan 1, 2025
    const bounds = toShopTzDayBounds('2025-01-01', 'America/New_York');
    
    // In UTC, Midnight Jan 1 EST is 5:00 AM UTC
    expect(bounds.startOfDay.toISOString()).toBe('2025-01-01T05:00:00.000Z');
    
    // End of day is 23:59:59.999 EST, which is 04:59:59.999 UTC the next day
    expect(bounds.endOfDay.toISOString()).toBe('2025-01-02T04:59:59.999Z');
  });

  it('formats time string correctly for a timezone', () => {
    // 2 PM UTC on Jan 1 = 9 AM EST
    const date = new Date('2025-01-01T14:00:00.000Z');
    const formatted = formatTimeWithTz(date, 'America/New_York');
    
    // Check if it outputs exactly "9:00 AM" or similar 12-hour format depending on Intl 
    // Usually it returns something like "9:00 AM"
    expect(formatted).toMatch(/9:00\sAM/i);
  });
});
