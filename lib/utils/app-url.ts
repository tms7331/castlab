/**
 * Get the app URL dynamically
 * In production, uses NEXT_PUBLIC_APP_URL or VERCEL_URL
 * In development, uses window.location.origin
 */
export function getAppUrl(): string {
  // If we have a configured app URL, use it
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In browser context, use window.location.origin for development
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // For server-side rendering in production (Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback for local development server-side
  return 'http://localhost:3000';
}