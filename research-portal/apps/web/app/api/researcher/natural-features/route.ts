import { NextResponse } from 'next/server';
import { serverApi } from '@/lib/server-api';
import { naturalTaskSummaries, type AssignedTask, type NaturalAssessment,
  type StudyParticipant, type StudyResponse } from '@/lib/natural-analysis';
import { buildNaturalFeatureCSV } from '@/lib/natural-feature-export';
import type { StudyUser } from '@/lib/types';

export const runtime = 'nodejs';
const phases = ['rehearsal', 'pilot', 'main', 'legacy'];

export async function GET(request: Request) {
  if (process.env.STUDY_PROTOCOL !== 'natural') return NextResponse.json({ error: 'Unavailable' }, { status: 404 });
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') return NextResponse.json({ error: 'Researcher access required' }, { status: 403 });
  const phase = new URL(request.url).searchParams.get('phase');
  if (!phase || !phases.includes(phase)) return NextResponse.json({ error: 'Choose one study phase' }, { status: 400 });
  const [data, responses, assessments] = await Promise.all([
    serverApi<{ participants: StudyParticipant[]; tasks: AssignedTask[] }>('researcher/participants'),
    serverApi<StudyResponse[]>('researcher/responses'),
    serverApi<NaturalAssessment[]>('researcher/natural-assessments')
  ]);
  const people = data.participants.filter((person) => (person.study_phase || 'legacy') === phase);
  const ids = new Set(people.map((person) => person.id));
  const tasks = await naturalTaskSummaries(people, data.tasks.filter((task) => ids.has(task.participant_id)), responses);
  return new Response(buildNaturalFeatureCSV(tasks, assessments), { headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="natural-features-${phase}.csv"`,
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
  } });
}
