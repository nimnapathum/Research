import 'server-only';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { naturalEvidenceFile } from './natural-evidence';
import type { TaskSummary } from './natural-analysis';

export type CodeMetrics = {
  task_id: string; initial_snapshot_sha256: string; final_snapshot_sha256: string;
  snapshot_count: number; source_change_snapshots: number; source_files_changed: number;
  source_lines_added: number; source_lines_removed: number; source_paths: string[];
};
export type CodeMetricsResult = { metrics: CodeMetrics | null; error: string | null };

const script = [process.cwd(), resolve(/* turbopackIgnore: true */ process.cwd(), '..'),
  resolve(/* turbopackIgnore: true */ process.cwd(), '../../..')]
  .map((root) => resolve(/* turbopackIgnore: true */ root, 'study-system/analysis/inspect_natural_code.py'))
  .find((path) => existsSync(path));
const runFile = promisify(execFile);

function valid(value: unknown, taskId: string, finalHash: string): value is CodeMetrics {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return row.task_id === taskId && row.final_snapshot_sha256 === finalHash &&
    /^sha256:[a-f0-9]{64}$/.test(String(row.initial_snapshot_sha256)) &&
    ['snapshot_count', 'source_change_snapshots', 'source_files_changed',
      'source_lines_added', 'source_lines_removed'].every((key) =>
      Number.isSafeInteger(row[key]) && Number(row[key]) >= 0) &&
    Array.isArray(row.source_paths) && row.source_paths.every((path) => typeof path === 'string');
}

export async function naturalCodeMetrics(task: TaskSummary): Promise<CodeMetricsResult> {
  if (!task.submitted || !task.final_hash) return { metrics: null, error: null };
  const [capture, final] = await Promise.all([
    naturalEvidenceFile(task.participant_code, task.task_id, 'capture_zip'),
    naturalEvidenceFile(task.participant_code, task.task_id, 'final_zip')
  ]);
  if (!capture || !final) return { metrics: null, error: 'Code history or final ZIP missing' };
  if (!script) return { metrics: null, error: 'Read-only code inspector unavailable' };
  const key = `v1:${capture.receipt.sha256}:${final.receipt.sha256}:${task.final_hash}`;
  const cache = join(dirname(capture.path), 'code_metrics.cache.json');
  try {
    const stored = JSON.parse(await readFile(cache, 'utf8')) as { key?: string; metrics?: unknown };
    if (stored.key === key && valid(stored.metrics, task.task_id, task.final_hash)) {
      return { metrics: stored.metrics, error: null };
    }
  } catch {}
  try {
    const run = await runFile('python3', [script, capture.path, final.path, task.task_id, '--summary'], {
      encoding: 'utf8', timeout: 20000, maxBuffer: 128 * 1024
    });
    const metrics: unknown = JSON.parse(run.stdout);
    if (!valid(metrics, task.task_id, task.final_hash)) throw new Error('Invalid code summary');
    const temporary = `${cache}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify({ key, metrics }), { flag: 'wx', mode: 0o600 });
      await rename(temporary, cache);
    } catch { await unlink(temporary).catch(() => {}); } // Cache failure does not discard the computed result.
    return { metrics, error: null };
  } catch { return { metrics: null, error: 'Code ZIP summary failed; inspect the task evidence' }; }
}

export async function naturalCodeMetricsForTasks(tasks: TaskSummary[]) {
  const results = new Map<string, CodeMetricsResult>();
  // Keep subprocess memory bounded on the small VM; cached tasks avoid Python entirely.
  for (let index = 0; index < tasks.length; index += 2) {
    const batch = await Promise.all(tasks.slice(index, index + 2).map(async (task) =>
      [task.task_id, await naturalCodeMetrics(task)] as const));
    for (const [taskId, result] of batch) results.set(taskId, result);
  }
  return results;
}
