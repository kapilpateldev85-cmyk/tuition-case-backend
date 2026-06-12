/**
 * Resolves whether a browser Origin header is allowed for CORS.
 *
 * Supports:
 * - Exact matches from FRONTEND_URL (comma-separated)
 * - Vercel preview deployments: https://tuition-case-frontend*.vercel.app
 * - Local dev: http://localhost:3000, http://localhost:3001
 */
export function isCorsOriginAllowed(
  origin: string,
  configuredOrigins: string[],
): boolean {
  const normalized = origin.replace(/\/$/, '');

  const allowed = configuredOrigins
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (allowed.includes(normalized)) {
    return true;
  }

  // Vercel production + branch/preview deployments for this project
  if (
    /^https:\/\/tuition-case-frontend[\w-]*\.vercel\.app$/i.test(normalized)
  ) {
    return true;
  }

  // Local development
  if (
    normalized === 'http://localhost:3000' ||
    normalized === 'http://localhost:3001'
  ) {
    return true;
  }

  return false;
}
