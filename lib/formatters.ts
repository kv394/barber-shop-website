/**
 * Formats a number as a currency string.
 * Defaults to INR (Indian Rupees) and en-IN locale to cater to the Indian market.
 */
export function formatCurrency(
  value: number,
  currencyCode: string = 'INR',
  locale: string = 'en-IN'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0, // In India, decimals are rarely shown unless strictly necessary
    }).format(value);
  } catch (error) {
    // Fallback if the environment does not support the locale/currency
    return `${currencyCode === 'INR' ? '₹' : '$'}${value.toLocaleString()}`;
  }
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
