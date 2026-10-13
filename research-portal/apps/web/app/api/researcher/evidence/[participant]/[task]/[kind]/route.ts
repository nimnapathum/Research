import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { evidenceKinds, naturalEvidenceFile, type EvidenceKind } from '@/lib/natural-evidence';
import type { StudyTask, StudyUser } from '@/lib/types';

export const runtime = 'nodejs';

type ResearcherAssignments = { participants: { id: string; participant_code: string }[];
  tasks: (StudyTask & { participant_id: string })[] };

export async function GET(_request: Request, route: { params: Promise<{ participant: string; task: string; kind: string }> }) {
  if (process.env.STUDY_PROTOCOL !== 'natural') return NextResponse.json({ error: 'Unavailable' }, { status: 404 });
  const token = (await cookies()).get('study_sid')?.value;
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const api = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';
  const headers = { authorization: `Bearer ${token}` };
  const who = await fetch(`${api}/auth/me`, { headers, cache: 'no-store' });
  if (who.status === 401) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  if (!who.ok) return NextResponse.json({ error: 'Researcher access unavailable' }, { status: 503 });
  const user = await who.json() as StudyUser;
  if (user.role !== 'researcher') return NextResponse.json({ error: 'Researcher access required' }, { status: 403 });

  const { participant, task, kind } = await route.params;
  if (!/^P\d{8}$/.test(participant) || !/^P\d{8}-T[12]$/.test(task) ||
      !task.startsWith(`${participant}-`) || !(kind in evidenceKinds)) {
    return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
  }
  const assignments = await fetch(`${api}/researcher/participants`, { headers, cache: 'no-store' });
  if (!assignments.ok) return NextResponse.json({ error: 'Assignment lookup unavailable' }, { status: 503 });
  const data = await assignments.json() as ResearcherAssignments;
  const person = data.participants.find((item) => item.participant_code === participant);
  if (!person || !data.tasks.some((item) => item.participant_id === person.id && item.external_task_id === task)) {
    return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
  }
  const saved = await naturalEvidenceFile(participant, task, kind as EvidenceKind);
  if (!saved) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
  const filename = saved.receipt.filename.replace(/[^a-zA-Z0-9._-]/g, '_') || `${task}-${kind}`;
  const stream = Readable.toWeb(createReadStream(saved.path)) as ReadableStream<Uint8Array>;
  return new Response(stream, { headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(saved.receipt.size_bytes),
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  } });
}
