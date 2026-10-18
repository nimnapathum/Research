import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const portal = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidence = mkdtempSync(join(tmpdir(), 'natural-analytics-ui-'));
const code = 'P12345678';
const task = `${code}-T1`;
const hash = `sha256:${'a'.repeat(64)}`;
const folder = join(evidence, code, task);
mkdirSync(folder, { recursive: true });
for (const [kind, value] of [
  ['final_manifest', { workspace: task, protocol_version: 'natural-test', snapshot_sha256: hash }],
  ['rating_json', { participant_task_id: task, protocol_version: 'natural-test', final_snapshot_sha256: hash,
    sql_probability_pct: 90, path_probability_pct: 20 }],
  ['capture_health', { workspace: task, protocol_version: 'natural-test', status: 'stopped',
    snapshot_count: 3, errors: [] }]
]) {
  const content = JSON.stringify(value);
  writeFileSync(join(folder, `${kind}.data`), content);
  writeFileSync(join(folder, `${kind}.receipt.json`), JSON.stringify({ task_id: task, kind,
    size_bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') }));
}
const participant = { id: 'person-1', participant_code: code, study_phase: 'pilot' };
const tasks = [
  { id: 'task-1', participant_id: participant.id, external_task_id: task, project_id: 'A',
    condition: 'acceleration', task_order: 1, status: 'submitted' },
  { id: 'task-2', participant_id: participant.id, external_task_id: `${code}-T2`, project_id: 'B',
    condition: 'exploration', task_order: 2, status: 'not_started' }
];
const api = createServer((request, response) => {
  const role = request.headers.authorization === 'Bearer researcher' ? 'researcher' :
    request.headers.authorization === 'Bearer participant' ? 'participant' : null;
  if (!role) { response.writeHead(401, { 'content-type': 'application/json' }); response.end('{}'); return; }
  let body;
  if (request.url === '/auth/me') body = { id: 'user-1', role, participant_code: role === 'participant' ? code : null };
  else if (role !== 'researcher') { response.writeHead(403, { 'content-type': 'application/json' }); response.end('{}'); return; }
  else if (request.url === '/researcher/participants') body = { participants: [participant], tasks };
  else if (request.url === '/researcher/responses') body = [{ id: 'form-1', participant_code: code,
    stage: 'after_task', external_task_id: task, answers: { known_next_step: 6, sought_options: 2 },
    submitted_at: '2026-10-18T00:00:00Z' }];
  else if (request.url === '/researcher/recordings') body = [{ id: 'video-1', participant_code: code,
    drive_url: 'https://drive.google.com/file/d/synthetic/view', label: 'Meet recording', notes: 'T1 00:00' }];
  else if (request.url === '/researcher/natural-assessments') body = [{ id: 'assessment-1', task_id: task,
    participant_code: code, weakness_class: 'sql', final_snapshot_sha256: hash,
    review_data: [], resolved_security: 'target_secure', resolved_functionality: 'pass',
    resolution_note: 'Synthetic review', created_at: '2026-10-18T00:00:00Z' }];
  else { response.writeHead(404, { 'content-type': 'application/json' }); response.end('{}'); return; }
  response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify(body));
});
await new Promise((done) => api.listen(0, '127.0.0.1', done));
const apiPort = api.address().port;
const webPort = 32000 + Math.floor(Math.random() * 10000);
const web = spawn(process.execPath, ['../../node_modules/next/dist/bin/next', 'start',
  '--hostname', '127.0.0.1', '--port', String(webPort)], {
  cwd: resolve(portal, 'apps/web'),
  env: { ...process.env, API_INTERNAL_URL: `http://127.0.0.1:${apiPort}`,
    STUDY_PROTOCOL: 'natural', STUDY_EVIDENCE_ROOT: evidence, NODE_ENV: 'production' },
  stdio: 'ignore'
});
const base = `http://127.0.0.1:${webPort}`;
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (web.exitCode !== null) throw new Error('Next.js stopped before becoming ready');
    try { if ((await fetch(`${base}/login`)).ok) { ready = true; break; } } catch {}
    await delay(200);
  }
  if (!ready) throw new Error('Next.js did not become ready');
  const overview = await fetch(`${base}/researcher/analytics?phase=pilot`, { headers: { cookie: 'study_sid=researcher' } });
  const overviewHtml = await overview.text();
  if (!overview.ok || !overviewHtml.includes('Study analysis') || !overviewHtml.includes(code) ||
      !overviewHtml.includes('0.010') || !overviewHtml.includes('target_secure')) {
    throw new Error('Natural cohort analysis did not render synthetic confidence and reviewed security');
  }
  const person = await fetch(`${base}/researcher/analytics/${code}`, { headers: { cookie: 'study_sid=researcher' } });
  const personHtml = await person.text();
  if (!person.ok || !personHtml.includes('Participant analysis') || !personHtml.includes('Meet recording') ||
      !personHtml.includes('0.010')) throw new Error('Participant drill-down did not render');
  const blocked = await fetch(`${base}/researcher/analytics?phase=pilot`, { headers: { cookie: 'study_sid=participant' }, redirect: 'manual' });
  if (![307, 308].includes(blocked.status)) throw new Error('Participant could open researcher analytics');
  console.log('PASS: natural cohort and participant analysis render with hash-linked reviewed outcomes');
} finally {
  web.kill('SIGTERM'); api.close(); rmSync(evidence, { recursive: true, force: true });
}
