/**
 * Shared image URL normalization utilities.
 *
 * Google Drive share links cannot be used directly as image sources.
 * This module converts them to the `lh3.googleusercontent.com` proxy
 * format that serves the actual image bytes.
 */

/**
 * Converts Google Drive share/view URLs to a direct image URL
 * via Google's `lh3.googleusercontent.com` proxy.
 *
 * Handles three common Drive URL formats:
 * - `drive.google.com/file/d/{id}/...`
 * - `drive.google.com/open?id={id}`
 * - `drive.google.com/uc?...id={id}`
 *
 * Non-Drive URLs are returned unchanged. `null` input returns `null`.
 */
export function normalizeGoogleDriveUrl(url: string | null): string | null {
  if (!url) return null;

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;

  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;

  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;

  return url;
}

/**
 * Normalizes a Google Drive URL and also converts relative paths
 * (e.g. `/uploads/photo.jpg`) to absolute URLs using the provided base.
 *
 * Useful on the server side where the response must contain fully-qualified URLs.
 */
export function formatImageUrl(url: string | null, baseUrl: string): string | null {
  const normalized = normalizeGoogleDriveUrl(url);
  if (normalized && normalized.startsWith('/')) {
    return `${baseUrl}${normalized}`;
  }
  return normalized;
}
