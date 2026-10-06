import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { appendFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { assignmentFor } from './assignment.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const forms = JSON.parse(readFileSync(resolve(here, '../instruments/forms.json'), 'utf8')).forms;

export function dataDirectory() {
  return resolve(process.env.STUDY_DATA_DIR || join(here, '.study-data'));
}

export function openStore() {
  const dir = dataDirectory();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  mkdirSync(join(dir, 'raw'), { recursive: true, mode: 0o700 });
  mkdirSync(join(dir, 'snapshots'), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dir, 'study.sqlite'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (
      participant_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, token TEXT NOT NULL UNIQUE,
      ordinal INTEGER NOT NULL UNIQUE, assignment_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      task_id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES sessions(participant_id),
      project_id TEXT NOT NULL, condition TEXT NOT NULL, task_order INTEGER NOT NULL,
      checkpoint_order_json TEXT NOT NULL, status_json TEXT NOT NULL,
      workspace_path TEXT, final_sha256 TEXT, final_snapshot_path TEXT
    );
    CREATE TABLE IF NOT EXISTS reviews (
      review_id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(task_id),
      checkpoint_id TEXT NOT NULL, candidate_id TEXT NOT NULL,
      proposal_sha256 TEXT NOT NULL, baseline_sha256 TEXT, patch_text TEXT NOT NULL, relative_file TEXT NOT NULL,
      before_file_path TEXT NOT NULL, proposal_snapshot_path TEXT NOT NULL,
      workspace_path TEXT NOT NULL, created_at TEXT NOT NULL, exposed_at TEXT,
      decision TEXT, confidence REAL, confidence_reason TEXT, planned_check TEXT,
      decision_at TEXT, UNIQUE(task_id, checkpoint_id)
    );
    CREATE TABLE IF NOT EXISTS forms (
      form_id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES sessions(participant_id),
      task_id TEXT, kind TEXT NOT NULL, version TEXT NOT NULL, answers_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(task_id),
      sequence INTEGER NOT NULL, event_json TEXT NOT NULL, UNIQUE(task_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS evidence (
      evidence_id TEXT PRIMARY KEY, task_id TEXT REFERENCES tasks(task_id),
      kind TEXT NOT NULL, path TEXT NOT NULL, sha256 TEXT, notes TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ingests (source_sha256 TEXT PRIMARY KEY, task_id TEXT NOT NULL, event_id TEXT NOT NULL);
  `);
  const reviewColumns = db.prepare('PRAGMA table_info(reviews)').all().map((row) => row.name);
  if (!reviewColumns.includes('baseline_sha256')) db.exec('ALTER TABLE reviews ADD COLUMN baseline_sha256 TEXT');
  const seed = db.prepare("SELECT value FROM meta WHERE key = 'assignment_seed'").get();
  if (!seed) db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('assignment_seed', randomBytes(24).toString('hex'));
  return { db, dir };
}

export function createSession(store, participantId) {
  if (!/^P[0-9]{3,}$/.test(participantId)) throw new Error('Use a pseudonym such as P014');
  if (store.db.prepare('SELECT 1 FROM sessions WHERE participant_id = ?').get(participantId)) {
    throw new Error('Participant ID already exists');
  }
  const ordinal = store.db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n;
  const seed = store.db.prepare("SELECT value FROM meta WHERE key = 'assignment_seed'").get().value;
  const assignment = assignmentFor(participantId, ordinal, seed);
  const sessionId = `S${String(ordinal + 1).padStart(3, '0')}`;
  const token = randomBytes(24).toString('hex');
  const createdAt = new Date().toISOString();
  store.db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?)').run(
    participantId, sessionId, token, ordinal, JSON.stringify(assignment), createdAt
  );
  const insertTask = store.db.prepare('INSERT INTO tasks (task_id, participant_id, project_id, condition, task_order, checkpoint_order_json, status_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const task of assignment.tasks) {
    insertTask.run(task.task_id, participantId, task.project_id, task.condition,
      task.task_order, JSON.stringify(task.checkpoint_order), JSON.stringify(task.candidate_status_by_checkpoint));
  }
  return { participant_id: participantId, session_id: sessionId, token, assignment };
}

export function sessionForToken(store, token) {
  return store.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
}

export function taskFor(store, taskId) {
  return store.db.prepare('SELECT * FROM tasks WHERE task_id = ?').get(taskId);
}

export function reviewFor(store, reviewId) {
  return store.db.prepare('SELECT * FROM reviews WHERE review_id = ?').get(reviewId);
}

export function logEvent(store, taskId, eventType, details = {}) {
  const task = taskFor(store, taskId);
  if (!task) throw new Error('Unknown task');
  const session = store.db.prepare('SELECT session_id FROM sessions WHERE participant_id = ?').get(task.participant_id);
  const sequence = store.db.prepare('SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM events WHERE task_id = ?').get(taskId).next;
  const event = {
    schema_version: '1.0.0',
    event_id: `${taskId}-E${String(sequence).padStart(6, '0')}`,
    timestamp_utc: new Date().toISOString(),
    participant_id: task.participant_id,
    session_id: session.session_id,
    task_id: taskId,
    project_id: task.project_id,
    condition: task.condition,
    sequence,
    source: details.source || 'collector',
    actor: details.actor || 'system',
    event_type: eventType,
    data: details.data || {}
  };
  for (const key of ['checkpoint_id', 'candidate_id', 'proposal_sha256', 'evidence_ref']) {
    if (details[key] !== undefined) event[key] = details[key];
  }
  store.db.prepare('INSERT INTO events VALUES (?, ?, ?, ?)').run(event.event_id, taskId, sequence, JSON.stringify(event));
  appendFileSync(join(store.dir, 'raw', 'events.jsonl'), JSON.stringify(event) + '\n', { mode: 0o600 });
  return event;
}

export function validateAnswers(kind, answers) {
  const form = forms[kind];
  if (!form || typeof answers !== 'object' || !answers || Array.isArray(answers)) throw new Error('Invalid form');
  const validIds = new Set(form.items.map((item) => item.id));
  for (const id of Object.keys(answers)) if (!validIds.has(id)) throw new Error(`Unexpected answer: ${id}`);
  for (const item of form.items) {
    const value = answers[item.id];
    if ((value === undefined || value === '') && item.required) throw new Error(`Required: ${item.id}`);
    if (value === undefined || value === '') continue;
    if (item.type === 'choice' && !item.options.includes(value)) throw new Error(`Invalid choice: ${item.id}`);
    if ((item.type === 'number' || item.type === 'scale') &&
        (typeof value !== 'number' || !Number.isFinite(value) || value < item.min || value > item.max)) {
      throw new Error(`Invalid number: ${item.id}`);
    }
    if (item.type === 'text' && (typeof value !== 'string' || value.length > item.maxLength)) {
      throw new Error(`Invalid text: ${item.id}`);
    }
  }
  return answers;
}

export function hashTree(directory) {
  const root = resolve(directory);
  if (!existsSync(root)) throw new Error('Snapshot directory missing');
  const hash = createHash('sha256');
  function walk(dir) {
    for (const name of readdirSync(dir).sort()) {
      if (['.git', 'node_modules', '.DS_Store', '.study-capture'].includes(name)) continue;
      const path = join(dir, name);
      const stat = lstatSync(path);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile()) {
        hash.update(relative(root, path)).update('\0').update(readFileSync(path)).update('\0');
      } else if (stat.isSymbolicLink()) {
        hash.update(relative(root, path)).update('\0link:').update(readlinkSync(path)).update('\0');
      }
    }
  }
  walk(root);
  return `sha256:${hash.digest('hex')}`;
}

export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
