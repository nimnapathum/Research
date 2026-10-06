import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { hasValidOrigin } from '@/lib/same-origin';

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const body = await request.json();
  const upstream = await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store'
  });
  const result = await upstream.json();
  if (!upstream.ok) return NextResponse.json({ error: result.message || 'Sign-in failed' }, { status: upstream.status });
  (await cookies()).set('study_sid', result.token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true',
    path: '/', maxAge: 60 * 60 * 24 * 7
  });
  return NextResponse.json({ user: result.user });
}
