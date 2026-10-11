import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const data = mkdtempSync(join(tmpdir(), 'checkpoint-bridge-test-'));
const script = resolve('../study-system/app/portal-bridge.mjs');
const environment = { ...process.env, STUDY_DATA_DIR: data, STUDY_PUBLIC_URL: 'http://127.0.0.1:4175' };
const tasks = [
  { task_id: 'P901-T1', project_id: 'A', condition: 'acceleration', task_order: 1,
    checkpoint_order: ['Q1', 'Q2', 'F1', 'F2'] },
  { task_id: 'P901-T2', project_id: 'B', condition: 'exploration', task_order: 2,
    checkpoint_order: ['F2', 'F1', 'Q2', 'Q1'] }
];
const pre = { role: 'final-year CS/IT student', paid_years: 0, js_familiarity: 2,
  sql_familiarity: 2, files_familiarity: 2, security_training: 'none',
  agent_frequency: 'never', antigravity_use: 'never', review_frequency: 3,
  sql_baseline: 'unsure', path_baseline: 'unsure' };
function call(command, extra = {}) {
  const result = spawnSync(process.execPath, [script], { env: environment, encoding: null,
    input: JSON.stringify({ command, participant_code: 'P901', tasks, pre_answers: pre, ...extra }),
    maxBuffer: 20 * 1024 * 1024 });
  return result;
}
function zipNames(bytes) {
  const names = [];
  for (let offset = 0; offset < bytes.length - 46; offset++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) continue;
    const length = bytes.readUInt16LE(offset + 28);
    const extra = bytes.readUInt16LE(offset + 30);
    const comment = bytes.readUInt16LE(offset + 32);
    names.push(bytes.subarray(offset + 46, offset + 46 + length).toString());
    offset += 45 + length + extra + comment;
  }
  return names;
}
function extractStoredZip(bytes, folder) {
  let offset = 0;
  while (offset + 30 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString();
    assert.ok(!name.startsWith('/') && !name.includes('..'), 'safe package path');
    const start = offset + 30 + nameLength + extraLength;
    const path = join(folder, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes.subarray(start, start + size));
    offset = start + size;
  }
}
try {
  const first = call('package', { task_id: 'P901-T1' });
  assert.equal(first.status, 0, first.stderr.toString());
  const names = zipNames(first.stdout);
  for (const file of ['study/setup.mjs', 'study/client.mjs', 'study/upload-transcript.mjs', 'study/pointer_recorder.py', 'study/POINTER_REQUIREMENTS.txt', 'study/CAPTURE_CONFIG.json',
    '.study-capture/hook.mjs', 'study/Q1_TASK.md']) assert.ok(names.includes(file), file);
  assert.ok(names.every((name) => !name.includes('stimuli/') && !name.includes('oracle')));
  const workspace = join(data, 'extracted-task');
  extractStoredZip(first.stdout, workspace);
  const setup = spawnSync(process.execPath, [join(workspace, 'study/setup.mjs')],
    { cwd: workspace, encoding: 'utf8' });
  assert.equal(setup.status, 0, setup.stderr);
  const hooks = JSON.parse(readFileSync(join(workspace, '.agents/hooks.json'), 'utf8'));
  assert.ok(hooks['study-observer'].PreInvocation && hooks['study-observer'].PostInvocation);
  const status = call('status', { task_id: 'P901-T1' });
  assert.equal(status.status, 0, status.stderr.toString());
  const info = JSON.parse(status.stdout.toString());
  assert.equal(info.connected, false);
  assert.equal(info.pointer_capture_seen, false);
  assert.equal(info.next_checkpoint, 'Q1');
  assert.match(info.task_url, /\/task\?token=[a-f0-9]{48}&task_id=P901-T1/);
  const db = new DatabaseSync(join(data, 'study.sqlite'));
  db.prepare('INSERT INTO events(event_id,task_id,sequence,event_json) VALUES(?,?,?,?)')
    .run('P901-T1-test-hook', 'P901-T1', 1, JSON.stringify({ source: 'antigravity-hook' }));
  const withCapture = call('status', { task_id: 'P901-T1' });
  assert.equal(JSON.parse(withCapture.stdout.toString()).agent_capture_seen, true);
  const secondEarly = call('package', { task_id: 'P901-T2' });
  assert.notEqual(secondEarly.status, 0);
  const mismatch = call('status', { task_id: 'P901-T1', tasks: [tasks[1], tasks[0]] });
  assert.notEqual(mismatch.status, 0);
  db.prepare('UPDATE tasks SET final_sha256 = ? WHERE task_id = ?').run('sha256:synthetic-test', 'P901-T1');
  db.close();
  const after = { known_next_step: 1, sought_options: 1, task_familiarity: 1, task_difficulty: 1,
    time_pressure: 1, agent_reliance: 1, mode_example: 'Synthetic test' };
  const mirrored = call('mirror-form', { kind: 'after_task', task_id: 'P901-T1', answers: after });
  assert.equal(mirrored.status, 0, mirrored.stderr.toString());
  const second = call('package', { task_id: 'P901-T2' });
  assert.equal(second.status, 0, second.stderr.toString());
  assert.ok(zipNames(second.stdout).includes('study/setup.mjs'));
  const reserved = call('reserve', { participant_code: 'P902' });
  assert.equal(reserved.status, 0, reserved.stderr.toString());
  const reservedTasks = JSON.parse(reserved.stdout.toString()).tasks;
  assert.equal(reservedTasks.length, 2);
  assert.equal(new Set(reservedTasks.map((task) => task.project_id)).size, 2);
  assert.equal(new Set(reservedTasks.map((task) => task.condition)).size, 2);
  assert.ok(reservedTasks.every((task) => !('candidate_status_by_checkpoint' in task)));
  const matchingReserved = call('status', { participant_code: 'P902', tasks: reservedTasks,
    task_id: 'P902-T1' });
  assert.equal(matchingReserved.status, 0, matchingReserved.stderr.toString());
  const wrongReserved = call('status', { participant_code: 'P902',
    tasks: [{ ...reservedTasks[0], condition: reservedTasks[1].condition }, reservedTasks[1]],
    task_id: 'P902-T1' });
  assert.notEqual(wrongReserved.status, 0, 'portal must reject an assignment unlike the CLI reservation');
  const cancelled = call('cancel-reservation', { participant_code: 'P903' });
  assert.equal(cancelled.status, 0, cancelled.stderr.toString());
  const next = call('reserve', { participant_code: 'P903' });
  assert.equal(next.status, 0, next.stderr.toString());
  const cancelledNext = call('cancel-reservation', { participant_code: 'P903' });
  assert.equal(cancelledNext.status, 0, cancelledNext.stderr.toString());
  const again = call('reserve', { participant_code: 'P903' });
  assert.equal(again.status, 0, again.stderr.toString());
  assert.deepEqual(JSON.parse(again.stdout.toString()).tasks, JSON.parse(next.stdout.toString()).tasks);
  console.log('PASS: automatic allocation, rollback, recorded-task ZIP, matching assignment, form handoff, and task gating');
} finally { rmSync(data, { recursive: true, force: true }); }
