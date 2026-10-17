import { randomBytes, randomInt, scrypt as scryptCallback } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import pg from 'pg';

// Disposable hosted check of researcher creation, the SQLite assignment bridge,
// participant login, and the two portal task rows. Run when no other account is
// being created, because the bridge can only cancel its newest reservation.
const root = process.env.PORTAL_BASE_URL || 'http://127.0.0.1:3000';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const password = randomBytes(18).toString('base64url');
const researcherName = `smoke_assignment_${randomInt(10_000_000, 100_000_000)}`;
let researcherId;
let participantCode;
let participantId;

async function request(path, options = {}, cookie = '') {
  const response = await fetch(`${root}${path}`, { ...options,
    headers: { ...(cookie ? { cookie } : {}), ...(options.method ? { origin: root } : {}), ...(options.headers || {}) } });
  return { response, body: await response.json().catch(() => ({})) };
}

try {
  const salt = randomBytes(16).toString('hex');
  const key = await promisify(scryptCallback)(password, Buffer.from(salt, 'hex'), 64,
    { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  researcherId = (await pool.query(`INSERT INTO users(username,password_hash,role)
    VALUES($1,$2,'researcher') RETURNING id`,
  [researcherName, `scrypt:17:${salt}:${key.toString('hex')}`])).rows[0].id;

  const login = await request('/api/auth/login', { method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: researcherName, password }) });
  const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
  if (!login.response.ok || !cookie) throw new Error('Researcher login failed');
  const created = await request('/api/backend/researcher/participants', { method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Synthetic assignment smoke' }) }, cookie);
  if (!created.response.ok) throw new Error(`Participant creation failed: ${JSON.stringify(created.body)}`);
  participantCode = created.body.participant_code;
  participantId = created.body.id;
  if (!/^P\d{8}$/.test(participantCode) || !created.body.temporary_password ||
      !Array.isArray(created.body.tasks) || created.body.tasks.length !== 2) {
    throw new Error('Portal returned an incomplete participant assignment');
  }
  const rows = (await pool.query(`SELECT external_task_id,project_id,condition,task_order,checkpoint_order
    FROM study_tasks WHERE participant_id=$1 ORDER BY task_order`, [participantId])).rows;
  if (rows.length !== 2 || rows.some((row, index) =>
    row.external_task_id !== `${participantCode}-T${index + 1}` ||
    row.project_id !== created.body.tasks[index].project_id ||
    row.condition !== created.body.tasks[index].condition ||
    JSON.stringify(row.checkpoint_order) !== JSON.stringify(created.body.tasks[index].checkpoint_order))) {
    throw new Error('Portal task rows differ from SQLite assignment');
  }
  const participantLogin = await request('/api/auth/login', { method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: created.body.username, password: created.body.temporary_password }) });
  if (!participantLogin.response.ok) throw new Error('New participant cannot log in');
  console.log(`PASS: researcher creation, SQLite assignment, two portal tasks and participant login (${participantCode})`);
} finally {
  let cancelled = !participantCode;
  if (participantCode) {
    const script = join(process.env.STUDY_MATERIALS_ROOT || join(process.cwd(), '../study-system'), 'app/portal-bridge.mjs');
    const result = spawnSync(process.execPath, [script], {
      input: JSON.stringify({ command: 'cancel-reservation', participant_code: participantCode }),
      encoding: 'utf8', timeout: 15_000
    });
    cancelled = result.status === 0;
    if (!cancelled) console.error(`Reconcile synthetic allocation ${participantCode}: ${result.stderr || result.error?.message}`);
  }
  if (participantId && cancelled) await pool.query('DELETE FROM users WHERE id=$1', [participantId]);
  if (researcherId) await pool.query('DELETE FROM users WHERE id=$1', [researcherId]);
  await pool.end();
  if (!cancelled) process.exitCode = 1;
}
