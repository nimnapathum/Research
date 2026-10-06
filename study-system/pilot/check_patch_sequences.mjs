// Check cumulative kept-proposal combinations. This is an engineering check,
// not evidence that people will accept or securely repair the code.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { assignmentFor } from '../app/assignment.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'study-sequences-'));
const cases = new Map();
for (let ordinal = 0; ordinal < 64; ordinal++) {
  const assignment = assignmentFor(`P${String(ordinal + 1).padStart(3, '0')}`, ordinal, 'sequence-check');
  for (const task of assignment.tasks) {
    const key = `${task.project_id}:${task.checkpoint_order.join(',')}:${JSON.stringify(task.candidate_status_by_checkpoint)}`;
    cases.set(key, task);
  }
}
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}\n${result.stdout}${result.stderr}`);
}
let checked = 0;
for (const task of cases.values()) {
  const name = task.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  const workspace = join(temp, randomUUID());
  cpSync(join(root, 'projects', name), workspace, { recursive: true });
  for (const checkpoint of task.checkpoint_order) {
    const folder = join(root, 'stimuli', name, `${task.project_id}-${checkpoint}`);
    const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8'));
    const candidate = manifest.candidates.find((item) =>
      item.expected_target_status === task.candidate_status_by_checkpoint[checkpoint]);
    assert.ok(candidate, `Missing candidate: ${task.project_id}-${checkpoint}`);
    const patch = join(folder, candidate.patch);
    run('git', ['apply', '--check', patch], workspace);
    run('git', ['apply', patch], workspace);
  }
  run(process.execPath, ['--test', 'test/baseline.test.mjs', 'test/q1.functional.test.mjs',
    'test/q2.functional.test.mjs', 'test/f1.functional.test.mjs', 'test/f2.functional.test.mjs'], workspace);
  checked++;
}
console.log(`Cumulative patch sequence check passed: ${checked} unique project/order/status cases. Artifacts: ${temp}`);
