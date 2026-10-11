import 'server-only';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ParticipantDashboard, StudyTask } from './types';

const root = resolve(/* turbopackIgnore: true */ process.env.STUDY_MATERIALS_ROOT ||
  join(process.env.RESEARCH_DOCS_ROOT || resolve(process.cwd(), '../../..'), 'study-system'));
const script = join(root, 'app/portal-bridge.mjs');

export type CheckpointStatus = { connected: boolean; last_seen_at: string | null;
  agent_capture_seen: boolean; pointer_capture_seen: boolean;
  task_url: string; next_checkpoint: string | null; final_submitted: boolean;
  completed_checkpoints: string[]; skipped_checkpoints: string[] };

export function checkpointAvailable() {
  return process.env.CHECKPOINT_BRIDGE_ENABLED === '1' && existsSync(script);
}

export function checkpointInput(data: ParticipantDashboard, code: string, preAnswers: Record<string, unknown>, task?: StudyTask) {
  return { participant_code: code, pre_answers: preAnswers,
    tasks: data.tasks.map((item) => ({ task_id: item.external_task_id, project_id: item.project_id,
      condition: item.condition, task_order: item.task_order, checkpoint_order: item.checkpoint_order })),
    ...(task ? { task_id: task.external_task_id } : {}) };
}

export async function portalPreAnswers(data: ParticipantDashboard, token: string): Promise<Record<string, unknown>> {
  const form = data.questionnaires.find((item) => item.stage === 'pre_task' && item.response_id);
  if (!form) throw new Error('Complete the pre-task questionnaire first');
  const response = await fetch(`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000'}/participant/questionnaires/${form.id}`, {
    headers: { authorization: `Bearer ${token}` }, cache: 'no-store'
  });
  if (!response.ok) throw new Error('Could not load the saved pre-task response');
  const detail = await response.json() as { responses: { task_id: string | null; answers: Record<string, unknown> }[] };
  const answers = detail.responses.find((item) => item.task_id === null)?.answers;
  if (!answers) throw new Error('Saved pre-task response is missing');
  return answers;
}

export function checkpointCall(input: Record<string, unknown>): Buffer {
  if (!checkpointAvailable()) throw new Error('Recorded-task service is not configured');
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(input), encoding: null, maxBuffer: 20 * 1024 * 1024, timeout: 15_000,
    env: { ...process.env, STUDY_PUBLIC_URL: process.env.STUDY_PUBLIC_URL || 'http://127.0.0.1:4175' }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const message = result.stderr.toString('utf8').match(/BRIDGE_ERROR:([^\n]+)/)?.[1];
    throw new Error(message || 'Recorded-task service failed');
  }
  return result.stdout;
}

export function checkpointJson<T>(input: Record<string, unknown>): T {
  return JSON.parse(checkpointCall(input).toString('utf8')) as T;
}
