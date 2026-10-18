import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { analysisRoot, codedTables, featureCSVHash, naturalPhases,
  type NaturalCodedReport, type NaturalPhase } from '@/lib/natural-coded-report';
import { buildNaturalFeatureCSV } from '@/lib/natural-feature-export';
import { naturalTaskSummaries, type AssignedTask, type NaturalAssessment,
  type StudyParticipant, type StudyResponse } from '@/lib/natural-analysis';
import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';

export const runtime = 'nodejs';
const runFile = promisify(execFile);
const script = [process.cwd(), resolve(/* turbopackIgnore: true */ process.cwd(), '..'),
  resolve(/* turbopackIgnore: true */ process.cwd(), '../../..')]
  .map((root) => resolve(/* turbopackIgnore: true */ root, 'study-system/analysis/natural_behavior_report.py'))
  .find((path) => existsSync(path));

export async function POST(request: Request) {
  if (process.env.STUDY_PROTOCOL !== 'natural') return NextResponse.json({ error: 'Unavailable' }, { status: 404 });
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') return NextResponse.json({ error: 'Researcher access required' }, { status: 403 });
  if (!script) return NextResponse.json({ error: 'Analysis script unavailable on this host' }, { status: 503 });
  if (Number(request.headers.get('content-length')) > 9 * 1024 * 1024) {
    return NextResponse.json({ error: 'Coding-table upload exceeds 9 MB' }, { status: 413 });
  }
  const form = await request.formData();
  const phase = form.get('phase');
  if (typeof phase !== 'string' || !naturalPhases.includes(phase as NaturalPhase)) {
    return NextResponse.json({ error: 'Choose one valid study phase' }, { status: 400 });
  }
  const uploads = await Promise.all(codedTables.map(async (name) => {
    const file = form.get(name);
    if (!(file instanceof File) || file.size < 1 || file.size > 2 * 1024 * 1024) return null;
    return [name, await file.text()] as const;
  }));
  const tables = uploads.filter((item): item is readonly [typeof codedTables[number], string] => item !== null);
  if (tables.length !== codedTables.length || tables.reduce((size, item) => size + item[1].length, 0) > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Provide five CSV coding files, each under 2 MB and under 8 MB combined' }, { status: 400 });
  }
  const [data, responses, assessments] = await Promise.all([
    serverApi<{ participants: StudyParticipant[]; tasks: AssignedTask[] }>('researcher/participants'),
    serverApi<StudyResponse[]>('researcher/responses'),
    serverApi<NaturalAssessment[]>('researcher/natural-assessments')
  ]);
  const people = data.participants.filter((person) => (person.study_phase || 'legacy') === phase);
  const ids = new Set(people.map((person) => person.id));
  const tasks = await naturalTaskSummaries(people, data.tasks.filter((task) => ids.has(task.participant_id)), responses);
  if (!tasks.length) return NextResponse.json({ error: 'This phase has no assigned tasks' }, { status: 400 });
  const features = buildNaturalFeatureCSV(tasks, assessments);
  const base = analysisRoot(phase as NaturalPhase);
  await mkdir(base, { recursive: true, mode: 0o700 });
  const staging = await mkdtemp(join(base, '.staging-'));
  try {
    await Promise.all([...tables.map(([name, value]) => writeFile(join(staging, `${name}.csv`), value,
      { flag: 'wx', mode: 0o600 })), writeFile(join(staging, 'features.csv'), features, { flag: 'wx', mode: 0o600 })]);
    const { stdout } = await runFile('python3', [script, staging, '--phase', phase,
      '--markdown-output', join(staging, 'report.md')], {
      encoding: 'utf8', timeout: 30000, maxBuffer: 3 * 1024 * 1024
    });
    const report = JSON.parse(stdout) as NaturalCodedReport;
    if (report.study_phase !== phase || report.source_sha256?.features !== featureCSVHash(features)) {
      throw new Error('Report does not match current portal features');
    }
    await writeFile(join(staging, 'report.json'), JSON.stringify(report, null, 2) + '\n',
      { flag: 'wx', mode: 0o600 });
    const run = `run-${new Date().toISOString().replace(/[-:.]/g, '')}-${randomUUID()}`;
    await rename(staging, join(base, run));
    return NextResponse.json({ run, phase, participants: report.coverage.participants,
      tasks: report.coverage.tasks, warnings: report.warnings.length });
  } catch (error) {
    await rm(staging, { recursive: true, force: true }).catch(() => {});
    const message = error instanceof Error ? error.message : 'Coding-table analysis failed';
    return NextResponse.json({ error: message.slice(0, 600) }, { status: 400 });
  }
}
