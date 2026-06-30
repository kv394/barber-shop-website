import slugifyLib from 'slugify';

/**
 * Generates a URL‑friendly slug from a string.
 * - Converts to lower case
 * - Replaces spaces with hyphens
 * - Removes characters that are not alphanumeric, hyphen or underscore
 * - Trims to a maximum length of 50 characters
 */
export default function slugify(text: string): string {
  if (!text) return '';
  const slug = slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
  // Limit length to avoid excessively long URLs
  return slug.slice(0, 50);
}
