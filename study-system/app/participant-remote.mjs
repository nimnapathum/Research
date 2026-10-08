import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashTree, logEvent } from './lib.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const projectNames = { A: 'resource-catalogue', B: 'support-archive' };
const allowedRoots = new Set(['src', 'test', 'previews', 'attachments', 'study', '.agents']);
const allowedTopFiles = new Set(['AGENTS.md', 'README.md', 'package.json', 'package-lock.json', '.node-version', '.gitignore']);
const now = () => new Date().toISOString();
const jobRow = (store, id) => store.db.prepare('SELECT * FROM client_jobs WHERE job_id = ?').get(id);

function checkJob(store, task, id, status) {
  const job = jobRow(store, id);
  if (!job || job.task_id !== task.task_id || job.status !== status) throw new Error(`No ${status} client job for this task`);
  return job;
}
function safeFile(path) {
  if (typeof path !== 'string' || path.length > 240 || path.includes('\\') || path.startsWith('/') ||
      path.split('/').some((part) => !part || part === '.' || part === '..' || part.includes(':'))) return false;
  const parts = path.split('/');
  return parts.length === 1 ? allowedTopFiles.has(path) : allowedRoots.has(parts[0]);
}
function materialize(store, task, supplied, claimedHash, purpose) {
  if (!Array.isArray(supplied) || supplied.length > 300 || supplied.length === 0 ||
      typeof claimedHash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(claimedHash)) {
    throw new Error('Invalid workspace snapshot');
  }
  const folder = join(store.dir, 'snapshots', `${purpose}-${randomUUID()}`);
  mkdirSync(folder, { recursive: false, mode: 0o700 });
  let total = 0;
  const seen = new Set();
  for (const item of supplied) {
    if (!safeFile(item?.path) || seen.has(item.path) || typeof item.content_base64 !== 'string') {
      throw new Error('Invalid workspace file');
    }
    seen.add(item.path);
    const data = Buffer.from(item.content_base64, 'base64');
    total += data.length;
    if (total > 2_000_000) throw new Error('Workspace snapshot too large');
    const path = join(folder, item.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, data);
  }
  const info = JSON.parse(readFileSync(join(folder, 'study/PACKAGE_INFO.json'), 'utf8'));
  const capture = JSON.parse(readFileSync(join(folder, 'study/CAPTURE_CONFIG.json'), 'utf8'));
  const expectedToken = store.db.prepare('SELECT token FROM sessions WHERE participant_id = ?').get(task.participant_id)?.token;
  if (info.project_id !== task.project_id || info.assigned_condition !== task.condition ||
      capture.task_id !== task.task_id || capture.token !== expectedToken) {
    throw new Error('Workspace does not match assigned task');
  }
  if (hashTree(folder) !== claimedHash) throw new Error('Workspace hash differs from uploaded files');
  return folder;
}
export function heartbeat(store, task, hash) {
  if (typeof hash !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid workspace hash');
  const previous = store.db.prepare('SELECT workspace_sha256 FROM client_status WHERE task_id = ?').get(task.task_id);
  store.db.prepare(`INSERT INTO client_status VALUES (?, ?, ?)
    ON CONFLICT(task_id) DO UPDATE SET last_seen_at = excluded.last_seen_at,
    workspace_sha256 = excluded.workspace_sha256`).run(task.task_id, now(), hash);
  if (!previous) logEvent(store, task.task_id, 'participant_client_connected', { source: 'participant-client', data: { workspace_sha256: hash } });
  else if (previous.workspace_sha256 !== hash) logEvent(store, task.task_id, 'workspace_changed', {
    source: 'participant-client', actor: 'unknown',
    data: { before_sha256: previous.workspace_sha256, after_sha256: hash }
  });
  return { connected: true };
}
export function currentJob(store, task) {
  const job = store.db.prepare('SELECT * FROM client_jobs WHERE task_id = ? ORDER BY rowid DESC LIMIT 1').get(task.task_id);
  if (!job) return { status: 'idle' };
  const result = { job_id: job.job_id, status: job.status, checkpoint_id: job.checkpoint_id };
  if (job.status === 'reveal_requested') {
    const review = store.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(job.review_id);
    Object.assign(result, { patch: review.patch_text, baseline_sha256: review.baseline_sha256,
      proposal_sha256: review.proposal_sha256 });
  }
  if (job.status === 'restore_requested') {
    const review = store.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(job.review_id);
    Object.assign(result, { relative_file: review.relative_file,
      before_base64: readFileSync(review.before_file_path).toString('base64') });
  }
  return result;
}
export function requestReview(store, task, checkpoint) {
  if (task.final_sha256) throw new Error('Task is already finished');
  if (store.db.prepare("SELECT 1 FROM client_jobs WHERE task_id = ? AND status = 'restore_requested'").get(task.task_id)) {
    throw new Error('Wait for the rejected proposal to be restored before the next step');
  }
  const sequence = JSON.parse(task.checkpoint_order_json);
  const decisions = store.db.prepare('SELECT checkpoint_id FROM reviews WHERE task_id = ? AND decision_at IS NOT NULL').all(task.task_id);
  const skips = store.db.prepare('SELECT checkpoint_id FROM skips WHERE task_id = ?').all(task.task_id);
  const completed = new Set([...decisions, ...skips].map((row) => row.checkpoint_id));
  const next = sequence.find((id) => !completed.has(id));
  if (checkpoint !== next) throw new Error(`Next checkpoint is ${next || 'none'}`);
  if (store.db.prepare('SELECT 1 FROM reviews WHERE task_id = ? AND checkpoint_id = ?').get(task.task_id, checkpoint)) {
    throw new Error('This checkpoint already has a review');
  }
  let job = store.db.prepare("SELECT * FROM client_jobs WHERE task_id = ? AND checkpoint_id = ? AND kind = 'review'").get(task.task_id, checkpoint);
  if (!job) {
    const id = randomUUID();
    store.db.prepare(`INSERT INTO client_jobs
      (job_id, task_id, checkpoint_id, kind, status, review_id, last_hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, task.task_id, checkpoint, 'review', 'requested', null, null, now());
    job = jobRow(store, id);
  }
  return { job_id: job.job_id, status: job.status, review_id: job.review_id };
}
export function prepareReview(store, task, body) {
  const job = checkJob(store, task, body.job_id, 'requested');
  const baseline = materialize(store, task, body.files, body.sha256, 'baseline');
  const project = projectNames[task.project_id];
  const folder = resolve(root, 'stimuli', project, `${task.project_id}-${job.checkpoint_id}`);
  const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8'));
  const status = JSON.parse(task.status_json)[job.checkpoint_id];
  const candidate = manifest.candidates.find((item) => item.expected_target_status === status);
  if (!candidate) throw new Error('No assigned proposal');
  const patchText = readFileSync(join(folder, candidate.patch), 'utf8');
  const touched = [...patchText.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)];
  if (touched.length !== 1 || touched[0][1] !== manifest.starter_file || touched[0][2] !== manifest.starter_file) {
    throw new Error('Proposal changes an unexpected file');
  }
  const reviewId = randomUUID();
  const proposal = join(store.dir, 'snapshots', `proposal-${reviewId}`);
  cpSync(baseline, proposal, { recursive: true });
  const applied = spawnSync('git', ['apply', '-'], { cwd: proposal, input: patchText, encoding: 'utf8' });
  if (applied.status !== 0) throw new Error(`Proposal cannot apply to this workspace: ${applied.stderr}`);
  const beforePath = join(store.dir, 'snapshots', `before-${reviewId}`);
  writeFileSync(beforePath, readFileSync(join(baseline, manifest.starter_file)), { mode: 0o600 });
  const proposalHash = hashTree(proposal);
  store.db.prepare(`INSERT INTO reviews
    (review_id, task_id, checkpoint_id, candidate_id, proposal_sha256, baseline_sha256,
     patch_text, relative_file, before_file_path, proposal_snapshot_path, workspace_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      reviewId, task.task_id, job.checkpoint_id, candidate.candidate_id, proposalHash, body.sha256,
      patchText, manifest.starter_file, beforePath, proposal, 'remote', now());
  store.db.prepare('UPDATE client_jobs SET status = ?, review_id = ?, updated_at = ? WHERE job_id = ?')
    .run('prepared', reviewId, now(), job.job_id);
  logEvent(store, task.task_id, 'checkpoint_started', {
    checkpoint_id: job.checkpoint_id, candidate_id: candidate.candidate_id,
    proposal_sha256: proposalHash, evidence_ref: `snapshots/proposal-${reviewId}`,
    data: { review_id: reviewId, delivery: 'participant-client' }
  });
  return { prepared: true, review_id: reviewId };
}
export function reviewJob(store, reviewId) {
  return store.db.prepare('SELECT * FROM client_jobs WHERE review_id = ?').get(reviewId);
}
export function markApplied(store, task, body) {
  const job = checkJob(store, task, body.job_id, 'reveal_requested');
  const review = store.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(job.review_id);
  if (body.workspace_sha256 !== review.proposal_sha256) throw new Error('Applied proposal hash mismatch');
  store.db.prepare('UPDATE client_jobs SET status = ?, last_hash = ?, updated_at = ? WHERE job_id = ?')
    .run('applied', body.workspace_sha256, now(), job.job_id);
  store.db.prepare('UPDATE reviews SET exposed_at = ? WHERE review_id = ?').run(now(), review.review_id);
  heartbeat(store, task, body.workspace_sha256);
  logEvent(store, task.task_id, 'candidate_exposed', {
    source: 'participant-client', actor: 'participant', checkpoint_id: job.checkpoint_id,
    candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
    evidence_ref: `snapshots/proposal-${review.review_id}`, data: { review_id: review.review_id }
  });
  return { exposed: true };
}
export function markRestored(store, task, body) {
  const job = checkJob(store, task, body.job_id, 'restore_requested');
  const review = store.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(job.review_id);
  if (body.workspace_sha256 !== review.baseline_sha256) throw new Error('Restored workspace hash mismatch');
  store.db.prepare('UPDATE client_jobs SET status = ?, last_hash = ?, updated_at = ? WHERE job_id = ?')
    .run('restored', body.workspace_sha256, now(), job.job_id);
  heartbeat(store, task, body.workspace_sha256);
  return { restored: true };
}
export function requestFinal(store, task) {
  if (task.final_sha256) throw new Error('Task is already finished');
  const sequence = JSON.parse(task.checkpoint_order_json);
  const decided = new Set(store.db.prepare('SELECT checkpoint_id FROM reviews WHERE task_id = ? AND decision_at IS NOT NULL')
    .all(task.task_id).map((row) => row.checkpoint_id));
  const skipped = new Set(store.db.prepare('SELECT checkpoint_id FROM skips WHERE task_id = ?')
    .all(task.task_id).map((row) => row.checkpoint_id));
  if (sequence.some((id) => !decided.has(id) && !skipped.has(id))) throw new Error('Complete every checkpoint before final submission');
  const outstanding = store.db.prepare("SELECT 1 FROM client_jobs WHERE task_id = ? AND status = 'restore_requested'").get(task.task_id);
  if (outstanding) throw new Error('Wait for rejected proposal to be restored');
  let job = store.db.prepare("SELECT * FROM client_jobs WHERE task_id = ? AND kind = 'final'").get(task.task_id);
  if (!job) {
    const id = randomUUID();
    store.db.prepare(`INSERT INTO client_jobs
      (job_id, task_id, checkpoint_id, kind, status, review_id, last_hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, task.task_id, 'FINAL', 'final', 'final_requested', null, null, now());
    job = jobRow(store, id);
  }
  return { job_id: job.job_id, status: job.status };
}
export function submitFinal(store, task, body) {
  const job = checkJob(store, task, body.job_id, 'final_requested');
  const finalPath = materialize(store, task, body.files, body.sha256, 'final');
  store.db.prepare('UPDATE tasks SET workspace_path = ?, final_sha256 = ?, final_snapshot_path = ? WHERE task_id = ?')
    .run('remote', body.sha256, finalPath, task.task_id);
  store.db.prepare('UPDATE client_jobs SET status = ?, last_hash = ?, updated_at = ? WHERE job_id = ?')
    .run('done', body.sha256, now(), job.job_id);
  logEvent(store, task.task_id, 'final_snapshot_saved', {
    source: 'participant-client', evidence_ref: finalPath,
    data: { final_snapshot_sha256: body.sha256 }
  });
  logEvent(store, task.task_id, 'task_ended');
  return { saved: true, final_sha256: body.sha256 };
}

export function requestDecisionCheck(store, review, decision) {
  const job = reviewJob(store, review.review_id);
  if (!job || job.status !== 'applied') throw new Error('Proposal is not ready for a decision');
  store.db.prepare('UPDATE client_jobs SET status = ?, pending_decision_json = ?, updated_at = ? WHERE job_id = ?')
    .run('decision_check_requested', JSON.stringify({ decision: decision.decision,
      security_probability_pct: decision.security_probability_pct,
      confidence_reason: decision.confidence_reason || '', planned_check: decision.planned_check || '' }),
    now(), job.job_id);
  return { pending: true };
}

export function verifyDecision(store, task, body) {
  const job = checkJob(store, task, body.job_id, 'decision_check_requested');
  const review = store.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(job.review_id);
  if (!review || review.decision_at || !job.pending_decision_json) throw new Error('Review decision is unavailable');
  if (body.workspace_sha256 !== review.proposal_sha256) {
    store.db.prepare('UPDATE client_jobs SET status = ?, last_hash = ?, pending_decision_json = NULL, updated_at = ? WHERE job_id = ?')
      .run('review_conflict', body.workspace_sha256, now(), job.job_id);
    heartbeat(store, task, body.workspace_sha256);
    logEvent(store, task.task_id, 'review_conflict', {
      source: 'participant-client', checkpoint_id: review.checkpoint_id,
      candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
      data: { review_id: review.review_id, actual_workspace_sha256: body.workspace_sha256 }
    });
    throw new Error('Workspace changed during review; decision was not recorded');
  }
  const answer = JSON.parse(job.pending_decision_json);
  const timestamp = now();
  store.db.prepare('UPDATE reviews SET decision = ?, confidence = ?, confidence_reason = ?, planned_check = ?, decision_at = ? WHERE review_id = ?')
    .run(answer.decision, answer.security_probability_pct, answer.confidence_reason || '',
      answer.planned_check || '', timestamp, review.review_id);
  logEvent(store, task.task_id, 'provisional_decision', {
    source: 'checkpoint-ui', actor: 'participant', checkpoint_id: review.checkpoint_id,
    candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
    evidence_ref: `reviews/${review.review_id}`, data: { decision: answer.decision }
  });
  logEvent(store, task.task_id, 'confidence_recorded', {
    source: 'checkpoint-ui', actor: 'participant', checkpoint_id: review.checkpoint_id,
    candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
    evidence_ref: `reviews/${review.review_id}`,
    data: { security_probability_pct: answer.security_probability_pct, reason: answer.confidence_reason || '' }
  });
  store.db.prepare('UPDATE client_jobs SET status = ?, last_hash = ?, pending_decision_json = NULL, updated_at = ? WHERE job_id = ?')
    .run(answer.decision === 'reject' ? 'restore_requested' : 'decided', body.workspace_sha256, timestamp, job.job_id);
  heartbeat(store, task, body.workspace_sha256);
  return { saved: true, decision: answer.decision };
}
