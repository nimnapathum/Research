import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';

const root = process.env.PORTAL_BASE_URL || 'http://127.0.0.1:3000';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const code = `P${Math.floor(900000 + Math.random() * 99999)}`;
const email = `smoke-owner-${code.toLowerCase()}@example.invalid`;
const password = randomBytes(18).toString('base64url');
let participantId;
let researcherId;
let ownerId;
let captureClient;
let captureFolder;
async function call(path, options = {}, cookie = '') {
  const response = await fetch(`${root}${path}`, { ...options,
    headers: { ...(cookie ? { cookie } : {}),
      ...(options.method && options.method !== 'GET' ? { origin: root } : {}),
      ...(options.headers || {}) } });
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
  const blockedOrigin = await fetch(`${root}/api/auth/login`, {
    ...json({ email, password }), headers: { 'content-type': 'application/json', origin: 'https://another-site.example' }
  });
  if (blockedOrigin.status !== 403) throw new Error('Cross-origin login request was not blocked');
  const researcherCookie = researcherLogin.response.headers.get('set-cookie')?.split(';')[0];
  if (!researcherCookie) throw new Error('Researcher session cookie missing');
  const dashboard = await fetch(`${root}/dashboard`, { headers: { cookie: researcherCookie } });
  if (!dashboard.ok || !(await dashboard.text()).includes('Study operations')) throw new Error('Researcher dashboard failed');
  const library = await fetch(`${root}/researcher/research?doc=RQ.md`, { headers: { cookie: researcherCookie } });
  if (!library.ok || !(await library.text()).includes('Study documents')) throw new Error('Research document viewer failed');
  const document = await call('/api/research/docs?doc=RQ.md', {}, researcherCookie);
  if (!document.body.source?.includes('RQ1')) throw new Error('Research document API did not return Markdown');
  const anonymousDocument = await fetch(`${root}/api/research/docs?doc=RQ.md`);
  if (anonymousDocument.status !== 401) throw new Error('Anonymous research document access was not blocked');
  const invalidDocument = await fetch(`${root}/api/research/docs?doc=../.env`, {
    headers: { cookie: researcherCookie }
  });
  if (invalidDocument.status !== 404) throw new Error('Research document path validation failed');
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
  const participantDocument = await fetch(`${root}/api/research/docs?doc=RQ.md`, {
    headers: { cookie: participantCookie }
  });
  if (participantDocument.status !== 403) throw new Error('Participant could access research document API');
  const accountDenied = await fetch(`${root}/api/backend/researcher/accounts`, {
    headers: { cookie: participantCookie }
  });
  if (accountDenied.status !== 403) throw new Error('Participant could access researcher accounts');
  const page = await fetch(`${root}/dashboard`, { headers: { cookie: participantCookie } });
  if (!page.ok || !(await page.text()).includes('Your two tasks')) throw new Error('Participant dashboard failed');
  const assigned = await call('/api/backend/participant/dashboard', {}, participantCookie);
  if (assigned.body.tasks.length !== 2) throw new Error('Two task assignments were not returned');
  const firstTask = assigned.body.tasks.find((task) => task.task_order === 1);
  const secondTask = assigned.body.tasks.find((task) => task.task_order === 2);
  const earlyDownload = await fetch(`${root}/api/participant/tasks/${firstTask.id}/starter`, {
    headers: { cookie: participantCookie }
  });
  if (earlyDownload.status !== 403) throw new Error('Starter ZIP opened before the pre-task form');
  if (process.env.CHECKPOINT_BRIDGE_ENABLED === '1') {
    const earlyRecorded = await fetch(`${root}/api/participant/tasks/${firstTask.id}/package`, {
      headers: { cookie: participantCookie }
    });
    if (earlyRecorded.status !== 403) throw new Error('Recorded ZIP opened before the pre-task form');
  }
  const pre = assigned.body.questionnaires.find((form) => form.stage === 'pre_task');
  if (!pre) throw new Error('Pre-task form not published');
  const answers = Object.fromEntries(pre.schema_json.items.map((item) => [item.id,
    item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'Smoke test' : item.min ?? 1]));
  await call('/api/backend/participant/responses', json({ questionnaireId: pre.id, answers }), participantCookie);
  const taskPage = await fetch(`${root}/participant/tasks/${firstTask.id}`, { headers: { cookie: participantCookie } });
  const taskHtml = await taskPage.text();
  if (!taskPage.ok || !taskHtml.includes('Task sheets') || !taskHtml.includes(firstTask.checkpoint_order[0]) ||
      !taskHtml.includes('Set up Antigravity capture') || !taskHtml.includes('Study client connected')) {
    throw new Error('Task sheet did not open after the pre-task form');
  }
  if (process.env.CHECKPOINT_BRIDGE_ENABLED === '1') {
    if (!taskHtml.includes('Download recorded-task ZIP')) throw new Error('Recorded ZIP link was not shown');
    const recorded = await fetch(`${root}/api/participant/tasks/${firstTask.id}/package`, {
      headers: { cookie: participantCookie }
    });
    const bytes = Buffer.from(await recorded.arrayBuffer());
    if (!recorded.ok || recorded.headers.get('content-type') !== 'application/zip' ||
        !bytes.includes(Buffer.from('study/setup.mjs')) || !bytes.includes(Buffer.from('study/client.mjs')) ||
        !bytes.includes(Buffer.from('study/CAPTURE_CONFIG.json'))) {
      throw new Error('Instrumented ZIP was not delivered to the assigned participant');
    }
    const capture = await call(`/api/participant/tasks/${firstTask.id}/capture-status`, {}, participantCookie);
    if (capture.body.connected !== false || !capture.body.task_url?.includes(firstTask.external_task_id)) {
      throw new Error('Capture status or private checkpoint link was wrong');
    }
    captureFolder = mkdtempSync(join(tmpdir(), 'portal-capture-smoke-'));
    const zipPath = join(captureFolder, 'task.zip');
    writeFileSync(zipPath, bytes);
    const unpacked = join(captureFolder, 'workspace');
    const unzip = spawnSync('unzip', ['-q', zipPath, '-d', unpacked], { encoding: 'utf8' });
    if (unzip.status !== 0) throw new Error(`Recorded ZIP could not be extracted: ${unzip.stderr}`);
    const setup = spawnSync(process.execPath, ['study/setup.mjs'], { cwd: unpacked, encoding: 'utf8' });
    if (setup.status !== 0) throw new Error(`Study hook setup failed: ${setup.stderr}`);
    captureClient = spawn(process.execPath, ['study/client.mjs'], { cwd: unpacked, stdio: 'ignore' });
    let connected = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise((done) => setTimeout(done, 500));
      const current = await call(`/api/participant/tasks/${firstTask.id}/capture-status`, {}, participantCookie);
      if (current.body.connected) { connected = true; break; }
    }
    if (!connected) throw new Error('Study client did not appear connected in the portal');
    const hook = spawnSync(process.execPath, ['.study-capture/hook.mjs'], { cwd: unpacked, encoding: 'utf8',
      input: JSON.stringify({ toolCall: { name: 'view_file', args: { AbsolutePath: join(unpacked, 'src/app.mjs') } },
        conversationId: 'smoke-test' }) });
    if (hook.status !== 0) throw new Error(`Study hook failed: ${hook.stderr}`);
    const observed = await call(`/api/participant/tasks/${firstTask.id}/capture-status`, {}, participantCookie);
    if (!observed.body.agent_capture_seen) throw new Error('Agent hook event did not appear in the portal');
    const anonymousRecorded = await fetch(`${root}/api/participant/tasks/${firstTask.id}/package`);
    if (anonymousRecorded.status !== 401) throw new Error('Anonymous recorded ZIP access was not blocked');
    const prematureSubmit = await fetch(`${root}/api/backend/participant/tasks/${firstTask.id}/status`, {
      method: 'PATCH', headers: { cookie: participantCookie, origin: root, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'submitted' })
    });
    if (prematureSubmit.status !== 400) throw new Error('Portal accepted task submission before final checkpoint code');
    const afterTask = assigned.body.questionnaires.find((form) => form.stage === 'after_task');
    const afterAnswers = Object.fromEntries(afterTask.schema_json.items.map((item) => [item.id,
      item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'Smoke test' : item.min ?? 1]));
    const earlyAfter = await fetch(`${root}/api/backend/participant/responses`, {
      ...json({ questionnaireId: afterTask.id, taskId: firstTask.id, answers: afterAnswers }),
      headers: { 'content-type': 'application/json', cookie: participantCookie, origin: root }
    });
    if (earlyAfter.status !== 400) throw new Error('After-task form accepted before final checkpoint code');
  }
  const download = await fetch(`${root}/api/participant/tasks/${firstTask.id}/starter`, {
    headers: { cookie: participantCookie }
  });
  if (!download.ok || download.headers.get('content-type') !== 'application/zip' ||
      !Buffer.from(await download.arrayBuffer()).includes(Buffer.from('study/START_HERE.md'))) {
    throw new Error('Assigned starter ZIP was not delivered');
  }
  const earlySecond = await fetch(`${root}/api/participant/tasks/${secondTask.id}/starter`, {
    headers: { cookie: participantCookie }
  });
  if (earlySecond.status !== 403) throw new Error('Task 2 ZIP opened too early');
  const unauthorizedZip = await fetch(`${root}/api/participant/tasks/${firstTask.id}/starter`);
  if (unauthorizedZip.status !== 401) throw new Error('Anonymous starter ZIP access was not blocked');
  const event = { event_id: `smoke-${code}`, event_type: 'agent_response',
    timestamp_utc: new Date().toISOString(), participant_id: code, task_id: `${code}-T1` };
  const imported = await call('/api/backend/participant/imports', json({ kind: 'events_json',
    filename: 'smoke.json', content: JSON.stringify([event]) }), participantCookie);
  if (imported.body.imported_count !== 1) throw new Error('IDE event did not import');
  const overview = await call('/api/backend/researcher/overview', {}, researcherCookie);
  if (overview.body.counts.events < 1) throw new Error('Overview missing imported event');
  const analytics = await call('/api/backend/researcher/analytics', {}, researcherCookie);
  if (!analytics.body.participantCoverage.some((row) => row.participant_code === code)) throw new Error('Analytics missing participant');
  console.log('PASS: research library access control, second researcher login, participant assignment/login/dashboard, pre-task task sheet and ZIP access, IDE event import, analytics');
} finally {
  captureClient?.kill('SIGTERM');
  if (captureFolder) rmSync(captureFolder, { recursive: true, force: true });
  if (participantId) {
    await pool.query('DELETE FROM import_batches WHERE participant_id=$1', [participantId]);
    await pool.query('DELETE FROM users WHERE id=$1', [participantId]);
  }
  if (researcherId) await pool.query('DELETE FROM users WHERE id=$1', [researcherId]);
  if (ownerId) await pool.query('DELETE FROM users WHERE id=$1', [ownerId]);
  await pool.end();
}
