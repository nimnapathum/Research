import type { NextRequest } from 'next/server';

export function hasValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.host === host && parsed.protocol === `${protocol}:` &&
      parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch { return false; }
}
