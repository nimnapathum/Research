import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { starterPackage } from '@/lib/starter-package';
import { taskAccess } from '@/lib/task-access';
import type { ParticipantDashboard } from '@/lib/types';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('study_sid')?.value;
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const response = await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/participant/dashboard`, {
    headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (response.status === 401) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  if (response.status === 403) return NextResponse.json({ error: 'Participant access required' }, { status: 403 });
  if (!response.ok) return NextResponse.json({ error: 'Task service unavailable' }, { status: 502 });
  const data = await response.json() as ParticipantDashboard;
  const { id } = await context.params;
  const task = data.tasks.find((item) => item.id === id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  const access = taskAccess(data, task);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  try {
    const bytes = await starterPackage(task);
    return new NextResponse(new Uint8Array(bytes), { headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${task.external_task_id}-starter.zip"`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Task materials are unavailable on this server. Contact the researcher.' }, { status: 503 });
    }
    throw error;
  }
}
