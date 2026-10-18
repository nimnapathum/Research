import 'server-only';
import { readFile } from 'node:fs/promises';
import { naturalEvidenceFile, naturalEvidenceStatus } from './natural-evidence';
import type { StudyTask } from './types';

export type StudyParticipant = { id: string; participant_code: string; study_phase?: string };
export type AssignedTask = StudyTask & { participant_id: string };
export type Recording = { id: string; participant_code: string; drive_url: string; label: string; notes: string; created_at: string };
export type StudyResponse = { id: string; participant_code: string; study_phase?: string; title: string;
  stage: string; external_task_id: string | null; answers: Record<string, unknown>; submitted_at: string };
export type NaturalAssessment = { id: string; task_id: string; participant_code: string; weakness_class: 'sql' | 'path';
  final_snapshot_sha256: string; review_data: { reviewerCode: string; security: string; functionality: string;
    inferredCondition: boolean }[]; resolved_security: string; resolved_functionality: string;
  resolution_note: string; created_at: string };
export type TaskSummary = { participant_code: string; phase: string; task_id: string; order: number;
  project: string; condition: string; submitted: boolean; uploaded: number; evidence_ready: boolean;
  issues: string[]; warnings: string[]; snapshot_count: number | null; capture_clean: boolean | null;
  agent_records: number | null; agent_status: string | null; final_hash: string | null; rating_hash: string | null;
  rating_linked: boolean; sql_probability: number | null; path_probability: number | null; after_task: boolean };

export const targetClasses = ['sql', 'path'] as const;
export const studyConditions = ['acceleration', 'exploration'] as const;
export type TargetClass = typeof targetClasses[number];
export type StudyCondition = typeof studyConditions[number];

// Every assigned feature remains in the denominator, including absent reviews and missing code.
export function featureCells(tasks: TaskSummary[], assessments: NaturalAssessment[]) {
  const records = new Map(reviewedFeatures(tasks, assessments)
    .map((item) => [`${item.task.task_id}/${item.record.weakness_class}`, item] as const));
  return tasks.flatMap((task) => targetClasses.map((weakness) => {
    const item = records.get(`${task.task_id}/${weakness}`);
    return { task, weakness, item, status: item?.record.resolved_security || 'pending',
      functionality: item?.record.resolved_functionality || 'pending',
      functional_secure: item?.record.resolved_security === 'target_secure' &&
        item.record.resolved_functionality === 'pass' };
  }));
}

export function pairedVulnerability(tasks: TaskSummary[], assessments: NaturalAssessment[]) {
  const cells = featureCells(tasks, assessments);
  const byPerson = new Map<string, typeof cells>();
  for (const cell of cells) byPerson.set(cell.task.participant_code,
    [...(byPerson.get(cell.task.participant_code) || []), cell]);
  const differences: number[] = [];
  for (const items of byPerson.values()) {
    if (items.length !== 4 || items.some((item) => !['target_secure', 'vulnerable'].includes(item.status)) ||
        new Set(items.map((item) => `${item.task.condition}/${item.weakness}`)).size !== 4) continue;
    const count = (condition: StudyCondition) => items.filter((item) =>
      item.task.condition === condition && item.status === 'vulnerable').length;
    differences.push(count('acceleration') - count('exploration'));
  }
  return pairedSummary(differences, 20261014);
}

function pairedSummary(differences: number[], startingSeed: number) {
  if (!differences.length) return null;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  // A resampled interval from one or two people gives misleading apparent precision.
  if (differences.length < 3) return { participants: differences.length,
    mean_difference: mean(differences), lower_95: null, upper_95: null };
  let seed = startingSeed;
  const draws = Array.from({ length: 10000 }, () => mean(Array.from({ length: differences.length }, () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return differences[(seed >>> 0) % differences.length];
  }))).sort((left, right) => left - right);
  return { participants: differences.length, mean_difference: mean(differences),
    lower_95: draws[Math.floor(draws.length * 0.025)], upper_95: draws[Math.floor(draws.length * 0.975)] };
}

export function reviewedFeatures(tasks: TaskSummary[], assessments: NaturalAssessment[]) {
  const byTask = new Map(tasks.map((task) => [task.task_id, task]));
  return assessments.flatMap((record) => {
    const task = byTask.get(record.task_id);
    if (!task?.submitted || task.final_hash !== record.final_snapshot_sha256) return [];
    const probability = record.weakness_class === 'sql' ? task.sql_probability : task.path_probability;
    const assessable = ['target_secure', 'vulnerable'].includes(record.resolved_security);
    const brier = assessable && probability !== null
      ? (probability / 100 - Number(record.resolved_security === 'target_secure')) ** 2 : null;
    return [{ task, record, probability, brier }];
  });
}

export function pairedBrier(tasks: TaskSummary[], assessments: NaturalAssessment[]) {
  const differences = pairedBrierPoints(tasks, assessments).map((point) =>
    point.acceleration - point.exploration);
  return pairedSummary(differences, 20261013);
}

export function pairedBrierPoints(tasks: TaskSummary[], assessments: NaturalAssessment[]) {
  const scored = reviewedFeatures(tasks, assessments).filter((item) => item.brier !== null);
  const people = new Map<string, Map<string, number>>();
  for (const item of scored) {
    const key = `${item.task.condition}/${item.record.weakness_class}`;
    const cells = people.get(item.task.participant_code) || new Map<string, number>();
    cells.set(key, item.brier!);
    people.set(item.task.participant_code, cells);
  }
  return [...people.entries()].flatMap(([participant, cells]) => {
    const aSql = cells.get('acceleration/sql'); const aPath = cells.get('acceleration/path');
    const eSql = cells.get('exploration/sql'); const ePath = cells.get('exploration/path');
    return aSql === undefined || aPath === undefined || eSql === undefined || ePath === undefined
      ? [] : [{ participant, acceleration: (aSql + aPath) / 2, exploration: (eSql + ePath) / 2 }];
  });
}

async function dataFor(code: string, taskId: string, kind: 'rating_json' | 'capture_health' | 'final_manifest') {
  const file = await naturalEvidenceFile(code, taskId, kind);
  if (!file) return null;
  try { return JSON.parse(await readFile(file.path, 'utf8')) as Record<string, unknown>; }
  catch { return null; }
}
function percent(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100 ? Number(value) : null;
}

export async function naturalTaskSummaries(participants: StudyParticipant[], tasks: AssignedTask[],
  responses: StudyResponse[]): Promise<TaskSummary[]> {
  const people = new Map(participants.map((person) => [person.id, person]));
  const after = new Set(responses.filter((row) => row.stage === 'after_task' && row.external_task_id)
    .map((row) => `${row.participant_code}/${row.external_task_id}`));
  const eligible = tasks.filter((task) => {
    const person = people.get(task.participant_id);
    return person && /^P\d{8}$/.test(person.participant_code) &&
      task.external_task_id === `${person.participant_code}-T${task.task_order}`;
  });
  const summaries: TaskSummary[] = [];
  // Bound concurrent filesystem reads on the small hosted VM.
  for (let offset = 0; offset < eligible.length; offset += 8) {
    const batch = await Promise.all(eligible.slice(offset, offset + 8).map(async (task) => {
      const person = people.get(task.participant_id)!;
      const code = person.participant_code;
      const [status, rating, health, manifest] = await Promise.all([
        naturalEvidenceStatus(code, task.external_task_id), dataFor(code, task.external_task_id, 'rating_json'),
        dataFor(code, task.external_task_id, 'capture_health'), dataFor(code, task.external_task_id, 'final_manifest')
      ]);
      const count = health?.snapshot_count;
      const finalHash = manifest?.workspace === task.external_task_id &&
        /^sha256:[a-f0-9]{64}$/.test(String(manifest.snapshot_sha256)) ? String(manifest.snapshot_sha256) : null;
      const ratingLinked = Boolean(status.rating_ready && finalHash &&
        rating?.final_snapshot_sha256 === finalHash && rating?.participant_task_id === task.external_task_id);
      return { participant_code: code, phase: person.study_phase || 'legacy', task_id: task.external_task_id,
        order: task.task_order, project: task.project_id, condition: task.condition,
        submitted: task.status === 'submitted', uploaded: 6 - status.missing.length,
        evidence_ready: status.ready, issues: status.issues, warnings: status.warnings,
        snapshot_count: Number.isInteger(count) && Number(count) >= 0 ? Number(count) : null,
        capture_clean: health ? health.status === 'stopped' && Array.isArray(health.errors) && health.errors.length === 0 : null,
        agent_records: typeof status.agent_capture?.transcript_records === 'number'
          ? status.agent_capture.transcript_records : null,
        agent_status: typeof status.agent_capture?.status === 'string' ? status.agent_capture.status : null,
        final_hash: finalHash,
        rating_hash: /^sha256:[a-f0-9]{64}$/.test(String(rating?.final_snapshot_sha256))
          ? String(rating?.final_snapshot_sha256) : null,
        rating_linked: ratingLinked,
        sql_probability: ratingLinked ? percent(rating?.sql_probability_pct) : null,
        path_probability: ratingLinked ? percent(rating?.path_probability_pct) : null,
        after_task: after.has(`${code}/${task.external_task_id}`) } satisfies TaskSummary;
    }));
    summaries.push(...batch);
  }
  return summaries.sort((left, right) => left.participant_code.localeCompare(right.participant_code) || left.order - right.order);
}
