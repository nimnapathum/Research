// Synthetic delivery test: portal ZIP, separate participant client, four remote reviews, final snapshot.
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createSession, forms, openStore } from '../app/lib.mjs';
import { measurementAudit } from '../app/measurement-audit.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'study-portal-'));
console.log(`Dry run workspace: ${temp}`);
const port = 43000 + randomInt(10000);
const adminPassword = 'test-researcher-password-123';
const env = { ...process.env, STUDY_DATA_DIR: join(temp, 'data'), STUDY_PORT: String(port),
  STUDY_ADMIN_PASSWORD: adminPassword };
process.env.STUDY_DATA_DIR = env.STUDY_DATA_DIR;
const store = openStore();
const session = createSession(store, 'P901');
store.db.close();
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [join(root, 'app/server.mjs')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let serverError = '';
server.stderr.on('data', (part) => { serverError += part; });
let client;
async function waitFor(check, label, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try { const value = await check(); if (value) return value; } catch { /* retry during startup */ }
    await new Promise((done) => setTimeout(done, 300));
  }
  throw new Error(`Timed out waiting for ${typeof label === 'function' ? label() : label}; server: ${serverError}`);
}
async function get(path) {
  const response = await fetch(`${base}${path}`);
  if (!response.ok) throw new Error(`${path}: ${await response.text()}`);
  return response;
}
async function post(path, body) {
  return postAs(session.token, path, body);
}
async function postAs(token, path, body) {
  const response = await fetch(`${base}${path}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, ...body }) });
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: ${value.error}`);
  return value;
}
async function runTask(task, rejectFirst = false) {
  const packageResponse = await get(`/package?token=${session.token}&task_id=${task.task_id}`);
  assert.equal(packageResponse.headers.get('content-type'), 'application/zip');
  const zip = join(temp, `${task.task_id}.zip`);
  writeFileSync(zip, Buffer.from(await packageResponse.arrayBuffer()));
  const listing = spawnSync('unzip', ['-Z', '-1', zip], { encoding: 'utf8' });
  assert.equal(listing.status, 0, listing.stderr);
  assert.ok(listing.stdout.includes('study/client.mjs') && listing.stdout.includes('study/upload-transcript.mjs') && listing.stdout.includes('study/pointer_recorder.py') && listing.stdout.includes('src/'));
  assert.ok(!/(stimuli|oracle|candidate_status)/i.test(listing.stdout));
  const workspace = join(temp, task.task_id);
  mkdirSync(workspace);
  const extracted = spawnSync('unzip', ['-q', zip, '-d', workspace], { encoding: 'utf8' });
  assert.equal(extracted.status, 0, extracted.stderr);
  const setup = spawnSync(process.execPath, ['study/setup.mjs'], { cwd: workspace, encoding: 'utf8' });
  assert.equal(setup.status, 0, setup.stderr);
  client = spawn(process.execPath, ['study/client.mjs'], { cwd: workspace, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let clientLog = '';
  client.stdout.on('data', (part) => { clientLog += part; });
  client.stderr.on('data', (part) => { clientLog += part; });
  const statusPath = `/api/client/status?token=${session.token}&task_id=${task.task_id}`;
  await waitFor(async () => (await (await get(statusPath)).json()).client_connected, () => `client: ${clientLog}`);
  const transcriptFile = join(temp, `${task.task_id}-synthetic-agent-transcript.jsonl`);
  writeFileSync(transcriptFile, JSON.stringify({ role: 'user', text: 'synthetic agent transcript' }) + '\n');
  const upload = spawnSync(process.execPath, ['study/upload-transcript.mjs', transcriptFile],
    { cwd: workspace, encoding: 'utf8' });
  assert.equal(upload.status, 0, upload.stderr);
  const hookSample = { toolCall: { name: 'view_file', args: { AbsolutePath: join(workspace, 'src/main.mjs') } },
    conversationId: 'synthetic-conversation', stepIdx: 0, modelName: 'synthetic-model', transcriptPath: join(temp, 'synthetic-transcript.jsonl') };
  const hook = spawnSync(process.execPath, ['.study-capture/hook.mjs'], { cwd: workspace,
    input: JSON.stringify(hookSample), encoding: 'utf8' });
  assert.equal(hook.status, 0, hook.stderr);
  assert.equal(hook.stdout.trim(), '{}');
  await waitFor(async () => (await (await get(statusPath)).json()).agent_capture_seen, 'synthetic hook event');
  const invocation = spawnSync(process.execPath, ['.study-capture/hook.mjs', 'pre'], { cwd: workspace,
    input: JSON.stringify({ ...hookSample, toolCall: undefined, invocationNum: 2 }), encoding: 'utf8' });
  assert.equal(invocation.status, 0, invocation.stderr);
  const pointer = { task_id: task.task_id, source: 'pointer-recorder', actor: 'participant',
    event_type: 'pointer_summary', timestamp_utc: new Date().toISOString(), data: {
      window_started_utc: new Date().toISOString(), elapsed_ms: 5000, move_events: 3,
      distance_px: 17, median_speed_px_s: 25, p90_speed_px_s: 40,
      clicks: 1, scrolls: 0, platform: 'windows',
      scope: 'all pointer activity while recorder runs; no foreground filter' } };
  const privateDataAttempt = await fetch(`${base}/api/client/ingest-telemetry`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: session.token, task_id: task.task_id,
      rows: [{ name: 'pointer-summary.jsonl', record: {
        ...pointer, data: { ...pointer.data, raw_x: 123 }
      } }] })
  });
  assert.equal(privateDataAttempt.status, 400, 'raw pointer coordinates must be rejected');
  appendFileSync(join(workspace, '.study-capture/pointer-summary.jsonl'), JSON.stringify(pointer) + '\n');
  await waitFor(() => {
    const check = openStore();
    const found = check.db.prepare("SELECT 1 FROM events WHERE task_id = ? AND json_extract(event_json, '$.event_type') = 'pointer_summary'").get(task.task_id);
    check.db.close();
    return found;
  }, 'pointer summary transfer');
  for (const [index, checkpoint] of task.checkpoint_order.entries()) {
    const sheet = await (await get(`/task?token=${session.token}&task_id=${task.task_id}`)).text();
    assert.ok(sheet.includes(`Current task sheet: ${checkpoint}`));
    await post('/api/client/request-review', { task_id: task.task_id, checkpoint_id: checkpoint });
    const prepared = await waitFor(async () => {
      const value = await (await get(`${statusPath}&checkpoint=${checkpoint}`)).json();
      return value.review_url ? value : null;
    }, () => `prepared ${checkpoint}: ${clientLog}`);
    const reviewUrl = prepared.review_url;
    const reviewPage = await (await get(reviewUrl)).text();
    assert.ok(reviewPage.includes('<pre id="patch"></pre>'), 'Patch hidden before reveal');
    const reviewId = new URL(reviewUrl, base).searchParams.get('review');
    const reviewStore = openStore();
    const relativeFile = reviewStore.db.prepare('SELECT relative_file FROM reviews WHERE review_id = ?').get(reviewId).relative_file;
    reviewStore.db.close();
    const before = readFileSync(join(workspace, relativeFile));
    const exposure = await post('/api/expose', { review_id: reviewId });
    assert.equal(exposure.pending, true);
    await waitFor(async () => (await (await get(`/api/client/review-status?token=${session.token}&review_id=${reviewId}`)).json()).exposed,
      () => `applied ${checkpoint}: ${clientLog}`);
    const after = readFileSync(join(workspace, relativeFile));
    assert.notDeepEqual(after, before, 'Proposal must be in the participant workspace');
    const decision = rejectFirst && index === 0 ? 'reject' : 'keep';
    const submitted = await post('/api/decision', { review_id: reviewId, decision, security_probability_pct: 50 });
    assert.equal(submitted.pending, true);
    await waitFor(async () => (await (await get(`/api/client/review-status?token=${session.token}&review_id=${reviewId}`)).json()).decision_saved,
      () => `decision check ${checkpoint}: ${clientLog}`);
    if (decision === 'reject') {
      await waitFor(async () => readFileSync(join(workspace, relativeFile)).equals(before),
        () => `restored ${checkpoint}: ${clientLog}`);
    }
  }
  await post('/api/client/request-final', { task_id: task.task_id });
  await waitFor(async () => (await (await get(statusPath)).json()).finalized, () => `final snapshot: ${clientLog}`);
  client.kill('SIGTERM');
  client = null;
}
function answersFor(kind) {
  const answers = {};
  for (const item of forms[kind].items) {
    if (!item.required) continue;
    answers[item.id] = item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'Synthetic answer' : item.min;
  }
  return answers;
}
try {
  await waitFor(async () => (await fetch(`${base}/health`)).ok, 'server');
  const denied = await fetch(`${base}/admin`);
  assert.equal(denied.status, 401);
  const adminAuth = `Basic ${Buffer.from(`researcher:${adminPassword}`).toString('base64')}`;
  const admin = await fetch(`${base}/admin`, { headers: { authorization: adminAuth } });
  assert.ok(admin.ok && (await admin.text()).includes('Researcher console'));
  const auditPage = await fetch(`${base}/admin/audit`, { headers: { authorization: adminAuth } });
  assert.ok(auditPage.ok && (await auditPage.text()).includes('Measurement and recording audit'));
  const deniedAudit = await fetch(`${base}/admin/audit.json`);
  assert.equal(deniedAudit.status, 401);
  const created = await fetch(`${base}/admin/create`, { method: 'POST', redirect: 'manual',
    headers: { authorization: adminAuth, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'participant_id=P902' });
  assert.equal(created.status, 303);
  assert.ok(created.headers.get('location').startsWith('/session?token='));
  const recoveryToken = new URL(created.headers.get('location'), base).searchParams.get('token');
  await post('/api/form', { kind: 'pre_task', answers: answersFor('pre_task') });
  const portal = await (await get(`/session?token=${session.token}`)).text();
  assert.ok(portal.includes('Download this task') && portal.includes('node study/client.mjs'));
  const task = session.assignment.tasks[0];
  const second = session.assignment.tasks[1];
  const secondBefore = await fetch(`${base}/package?token=${session.token}&task_id=${second.task_id}`);
  assert.equal(secondBefore.status, 400, 'Task 2 must remain locked');
  await runTask(task);
  await post('/api/form', { kind: 'after_task', task_id: task.task_id, answers: answersFor('after_task') });
  const secondAfter = await get(`/package?token=${session.token}&task_id=${second.task_id}`);
  assert.equal(secondAfter.headers.get('content-type'), 'application/zip');
  await runTask(second, true);
  await post('/api/form', { kind: 'after_task', task_id: second.task_id, answers: answersFor('after_task') });
  await post('/api/form', { kind: 'after_both', answers: answersFor('after_both') });
  // A separate synthetic participant checks that changed code is never given a decision label.
  const recoveryStore = openStore();
  const recoveryTask = recoveryStore.db.prepare('SELECT * FROM tasks WHERE participant_id = ? AND task_order = 1').get('P902');
  recoveryStore.db.close();
  await postAs(recoveryToken, '/api/form', { kind: 'pre_task', answers: answersFor('pre_task') });
  const recoveryZipResponse = await get(`/package?token=${recoveryToken}&task_id=${recoveryTask.task_id}`);
  const recoveryZip = join(temp, 'recovery.zip');
  writeFileSync(recoveryZip, Buffer.from(await recoveryZipResponse.arrayBuffer()));
  const recoveryWorkspace = join(temp, 'recovery-project');
  mkdirSync(recoveryWorkspace);
  assert.equal(spawnSync('unzip', ['-q', recoveryZip, '-d', recoveryWorkspace]).status, 0);
  assert.equal(spawnSync(process.execPath, ['study/setup.mjs'], { cwd: recoveryWorkspace }).status, 0);
  client = spawn(process.execPath, ['study/client.mjs'], { cwd: recoveryWorkspace, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let recoveryLog = '';
  client.stdout.on('data', (part) => { recoveryLog += part; });
  client.stderr.on('data', (part) => { recoveryLog += part; });
  const recoveryCheckpoint = JSON.parse(recoveryTask.checkpoint_order_json)[0];
  const recoveryStatus = `/api/client/status?token=${recoveryToken}&task_id=${recoveryTask.task_id}&checkpoint=${recoveryCheckpoint}`;
  await waitFor(async () => (await (await get(recoveryStatus)).json()).client_connected, () => `recovery client: ${recoveryLog}`);
  await postAs(recoveryToken, '/api/client/request-review', { task_id: recoveryTask.task_id, checkpoint_id: recoveryCheckpoint });
  const recoveryPrepared = await waitFor(async () => (await (await get(recoveryStatus)).json()).review_url,
    () => `recovery prepared: ${recoveryLog}`);
  const recoveryReview = new URL(recoveryPrepared, base).searchParams.get('review');
  await postAs(recoveryToken, '/api/expose', { review_id: recoveryReview });
  await waitFor(async () => (await (await get(`/api/client/review-status?token=${recoveryToken}&review_id=${recoveryReview}`)).json()).exposed,
    () => `recovery exposed: ${recoveryLog}`);
  const conflictStore = openStore();
  const conflictFile = conflictStore.db.prepare('SELECT relative_file FROM reviews WHERE review_id = ?').get(recoveryReview).relative_file;
  conflictStore.db.close();
  writeFileSync(join(recoveryWorkspace, conflictFile), Buffer.concat([readFileSync(join(recoveryWorkspace, conflictFile)), Buffer.from('\n// synthetic changed-code check\n')]));
  const pending = await postAs(recoveryToken, '/api/decision', { review_id: recoveryReview,
    decision: 'keep', security_probability_pct: 75 });
  assert.equal(pending.pending, true);
  await waitFor(async () => (await (await get(`/api/client/review-status?token=${recoveryToken}&review_id=${recoveryReview}`)).json()).job_status === 'review_conflict',
    () => `review conflict: ${recoveryLog}`);
  const beforeSkip = openStore();
  assert.equal(beforeSkip.db.prepare('SELECT decision_at FROM reviews WHERE review_id = ?').get(recoveryReview).decision_at, null);
  beforeSkip.db.close();
  const skipped = spawnSync(process.execPath, [join(root, 'app/cli.mjs'), 'skip-remote', recoveryTask.task_id,
    recoveryCheckpoint, 'early_edit', 'synthetic changed code'], { env, encoding: 'utf8' });
  assert.equal(skipped.status, 0, skipped.stderr);
  client.kill('SIGTERM');
  client = null;
  const final = openStore();
  for (const item of [task, second]) {
    assert.equal(final.db.prepare('SELECT COUNT(*) AS n FROM reviews WHERE task_id = ? AND exposed_at IS NOT NULL AND decision_at IS NOT NULL')
      .get(item.task_id).n, 4);
    assert.ok(final.db.prepare('SELECT final_snapshot_path FROM tasks WHERE task_id = ?').get(item.task_id).final_snapshot_path);
  }
  const audit = measurementAudit(final);
  const firstAudit = audit.tasks.find((item) => item.task_id === task.task_id);
  assert.equal(firstAudit.pointer_covered_ms, 5000);
  assert.ok(firstAudit.evidence.some((item) => item.kind === 'agent-transcript' && item.file_present));
  assert.equal(firstAudit.checkpoints.filter((item) => item.exposure_to_first_decision_ms !== null).length, 4);
  assert.ok(firstAudit.event_counts.agent_invocation_started >= 1);
  assert.equal(final.db.prepare('SELECT COUNT(*) AS n FROM skips WHERE task_id = ?').get(recoveryTask.task_id).n, 1);
  final.db.close();
  console.log(`Participant portal dry run passed: two codebase ZIPs, eight remote reviews, rejection restore, two final snapshots, changed-code rejection and remote skip. ${temp}`);
} finally {
  client?.kill('SIGTERM');
  server.kill('SIGTERM');
}
