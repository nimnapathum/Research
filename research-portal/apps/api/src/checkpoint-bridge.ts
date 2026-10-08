import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

export function callCheckpointBridge(input: Record<string, unknown>): Record<string, unknown> | null {
  if (process.env.CHECKPOINT_BRIDGE_ENABLED !== '1') return null;
  const root = resolve(process.env.STUDY_MATERIALS_ROOT || join(process.cwd(), '../../../study-system'));
  const script = join(root, 'app/portal-bridge.mjs');
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify(input), encoding: 'utf8', timeout: 15_000, maxBuffer: 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const message = result.stderr.match(/BRIDGE_ERROR:([^\n]+)/)?.[1];
    throw new Error(message || 'Recorded-task form service failed');
  }
  return JSON.parse(result.stdout) as Record<string, unknown>;
}
