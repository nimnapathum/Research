// Synthetic end-to-end engineering test. This does not simulate human trust or produce study data.
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { createSession, forms, openStore } from '../app/lib.mjs';
import { writeCsv } from '../analysis/csv.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '..');
const temp = await mkdtemp(join(tmpdir(), 'security-trust-e2e-'));
const dataDir = join(temp, 'data');
const port = 43000 + randomInt(10000);
const env = { ...process.env, STUDY_DATA_DIR: dataDir, STUDY_PORT: String(port) };
const store = openStoreWithEnv();
const session = createSession(store, 'P001');
store.db.close();

function openStoreWithEnv() {
  process.env.STUDY_DATA_DIR = dataDir;
  return openStore();
}
function run(script, args, cwd = root) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${script} ${args.join(' ')} failed\n${result.stdout}${result.stderr}`);
  return result.stdout;
}
async function post(path, body) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${path}: ${JSON.stringify(result)}`);
  return result;
}
function answersFor(kind) {
  const answers = {};
  for (const item of forms[kind].items) {
    if (!item.required) continue;
    answers[item.id] = item.type === 'choice' ? item.options[0] : item.min;
  }
  return answers;
}

const server = spawn(process.execPath, [resolve(root, 'app/server.mjs')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stderr.on('data', (chunk) => { serverLog += chunk; });
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { const response = await fetch(`http://127.0.0.1:${port}/health`); ready = response.ok; if (ready) break; }
    catch { await new Promise((resolveWait) => setTimeout(resolveWait, 100)); }
  }
  if (!ready) throw new Error(`Local server did not start: ${serverLog}`);
  await post('/api/form', { token: session.token, kind: 'pre_task', answers: answersFor('pre_task') });

  for (const task of session.assignment.tasks) {
    const workspace = join(temp, `workspace-T${task.task_order}`);
    run(resolve(root, 'pilot/export_participant.mjs'), [task.project_id, task.condition, workspace, task.checkpoint_order.join(',')]);
    run(resolve(root, 'app/cli.mjs'), ['configure-capture', task.task_id, workspace]);
    for (const checkpoint of task.checkpoint_order) {
      run(resolve(root, 'app/cli.mjs'), ['prepare', task.task_id, checkpoint, workspace]);
      const current = openStoreWithEnv();
      const review = current.db.prepare('SELECT * FROM reviews WHERE task_id = ? AND checkpoint_id = ?').get(task.task_id, checkpoint);
      current.db.close();
      const before = await readFile(review.before_file_path, 'utf8');
      assert.equal(await readFile(join(workspace, review.relative_file), 'utf8'), before,
        'Candidate must remain outside the participant workspace until reveal');
      const reviewUrl = `http://127.0.0.1:${port}/review?token=${session.token}&review=${review.review_id}`;
      const html = await (await fetch(reviewUrl)).text();
      assert.ok(html.includes('<pre id="patch"></pre>'), 'Patch must not be delivered before reveal');
      const exposure = await post('/api/expose', { token: session.token, review_id: review.review_id });
      assert.ok(exposure.patch.startsWith('diff --git'));
      assert.notEqual(await readFile(join(workspace, review.relative_file), 'utf8'), before,
        'Reveal must apply the frozen candidate in the IDE workspace');
      const decision = task.task_order === 1 ? 'keep' : 'reject';
      await post('/api/decision', { token: session.token, review_id: review.review_id,
        decision, security_probability_pct: 50, confidence_reason: 'Synthetic dry run' });
    }
    run(resolve(root, 'app/cli.mjs'), ['finalize', task.task_id, workspace]);
    await post('/api/form', { token: session.token, kind: 'after_task', task_id: task.task_id,
      answers: answersFor('after_task') });
  }
  await post('/api/form', { token: session.token, kind: 'after_both', answers: answersFor('after_both') });
  const audit = run(resolve(root, 'app/cli.mjs'), ['audit']);
  const reviewDir = join(temp, 'review-output');
  run(resolve(root, 'analysis/review_queue.mjs'), [reviewDir]);
  const map = JSON.parse(await readFile(join(reviewDir, 'RESEARCHER_MAP.json'), 'utf8'));
  const finalStore = openStoreWithEnv();
  const ratings = [];
  for (const item of map) {
    const review = finalStore.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(item.review_id);
    const task = finalStore.db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(item.task_id);
    const project = task.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
    const manifest = JSON.parse(await readFile(resolve(root, 'stimuli', project, `${task.project_id}-${item.checkpoint_id}`, 'manifest.json'), 'utf8'));
    const candidate = manifest.candidates.find((row) => row.candidate_id === review.candidate_id);
    ratings.push({ blind_id: item.blind_id,
      target_status: item.snapshot_kind === 'final' && task.task_order === 2 ? 'missing' : candidate.expected_target_status,
      functionality: item.snapshot_kind === 'final' && task.task_order === 2 ? 'fail' : 'pass',
      data_flow_rationale: 'Synthetic engineering label, never a human review', notes: 'DRY RUN ONLY' });
  }
  finalStore.db.close();
  for (const reviewer of ['reviewer-1', 'reviewer-2']) {
    writeCsv(join(reviewDir, 'give-to-reviewers', `${reviewer}-ratings.csv`),
      ['blind_id', 'target_status', 'functionality', 'data_flow_rationale', 'notes'], ratings);
  }
  const codingStore = openStoreWithEnv();
  const codedReviews = codingStore.db.prepare('SELECT r.review_id, r.task_id, t.condition, t.task_order FROM reviews r JOIN tasks t ON r.task_id = t.task_id').all();
  codingStore.db.close();
  writeCsv(join(reviewDir, 'MODE_EPISODES.csv'),
    ['review_id', 'start_utc', 'end_utc', 'mode', 'evidence_ref', 'notes'],
    codedReviews.map((row) => ({ review_id: row.review_id, mode: row.condition, evidence_ref: 'synthetic-dry-run' })));
  writeCsv(join(reviewDir, 'VERIFICATION_EVENTS.csv'),
    ['review_id', 'event_time_utc', 'code', 'phase', 'found_target', 'led_to_repair', 'evidence_ref', 'notes'],
    codedReviews.map((row) => ({ review_id: row.review_id,
      code: row.task_order === 1 ? 'S1' : 'none', phase: row.task_order === 1 ? 'before_decision' : '',
      found_target: 'no', led_to_repair: 'no', evidence_ref: 'synthetic-dry-run' })));
  writeCsv(join(reviewDir, 'DECISION_PATHS.csv'),
    ['review_id', 'post_decision_path', 'target_detected', 'security_repair', 'evidence_ref', 'notes'],
    codedReviews.map((row) => ({ review_id: row.review_id,
      post_decision_path: row.task_order === 1 ? 'kept_unchanged' : 'rejected_no_implementation',
      target_detected: 'no', security_repair: 'no', evidence_ref: 'synthetic-dry-run' })));
  run(resolve(root, 'analysis/resolve_reviews.mjs'), [reviewDir]);
  const analysisDir = join(temp, 'analysis-output');
  run(resolve(root, 'analysis/export.mjs'), [reviewDir, analysisDir]);
  const summary = JSON.parse(await readFile(join(analysisDir, 'summary.json'), 'utf8'));
  assert.equal(summary.exposed_opportunities, 8);
  assert.equal(summary.missing_proposal_adjudication, 0);
  assert.equal(summary.missing_final_adjudication, 0);
  assert.equal(summary.uncoded_mode, 0);
  assert.equal(summary.uncoded_verification, 0);
  assert.equal(summary.uncoded_decision_path, 0);
  assert.equal(summary.rq1_paired_brier_complete_tasks.n_pairs, 1);
  assert.equal(summary.rq2_paired_all_exposed_success.n_pairs, 1);
  assert.equal(summary.vulnerable_verification_association.length, 6);
  await writeFile(join(temp, 'DRY_RUN_ONLY.txt'), 'Synthetic engineering dry run; no participant data.\n');
  console.log(`Two-task dry run passed. Eight exposures, eight decisions, final snapshots and analysis joins verified.\nArtifacts: ${temp}\n${audit}`);
} finally {
  server.kill('SIGTERM');
}
