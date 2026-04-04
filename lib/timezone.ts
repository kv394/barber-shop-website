/**
 * Timezone formatting utilities for displaying shop-local times.
 *
 * All dates are stored in UTC. These helpers format them for display
 * using the shop's IANA timezone (e.g. "America/New_York").
 */

/** Common IANA timezones for the settings dropdown */
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York',    label: 'Eastern Time (ET)' },
  { value: 'America/Chicago',     label: 'Central Time (CT)' },
  { value: 'America/Denver',      label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage',   label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu',    label: 'Hawaii Time (HT)' },
  { value: 'America/Phoenix',     label: 'Arizona (no DST)' },
  { value: 'America/Toronto',     label: 'Eastern Canada' },
  { value: 'America/Vancouver',   label: 'Pacific Canada' },
  { value: 'America/Edmonton',    label: 'Mountain Canada' },
  { value: 'America/Winnipeg',    label: 'Central Canada' },
  { value: 'Europe/London',       label: 'London (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'Central Europe (CET)' },
  { value: 'Europe/Berlin',       label: 'Berlin (CET)' },
  { value: 'Asia/Dubai',          label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata',        label: 'India (IST)' },
  { value: 'Asia/Singapore',      label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo',          label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney',    label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland',    label: 'New Zealand (NZST)' },
] as const;

/**
 * Format a UTC date in the shop's local timezone.
 *
 * @param date       - A Date object or ISO string (UTC)
 * @param timezone   - IANA timezone string (e.g. "America/New_York")
 * @param options    - Intl.DateTimeFormat options override
 * @returns Formatted string in the shop's timezone
 */
export function formatInShopTz(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaults: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  return new Intl.DateTimeFormat('en-US', { ...defaults, ...options }).format(d);
}

/**
 * Format a date as a readable date string in the shop's timezone.
 * e.g. "Monday, April 1, 2026"
 */
export function formatDateInShopTz(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaults: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat('en-US', { ...defaults, ...options }).format(d);
}

/**
 * Format a date as a short date (e.g. "Apr 1, 2026")
 */
export function formatShortDateInShopTz(
  date: Date | string,
  timezone: string,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format both date and time together.
 * e.g. "Apr 1, 2026 at 2:00 PM"
 */
export function formatDateTimeInShopTz(
  date: Date | string,
  timezone: string,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} at ${timePart}`;
}

/**
 * Get the current date string (YYYY-MM-DD) in a given timezone.
 */
export function getTodayInShopTz(timezone: string): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

/**
 * Convert a YYYY-MM-DD date string + IANA timezone into UTC Date boundaries.
 * Returns { startOfDay, endOfDay } in UTC corresponding to midnight→midnight in that timezone.
 *
 * This version is simplified and more robust against DST changes.
 */
export function toShopTzDayBounds(
  dateStr: string,
  timezone: string,
): { startOfDay: Date; endOfDay: Date } {
  // Create a date in the target timezone by specifying it in the string
  const startOfDay = new Date(`${dateStr}T00:00:00.000[${timezone}]`);

  // The end of the day is just 24 hours after the start of the day
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  return { startOfDay, endOfDay };
}
