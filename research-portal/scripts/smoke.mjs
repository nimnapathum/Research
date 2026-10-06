import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';

const root = 'http://127.0.0.1:3000';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const code = `P${Math.floor(900000 + Math.random() * 99999)}`;
const email = `smoke-owner-${code.toLowerCase()}@example.invalid`;
const password = randomBytes(18).toString('base64url');
let participantId;
let researcherId;
let ownerId;
async function call(path, options = {}, cookie = '') {
  const response = await fetch(`${root}${path}`, { ...options,
    headers: { ...(cookie ? { cookie } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${JSON.stringify(body)}`);
  return { response, body };
}
const json = (data) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
try {
  const salt = randomBytes(16).toString('hex');
  const key = await promisify(scryptCallback)(password, Buffer.from(salt, 'hex'), 64,
    { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  const inserted = await pool.query(`INSERT INTO users(email,password_hash,role)
    VALUES($1,$2,'researcher') RETURNING id`, [email, `scrypt:17:${salt}:${key.toString('hex')}`]);
  ownerId = inserted.rows[0].id;
  const researcherLogin = await call('/api/auth/login', json({ email, password }));
  const researcherCookie = researcherLogin.response.headers.get('set-cookie')?.split(';')[0];
  if (!researcherCookie) throw new Error('Researcher session cookie missing');
  const dashboard = await fetch(`${root}/dashboard`, { headers: { cookie: researcherCookie } });
  if (!dashboard.ok || !(await dashboard.text()).includes('Study operations')) throw new Error('Researcher dashboard failed');
  const library = await fetch(`${root}/researcher/research?doc=RQ.md`, { headers: { cookie: researcherCookie } });
  if (!library.ok || !(await library.text()).includes('Study documents')) throw new Error('Research document viewer failed');
  const colleague = await call('/api/backend/researcher/accounts', json({
    email: `researcher-${code.toLowerCase()}@example.invalid`, displayName: 'Smoke Test Supervisor'
  }), researcherCookie);
  researcherId = colleague.body.id;
  const colleagueLogin = await call('/api/auth/login', json({
    email: colleague.body.email, password: colleague.body.temporary_password
  }));
  const colleagueCookie = colleagueLogin.response.headers.get('set-cookie')?.split(';')[0];
  const colleagueAccounts = await call('/api/backend/researcher/accounts', {}, colleagueCookie);
  if (!colleagueAccounts.body.some((row) => row.id === researcherId)) throw new Error('New researcher permissions failed');
  const participant = await call('/api/backend/researcher/participants', json({
    email: `${code.toLowerCase()}@example.invalid`, participantCode: code,
    tasks: [
      { projectId: 'A', condition: 'acceleration', taskOrder: 1, externalTaskId: `${code}-T1`, checkpointOrder: ['Q1','Q2','F1','F2'] },
      { projectId: 'B', condition: 'exploration', taskOrder: 2, externalTaskId: `${code}-T2`, checkpointOrder: ['F2','F1','Q2','Q1'] }
    ]
  }), researcherCookie);
  participantId = participant.body.id;
  const participantLogin = await call('/api/auth/login',
    json({ email: `${code.toLowerCase()}@example.invalid`, password: participant.body.temporary_password }));
  const participantCookie = participantLogin.response.headers.get('set-cookie')?.split(';')[0];
  const denied = await fetch(`${root}/researcher/research?doc=RQ.md`, {
    headers: { cookie: participantCookie }, redirect: 'manual'
  });
  if (![302, 303, 307, 308].includes(denied.status) || !denied.headers.get('location')?.includes('/dashboard')) {
    throw new Error('Participant could access researcher document viewer');
  }
  const accountDenied = await fetch(`${root}/api/backend/researcher/accounts`, {
    headers: { cookie: participantCookie }
  });
  if (accountDenied.status !== 403) throw new Error('Participant could access researcher accounts');
  const page = await fetch(`${root}/dashboard`, { headers: { cookie: participantCookie } });
  if (!page.ok || !(await page.text()).includes('Your two tasks')) throw new Error('Participant dashboard failed');
  const assigned = await call('/api/backend/participant/dashboard', {}, participantCookie);
  if (assigned.body.tasks.length !== 2) throw new Error('Two task assignments were not returned');
  const pre = assigned.body.questionnaires.find((form) => form.stage === 'pre_task');
  if (!pre) throw new Error('Pre-task form not published');
  const answers = Object.fromEntries(pre.schema_json.items.map((item) => [item.id,
    item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'Smoke test' : item.min ?? 1]));
  await call('/api/backend/participant/responses', json({ questionnaireId: pre.id, answers }), participantCookie);
  const event = { event_id: `smoke-${code}`, event_type: 'agent_response',
    timestamp_utc: new Date().toISOString(), participant_id: code, task_id: `${code}-T1` };
  const imported = await call('/api/backend/participant/imports', json({ kind: 'events_json',
    filename: 'smoke.json', content: JSON.stringify([event]) }), participantCookie);
  if (imported.body.imported_count !== 1) throw new Error('IDE event did not import');
  const overview = await call('/api/backend/researcher/overview', {}, researcherCookie);
  if (overview.body.counts.events < 1) throw new Error('Overview missing imported event');
  const analytics = await call('/api/backend/researcher/analytics', {}, researcherCookie);
  if (!analytics.body.participantCoverage.some((row) => row.participant_code === code)) throw new Error('Analytics missing participant');
  console.log('PASS: research library access control, second researcher login, participant assignment/login/dashboard, pre-task response, IDE event import, analytics');
} finally {
  if (participantId) {
    await pool.query('DELETE FROM import_batches WHERE participant_id=$1', [participantId]);
    await pool.query('DELETE FROM users WHERE id=$1', [participantId]);
  }
  if (researcherId) await pool.query('DELETE FROM users WHERE id=$1', [researcherId]);
  if (ownerId) await pool.query('DELETE FROM users WHERE id=$1', [ownerId]);
  await pool.end();
}
