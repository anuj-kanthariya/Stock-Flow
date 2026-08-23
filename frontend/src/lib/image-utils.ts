/**
 * Normalizes an image URL (such as an avatar or company logo).
 * 
 * Rules:
 * - Complete HTTPS/HTTP URLs (e.g., Supabase, Google) are returned as-is.
 * - Legacy `/uploads/...` paths are returned with the backend API URL prepended ONLY in development.
 *   In production, these paths return `undefined` to gracefully force the UI to fallback to initials.
 * - Null or empty strings return `undefined`.
 */
export const getNormalizedImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  // Complete HTTPS or HTTP URL (Supabase, Google, etc.)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Legacy local filesystem path
  if (url.startsWith('/uploads/')) {
    // Check if running in development (localhost)
    if (import.meta.env.DEV) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // Ensure we don't double-slash (e.g., http://localhost:8000//uploads/...)
      return `${baseUrl.replace(/\/$/, '')}${url}`;
    }
    // In production, we cannot reliably load /uploads/ because the filesystem is ephemeral.
    // Return undefined to trigger the initials fallback in components.
    return undefined;
  }

  // Fallback for any other unknown relative formats (treat as legacy)
  if (url.startsWith('/')) {
    if (import.meta.env.DEV) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      return `${baseUrl.replace(/\/$/, '')}${url}`;
    }
    return undefined;
  }

  return undefined;
};
