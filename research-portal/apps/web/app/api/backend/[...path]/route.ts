import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const method = request.method;
  const origin = request.headers.get('origin');
  if (method !== 'GET' && origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const token = (await cookies()).get('study_sid')?.value;
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const { path } = await context.params;
  const destination = new URL(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/${path.join('/')}`);
  destination.search = request.nextUrl.search;
  const content = method === 'GET' ? undefined : await request.text();
  if (content && Buffer.byteLength(content, 'utf8') > 6 * 1024 * 1024) {
    return NextResponse.json({ error: 'Upload too large' }, { status: 413 });
  }
  const upstream = await fetch(destination, {
    method, headers: { authorization: `Bearer ${token}`,
      ...(content ? { 'content-type': 'application/json' } : {}) },
    body: content, cache: 'no-store'
  });
  const response = new NextResponse(await upstream.text(), {
    status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store', ...(path.join('/') === 'researcher/export'
        ? { 'content-disposition': 'attachment; filename="research-portal-export.json"' } : {}) }
  });
  return response;
}
export const GET = forward;
export const POST = forward;
export const PATCH = forward;
