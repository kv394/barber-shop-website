/**
 * Recurrence expansion logic for recurring appointments (I1).
 * Supports simple RRULE-like patterns: WEEKLY, BIWEEKLY, MONTHLY.
 */

export interface RecurrenceConfig {
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  count: number; // number of occurrences (including the first)
}

/**
 * Generate future appointment dates from a base date and recurrence config.
 * Returns an array of start dates (including the original).
 */
export function expandRecurrence(
  baseStart: Date,
  config: RecurrenceConfig,
): Date[] {
  const dates: Date[] = [new Date(baseStart)];

  for (let i = 1; i < config.count; i++) {
    const next = new Date(baseStart);

    switch (config.frequency) {
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * i);
        break;
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 14 * i);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + i);
        break;
    }

    dates.push(next);
  }

  return dates;
}

/**
 * Convert a RecurrenceConfig to an iCal RRULE string.
 */
export function toRRule(config: RecurrenceConfig): string {
  const interval = config.frequency === 'BIWEEKLY' ? 2 : 1;
  const freq = config.frequency === 'MONTHLY' ? 'MONTHLY' : 'WEEKLY';
  return `FREQ=${freq};INTERVAL=${interval};COUNT=${config.count}`;
}

/**
 * Parse a simple RRULE string back into a RecurrenceConfig.
 */
export function parseRRule(rrule: string): RecurrenceConfig | null {
  try {
    const parts: Record<string, string> = {};
    rrule.split(';').forEach(part => {
      const [key, value] = part.split('=');
      parts[key] = value;
    });

    const freq = parts['FREQ'];
    const interval = parseInt(parts['INTERVAL'] || '1');
    const count = parseInt(parts['COUNT'] || '4');

    let frequency: RecurrenceConfig['frequency'] = 'WEEKLY';
    if (freq === 'MONTHLY') frequency = 'MONTHLY';
    else if (freq === 'WEEKLY' && interval === 2) frequency = 'BIWEEKLY';

    return { frequency, count };
  } catch {
    return null;
  }
}

