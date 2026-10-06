import { randomInt, randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from '../app/lib.mjs';
import { writeCsv } from './csv.mjs';

const output = resolve(process.argv[2] || 'blinded-review-output');
if (existsSync(output)) throw new Error('Choose a new output directory; existing review bundles are immutable');
mkdirSync(output, { recursive: true, mode: 0o700 });
const bundle = join(output, 'give-to-reviewers');
mkdirSync(bundle, { mode: 0o700 });
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const store = openStore();
const rows = store.db.prepare(`SELECT r.*, t.project_id, t.condition, t.final_snapshot_path
  FROM reviews r JOIN tasks t ON r.task_id = t.task_id WHERE r.exposed_at IS NOT NULL`).all();
const jobs = [];
for (const row of rows) {
  jobs.push({ row, kind: 'proposal', source: row.proposal_snapshot_path });
  if (row.final_snapshot_path) jobs.push({ row, kind: 'final', source: row.final_snapshot_path });
}
for (let i = jobs.length - 1; i > 0; i--) {
  const j = randomInt(i + 1);
  [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
}

const queue = [];
const mapping = [];
for (const job of jobs) {
  const blindId = randomUUID();
  const target = join(bundle, blindId);
  mkdirSync(target, { mode: 0o700 });
  const project = job.row.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  for (const name of ['src', project === 'resource-catalogue' ? 'previews' : 'attachments', 'package.json']) {
    const from = join(job.source, name);
    if (existsSync(from)) cpSync(from, join(target, name), { recursive: true });
  }
  const taskSheet = readFileSync(resolve(root, 'instruments', project, `${job.row.checkpoint_id}_TASK.md`), 'utf8');
  writeFileSync(join(target, 'TARGET.md'), taskSheet);
  queue.push({ blind_id: blindId, project_id: job.row.project_id,
    checkpoint_id: job.row.checkpoint_id, folder: blindId });
  mapping.push({ blind_id: blindId, task_id: job.row.task_id, review_id: job.row.review_id,
    checkpoint_id: job.row.checkpoint_id, snapshot_kind: job.kind,
    condition: job.row.condition, candidate_id: job.row.candidate_id,
    proposal_sha256: job.row.proposal_sha256 });
}
writeFileSync(join(bundle, 'queue.json'), JSON.stringify(queue, null, 2) + '\n');
const header = 'blind_id,target_status,functionality,data_flow_rationale,notes\n';
for (const reviewer of ['reviewer-1', 'reviewer-2']) {
  writeFileSync(join(bundle, `${reviewer}-ratings.csv`), header + queue.map((item) => `${item.blind_id},,,,`).join('\n') + '\n');
}
writeFileSync(join(output, 'RESEARCHER_MAP.json'), JSON.stringify(mapping, null, 2) + '\n', { mode: 0o600 });
writeCsv(join(output, 'MODE_EPISODES.csv'), ['review_id', 'start_utc', 'end_utc', 'mode', 'evidence_ref', 'notes'],
  rows.map((row) => ({ review_id: row.review_id })));
writeCsv(join(output, 'VERIFICATION_EVENTS.csv'), [
  'review_id', 'event_time_utc', 'code', 'phase', 'found_target', 'led_to_repair', 'evidence_ref', 'notes'
], rows.map((row) => ({ review_id: row.review_id })));
writeCsv(join(output, 'DECISION_PATHS.csv'), [
  'review_id', 'post_decision_path', 'target_detected', 'security_repair', 'evidence_ref', 'notes'
], rows.map((row) => ({ review_id: row.review_id })));
store.db.close();
console.log(`Prepared ${queue.length} blinded code items. Give reviewers only ${bundle}`);
