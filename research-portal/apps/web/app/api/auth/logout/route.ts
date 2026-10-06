import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { hasValidOrigin } from '@/lib/same-origin';

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const jar = await cookies();
  const token = jar.get('study_sid')?.value;
  if (token) await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/auth/logout`, {
    method: 'POST', headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
  }).catch(() => undefined);
  jar.delete('study_sid');
  return NextResponse.json({ ok: true });
}
