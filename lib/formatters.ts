/**
 * Formats a number as a currency string using Intl.NumberFormat.
 * Pass the shop's currency and locale for correct formatting.
 */
export function formatCurrency(
  value: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: currencyCode === 'INR' ? 0 : 2,
    }).format(value);
  } catch (error) {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${value.toLocaleString()}`;
  }
}

/**
 * Returns the currency symbol for a given currency code.
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
  };
  return symbols[currencyCode] || currencyCode;
}

/**
 * Quick price formatter — returns symbol + value (e.g. "$25.00" or "₹500").
 * Use this in JSX where you need a simple inline price display.
 */
export function fmtPrice(value: number, currencyCode: string = 'USD'): string {
  const symbol = getCurrencySymbol(currencyCode);
  if (currencyCode === 'INR') {
    return `${symbol}${Math.round(value).toLocaleString('en-IN')}`;
  }
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Formats a phone number for the Indian market, ensuring +91 is applied if no country code exists.
 */
export function formatPhoneNumberIN(phone: string): string {
  if (!phone) return phone;
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it's a 10-digit number without country code, assume India (+91)
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return `+91${cleaned}`;
  }
  
  return cleaned;
}

