import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSession, openStore, validateAnswers } from './lib.mjs';
import { participantPackage } from './participant-package.mjs';

process.on('uncaughtException', (error) => {
  process.stderr.write(`BRIDGE_ERROR:${error.message}\n`);
  process.exit(1);
});

// Server-side bridge for the password portal. It is never included in a
// participant download. Input arrives on stdin; package bytes go to stdout.
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const version = JSON.parse(readFileSync(resolve(root, 'instruments/forms.json'), 'utf8')).version;
const publicUrl = (process.env.STUDY_PUBLIC_URL || 'http://127.0.0.1:4175').replace(/\/+$/, '');
const origin = new URL(publicUrl);
if ((origin.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(origin.hostname)) ||
    origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Invalid STUDY_PUBLIC_URL');
const input = JSON.parse(readFileSync(0, 'utf8'));
const store = openStore();
const code = input.participant_code;
if (!/^P[0-9]{3,}$/.test(code)) throw new Error('Invalid participant code');
const requested = input.tasks;
if (!Array.isArray(requested) || requested.length !== 2) throw new Error('Two portal tasks are required');

function sameAssignment(session) {
  const current = store.db.prepare('SELECT task_id,project_id,condition,task_order,checkpoint_order_json FROM tasks WHERE participant_id = ? ORDER BY task_order').all(code);
  if (current.length !== 2 || requested.some((task, index) => {
    const row = current[index];
    return task.task_id !== row.task_id || task.project_id !== row.project_id ||
      task.condition !== row.condition || task.task_order !== row.task_order ||
      JSON.stringify(task.checkpoint_order) !== row.checkpoint_order_json;
  })) throw new Error('Checkpoint assignment differs from portal assignment; researcher reconciliation required');
  return session;
}
let session = store.db.prepare('SELECT * FROM sessions WHERE participant_id = ?').get(code);
if (session) sameAssignment(session);
else {
  createSession(store, code, requested);
  session = store.db.prepare('SELECT * FROM sessions WHERE participant_id = ?').get(code);
}

function mirrorForm(kind, answers, taskId = null) {
  const validated = validateAnswers(kind, answers);
  const existing = store.db.prepare('SELECT answers_json FROM forms WHERE participant_id = ? AND kind = ? AND task_id IS ?')
    .get(code, kind, taskId);
  if (existing) {
    if (JSON.stringify(JSON.parse(existing.answers_json)) !== JSON.stringify(validated)) {
      throw new Error('Checkpoint questionnaire differs from portal response; researcher reconciliation required');
    }
    return;
  }
  if (kind === 'after_task') {
    const task = store.db.prepare('SELECT final_sha256 FROM tasks WHERE participant_id = ? AND task_id = ?').get(code, taskId);
    if (!task?.final_sha256) throw new Error('Finish the recorded checkpoint task before its after-task form');
  }
  if (kind === 'after_both') {
    const tasks = store.db.prepare('SELECT task_id,final_sha256 FROM tasks WHERE participant_id = ?').all(code);
    if (!tasks.every((task) => task.final_sha256 &&
        store.db.prepare("SELECT 1 FROM forms WHERE participant_id = ? AND kind = 'after_task' AND task_id = ?").get(code, task.task_id))) {
      throw new Error('Finish both recorded tasks and after-task forms first');
    }
  }
  store.db.prepare('INSERT INTO forms VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    randomUUID(), code, taskId, kind, version, JSON.stringify(validated), new Date().toISOString());
}

if (!input.pre_answers) throw new Error('Pre-task response is required before checkpoint setup');
mirrorForm('pre_task', input.pre_answers);
const task = input.task_id ? store.db.prepare('SELECT * FROM tasks WHERE participant_id = ? AND task_id = ?').get(code, input.task_id) : null;
if (input.task_id && !task) throw new Error('Task does not belong to participant');
if (input.command === 'ensure') {
  process.stdout.write(JSON.stringify({ configured: true }));
} else if (input.command === 'package') {
  if (!task) throw new Error('Task is required');
  if (task.task_order === 2) {
    const first = store.db.prepare('SELECT task_id,final_sha256 FROM tasks WHERE participant_id = ? AND task_order = 1').get(code);
    if (!first?.final_sha256 || !store.db.prepare("SELECT 1 FROM forms WHERE participant_id = ? AND kind = 'after_task' AND task_id = ?")
      .get(code, first.task_id)) throw new Error('Finish Task 1 and its after-task form first');
  }
  process.stdout.write(participantPackage(task, session.token, publicUrl));
} else if (input.command === 'status') {
  if (!task) throw new Error('Task is required');
  const latest = store.db.prepare('SELECT last_seen_at FROM client_status WHERE task_id = ?').get(task.task_id);
  const capture = store.db.prepare("SELECT 1 FROM events WHERE task_id = ? AND json_extract(event_json, '$.source') = 'antigravity-hook' LIMIT 1")
    .get(task.task_id);
  const pointer = store.db.prepare("SELECT 1 FROM events WHERE task_id = ? AND json_extract(event_json, '$.source') = 'pointer-recorder' LIMIT 1")
    .get(task.task_id);
  const reviews = store.db.prepare('SELECT checkpoint_id,decision_at FROM reviews WHERE task_id = ?').all(task.task_id);
  const skips = store.db.prepare('SELECT checkpoint_id FROM skips WHERE task_id = ?').all(task.task_id);
  const done = new Set([...reviews.filter((row) => row.decision_at), ...skips].map((row) => row.checkpoint_id));
  const next = JSON.parse(task.checkpoint_order_json).find((step) => !done.has(step)) || null;
  process.stdout.write(JSON.stringify({ connected: Boolean(latest && Date.now() - Date.parse(latest.last_seen_at) < 15000),
    last_seen_at: latest?.last_seen_at || null, agent_capture_seen: Boolean(capture),
    pointer_capture_seen: Boolean(pointer),
    task_url: `${publicUrl}/task?token=${encodeURIComponent(session.token)}&task_id=${encodeURIComponent(task.task_id)}`,
    next_checkpoint: next, final_submitted: Boolean(task.final_sha256) }));
} else if (input.command === 'mirror-form') {
  if (!['after_task', 'after_both'].includes(input.kind)) throw new Error('Invalid form kind');
  if (input.kind === 'after_task' && !task) throw new Error('Task required for after-task form');
  if (input.kind === 'after_both' && task) throw new Error('Task not allowed for after-both form');
  mirrorForm(input.kind, input.answers, task?.task_id || null);
  process.stdout.write(JSON.stringify({ saved: true }));
} else throw new Error('Unknown bridge command');
