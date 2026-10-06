// Synthetic interruption rehearsal. Uses no participant data.
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createSession, openStore } from '../app/lib.mjs';
import { writeCsv } from '../analysis/csv.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'security-trust-recovery-'));
const dataDir = join(temp, 'data');
const port = 43000 + randomInt(10000);
const env = { ...process.env, STUDY_DATA_DIR: dataDir, STUDY_PORT: String(port) };
process.env.STUDY_DATA_DIR = dataDir;
const store = openStore();
const session = createSession(store, 'P001');
const task = session.assignment.tasks[0];
store.db.close();
function run(script, args) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...args], { env, cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${script} failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}
const workspace = join(temp, 'workspace');
run('pilot/export_participant.mjs', [task.project_id, task.condition, workspace, task.checkpoint_order.join(',')]);
const [first, second, third, fourth] = task.checkpoint_order;
run('app/cli.mjs', ['prepare', task.task_id, first, workspace]);
run('app/cli.mjs', ['skip', task.task_id, first, workspace, 'patch_failure', 'synthetic pre-reveal interruption']);
run('app/cli.mjs', ['skip', task.task_id, second, workspace, 'time_limit', 'synthetic unreached checkpoint']);
run('app/cli.mjs', ['prepare', task.task_id, third, workspace]);
const db = openStore();
const review = db.db.prepare('SELECT * FROM reviews WHERE task_id = ? AND checkpoint_id = ?').get(task.task_id, third);
const skippedBeforeReveal = db.db.prepare('SELECT * FROM reviews WHERE task_id = ? AND checkpoint_id = ?').get(task.task_id, first);
db.db.close();
const server = spawn(process.execPath, [resolve(root, 'app/server.mjs')], { env, stdio: 'ignore' });
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { ready = (await fetch(`http://127.0.0.1:${port}/health`)).ok; if (ready) break; }
    catch { await new Promise((done) => setTimeout(done, 100)); }
  }
  assert.ok(ready, 'Local app must start');
  const blockedExpose = await fetch(`http://127.0.0.1:${port}/api/expose`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: session.token, review_id: skippedBeforeReveal.review_id })
  });
  assert.equal(blockedExpose.status, 400, 'Skipped checkpoint must reject late exposure');
  const expose = await fetch(`http://127.0.0.1:${port}/api/expose`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: session.token, review_id: review.review_id })
  });
  assert.equal(expose.status, 200, await expose.text());
  run('app/cli.mjs', ['skip', task.task_id, third, workspace, 'capture_failure', 'synthetic post-reveal interruption']);
  const lateDecision = await fetch(`http://127.0.0.1:${port}/api/decision`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: session.token, review_id: review.review_id,
      decision: 'keep', security_probability_pct: 50 })
  });
  assert.equal(lateDecision.status, 400, 'Skipped checkpoint must reject late decision');
  const closedPage = await (await fetch(`http://127.0.0.1:${port}/review?token=${session.token}&review=${review.review_id}`)).text();
  assert.ok(closedPage.includes('checkpoint was stopped by the researcher'));
  assert.ok(closedPage.includes('id="review-form" hidden'), 'A skipped checkpoint must hide its answer form');
  run('app/cli.mjs', ['skip', task.task_id, fourth, workspace, 'participant_declined', 'synthetic fourth skip']);
  run('app/cli.mjs', ['finalize', task.task_id, workspace]);
  const auditProcess = spawnSync(process.execPath, [resolve(root, 'app/cli.mjs'), 'audit'],
    { env, cwd: root, encoding: 'utf8' });
  assert.equal(auditProcess.status, 1, 'Audit must flag the intentionally unstarted second task');
  const audit = JSON.parse(auditProcess.stdout);
  assert.equal(audit.skips, 4);
  assert.equal(audit.incomplete_reviews.length, 0);
  assert.equal(audit.missing_by_task[0].missing_checkpoints.length, 0);
  const reviewDir = join(temp, 'review-output');
  run('analysis/review_queue.mjs', [reviewDir]);
  const map = JSON.parse(await readFile(join(reviewDir, 'RESEARCHER_MAP.json'), 'utf8'));
  assert.equal(map.length, 2, 'Only the exposed proposal and its final snapshot go to reviewers');
  writeCsv(join(reviewDir, 'RESOLVED_REVIEW.csv'),
    ['blind_id', 'target_status', 'functionality', 'data_flow_rationale', 'notes'],
    map.map((item) => ({ blind_id: item.blind_id, target_status: 'indeterminate', functionality: 'partial',
      data_flow_rationale: 'Synthetic interruption test', notes: 'DRY RUN ONLY' })));
  const analysisDir = join(temp, 'analysis-output');
  run('analysis/export.mjs', [reviewDir, analysisDir]);
  const summary = JSON.parse(await readFile(join(analysisDir, 'summary.json'), 'utf8'));
  assert.equal(summary.assigned_checkpoints, 8, 'The unused second task remains assigned and missing');
  assert.equal(summary.skipped_checkpoints, 4);
  assert.equal(summary.skipped_before_exposure, 3);
  assert.equal(summary.skipped_after_exposure, 1);
  assert.equal(summary.exposed_opportunities, 1);
  console.log(`Recovery dry run passed: pre/post exposure skips, late-decision lock, final snapshot, audit and export.\nArtifacts: ${temp}`);
} finally {
  server.kill('SIGTERM');
}
