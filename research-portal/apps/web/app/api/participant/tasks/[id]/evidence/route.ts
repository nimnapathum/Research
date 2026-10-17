import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { evidenceKinds, naturalEvidenceStatus, saveNaturalEvidence, type EvidenceKind } from '@/lib/natural-evidence';
import { hasValidOrigin } from '@/lib/same-origin';
import { taskAccess } from '@/lib/task-access';
import type { ParticipantDashboard, StudyTask } from '@/lib/types';

export const runtime = 'nodejs';

async function context(taskId: string): Promise<{ task: StudyTask; code: string } | NextResponse> {
  if (process.env.STUDY_PROTOCOL !== 'natural') return NextResponse.json({ error: 'Natural evidence route is disabled' }, { status: 404 });
  const token = (await cookies()).get('study_sid')?.value;
  if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const response = await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/participant/dashboard`, {
    headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (response.status === 401) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: 'Participant access unavailable' }, { status: 403 });
  const data = await response.json() as ParticipantDashboard;
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  const access = taskAccess(data, task);
  if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 403 });
  if (!data.user.participant_code) return NextResponse.json({ error: 'Participant code unavailable' }, { status: 403 });
  return { task, code: data.user.participant_code };
}

export async function GET(_request: NextRequest, route: { params: Promise<{ id: string }> }) {
  const result = await context((await route.params).id);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(await naturalEvidenceStatus(result.code, result.task.external_task_id),
    { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PUT(request: NextRequest, route: { params: Promise<{ id: string }> }) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const result = await context((await route.params).id);
  if (result instanceof NextResponse) return result;
  const kind = request.nextUrl.searchParams.get('kind') as EvidenceKind | null;
  if (!kind || !(kind in evidenceKinds)) return NextResponse.json({ error: 'Unsupported evidence kind' }, { status: 400 });
  if (kind === 'screen_recording') return NextResponse.json({ error: 'The researcher links Google Meet recordings separately' }, { status: 400 });
  if (!request.body) return NextResponse.json({ error: 'Choose a file to upload' }, { status: 400 });
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > evidenceKinds[kind]) {
    return NextResponse.json({ error: 'File exceeds evidence size limit' }, { status: 413 });
  }
  let filename: string = kind;
  try { filename = decodeURIComponent(request.headers.get('x-filename') || kind); }
  catch { return NextResponse.json({ error: 'Invalid filename' }, { status: 400 }); }
  try {
    const saved = await saveNaturalEvidence(result.code, result.task.external_task_id, kind, filename, request.body);
    return NextResponse.json(saved, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = (error as Error).message;
    return NextResponse.json({ error: message }, { status: message.includes('exceeds') ? 413 :
      message.includes('already received') || message.includes('already being') ? 409 : 400 });
  }
}
