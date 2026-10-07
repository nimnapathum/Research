import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { listResearchDocs, readResearchDoc } from '@/lib/research-docs';
import type { StudyUser } from '@/lib/types';

export async function GET(request: NextRequest) {
  const token = (await cookies()).get('study_sid')?.value;
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const auth = await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/auth/me`, {
    headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (auth.status === 401) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  if (!auth.ok) return NextResponse.json({ error: 'Authorization unavailable' }, { status: 502 });
  const user = await auth.json() as StudyUser;
  if (user.role !== 'researcher') return NextResponse.json({ error: 'Researcher access required' }, { status: 403 });

  const path = request.nextUrl.searchParams.get('doc');
  if (!path) return NextResponse.json({ error: 'Document path required' }, { status: 400 });
  const docs = await listResearchDocs();
  if (!docs.some((doc) => doc.path === path)) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  try {
    const source = await readResearchDoc(path, docs);
    if (source === null) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ source }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    throw error;
  }
}
