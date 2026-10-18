import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const portal = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidence = mkdtempSync(join(tmpdir(), 'natural-analytics-ui-'));
const code = 'P12345678';
const task = `${code}-T1`;
const task2 = `${code}-T2`;
const otherHash = `sha256:${'b'.repeat(64)}`;
const folder = join(evidence, code, task);
mkdirSync(folder, { recursive: true });
const zipFixture = spawnSync('python3', ['-c', `
import hashlib, json, sys, zipfile
from pathlib import Path
folder, task = Path(sys.argv[1]), sys.argv[2]
path = 'src/example.mjs'
def manifest(content, clock):
    tree = hashlib.sha256(path.encode() + b'\\0file\\0' + content + b'\\0').hexdigest()
    return {'workspace': task, 'protocol_version': 'natural-test', 'captured_at': clock,
            'snapshot_sha256': 'sha256:' + tree,
            'files': [{'path': path, 'sha256': hashlib.sha256(content).hexdigest()}]}
first = b'export const value = 1;\\n'
last = b'export const value = 2;\\n'
with zipfile.ZipFile(folder / 'capture_zip.data', 'w') as archive:
    for index, content in enumerate([first, last], 1):
        prefix = f'S{index:04d}/'
        archive.writestr(prefix + path, content)
        archive.writestr(prefix + 'SNAPSHOT_MANIFEST.json', json.dumps(manifest(content, f'2026-10-18T00:00:0{index}Z')))
with zipfile.ZipFile(folder / 'final_zip.data', 'w') as archive:
    archive.writestr(path, last)
    archive.writestr('SNAPSHOT_MANIFEST.json', json.dumps(manifest(last, '2026-10-18T00:01:00Z')))
print(json.dumps({'final_hash': manifest(last, '')['snapshot_sha256']}))
`, folder, task], { encoding: 'utf8' });
if (zipFixture.status !== 0) throw new Error(`Code fixture failed: ${zipFixture.stderr}`);
const hash = JSON.parse(zipFixture.stdout).final_hash;
for (const kind of ['capture_zip', 'final_zip']) {
  const bytes = readFileSync(join(folder, `${kind}.data`));
  writeFileSync(join(folder, `${kind}.receipt.json`), JSON.stringify({ task_id: task, kind,
    size_bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }));
}
for (const [kind, value] of [
  ['final_manifest', { workspace: task, protocol_version: 'natural-test', snapshot_sha256: hash }],
  ['rating_json', { participant_task_id: task, protocol_version: 'natural-test', final_snapshot_sha256: hash,
    sql_probability_pct: 90, path_probability_pct: 20 }],
  ['capture_health', { workspace: task, protocol_version: 'natural-test', status: 'stopped',
    snapshot_count: 2, errors: [] }]
]) {
  const content = JSON.stringify(value);
  writeFileSync(join(folder, `${kind}.data`), content);
  writeFileSync(join(folder, `${kind}.receipt.json`), JSON.stringify({ task_id: task, kind,
    size_bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') }));
}
const secondFolder = join(evidence, code, task2);
mkdirSync(secondFolder, { recursive: true });
for (const [kind, value] of [
  ['final_manifest', { workspace: task2, protocol_version: 'natural-test', snapshot_sha256: otherHash }],
  ['rating_json', { participant_task_id: task2, protocol_version: 'natural-test', final_snapshot_sha256: hash,
    sql_probability_pct: 99, path_probability_pct: 99 }]
]) {
  const content = JSON.stringify(value);
  writeFileSync(join(secondFolder, `${kind}.data`), content);
  writeFileSync(join(secondFolder, `${kind}.receipt.json`), JSON.stringify({ task_id: task2, kind,
    size_bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') }));
}
const participant = { id: 'person-1', participant_code: code, study_phase: 'pilot' };
const tasks = [
  { id: 'task-1', participant_id: participant.id, external_task_id: task, project_id: 'A',
    condition: 'acceleration', task_order: 1, status: 'submitted' },
  { id: 'task-2', participant_id: participant.id, external_task_id: task2, project_id: 'B',
    condition: 'exploration', task_order: 2, status: 'submitted' }
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
      !overviewHtml.includes('0.010') || !overviewHtml.includes('target_secure') ||
      !overviewHtml.includes('Confidence against assessed security') ||
      !overviewHtml.includes('Code change activity from submitted ZIPs') ||
      !overviewHtml.includes('+1 / −1')) {
    throw new Error('Natural cohort analysis did not render synthetic confidence and reviewed security');
  }
  const person = await fetch(`${base}/researcher/analytics/${code}`, { headers: { cookie: 'study_sid=researcher' } });
  const personHtml = await person.text();
  if (!person.ok || !personHtml.includes('Participant analysis') || !personHtml.includes('Meet recording') ||
      !personHtml.includes('0.010') || !personHtml.includes('source files differ') ||
      !personHtml.includes('lines added'))
    throw new Error('Participant drill-down did not render computed code changes');
  const coding = new FormData();
  coding.set('phase', 'pilot');
  const codedCsv = {
    session_log: `participant_id,task_id,study_phase\n${code},${task},pilot\n${code},${task2},pilot\n`,
    coding_status: `participant_id,task_id,mode_status,checks_status,exposure_status,interview_status,resolved_by,evidence_ref\n${code},${task},complete,complete,complete,complete,R1,video:T1\n${code},${task2},complete,complete,complete,complete,R1,video:T2\n`,
    episodes: `participant_id,task_id,episode_id,coder_id,start_seconds,end_seconds,mode,active_or_waiting,trace_ref\n${code},${task},E1,R1,0,10,acceleration,active,video:T1\n${code},${task2},E1,R1,0,10,exploration,active,video:T2\n`,
    checks: `participant_id,task_id,change_id,check_id,coder_id,time_start_seconds,time_end_seconds,actor,vulnerability_class,category,security_purpose,timing_relative_to_integration,result_reviewed,issue_identified,evidence_ref\n${code},${task},C1,H1,R1,2,3,participant,sql,attack_test,yes,after_application_before_continuation,yes,no,video:T1\n`,
    exposures: 'participant_id,task_id,change_id,vulnerability_class,origin_status,exposure_confirmed,intentional_repair,final_survival,evidence_ref\n'
  };
  for (const [name, content] of Object.entries(codedCsv)) coding.set(name, new File([content], `${name}.csv`, { type: 'text/csv' }));
  const codedResponse = await fetch(`${base}/api/researcher/natural-coded-report`, { method: 'POST',
    headers: { cookie: 'study_sid=researcher' }, body: coding });
  if (!codedResponse.ok) throw new Error(`Coded report import failed: ${await codedResponse.text()}`);
  const codedDenied = await fetch(`${base}/api/researcher/natural-coded-report`, { method: 'POST',
    headers: { cookie: 'study_sid=participant' } });
  if (codedDenied.status !== 403) throw new Error('Participant could import researcher coding');
  const codedPage = await fetch(`${base}/researcher/analytics?phase=pilot`, { headers: { cookie: 'study_sid=researcher' } });
  const codedHtml = await codedPage.text();
  if (!codedPage.ok || !codedHtml.includes('Observed mode by assigned condition') ||
      !codedHtml.includes('Human-reviewed security checks') || !codedHtml.includes('after application, before continuation')) {
    throw new Error(`Coded results did not render on the phase dashboard: status=${codedPage.status}, mode=${codedHtml.includes('Observed mode by assigned condition')}, checks=${codedHtml.includes('Human-reviewed security checks')}, after=${codedHtml.includes('after agent application')}, stale=${codedHtml.includes('out of date')}`);
  }
  const exportResponse = await fetch(`${base}/api/researcher/natural-features?phase=pilot`,
    { headers: { cookie: 'study_sid=researcher' } });
  const exported = await exportResponse.text();
  if (!exportResponse.ok || !exported.includes('"participant_id","task_id"') ||
      !exported.includes('"technical_failure"') || exported.includes('"99"') ||
      exported.trim().split('\n').length !== 5) {
    throw new Error('Phase feature CSV did not preserve pending and mismatched rating cases');
  }
  const csvPath = join(evidence, 'features.csv');
  writeFileSync(csvPath, exported);
  const summary = spawnSync('python3', ['../study-system/analysis/natural_summary.py', csvPath],
    { cwd: portal, encoding: 'utf8' });
  if (summary.status !== 0 || JSON.parse(summary.stdout).recorded_feature_count !== 4) {
    throw new Error(`Exported feature CSV could not be analysed: ${summary.stderr}`);
  }
  const wrongPhase = await fetch(`${base}/api/researcher/natural-features?phase=all`,
    { headers: { cookie: 'study_sid=researcher' } });
  if (wrongPhase.status !== 400) throw new Error('Feature export accepted an invalid phase');
  const deniedExport = await fetch(`${base}/api/researcher/natural-features?phase=pilot`,
    { headers: { cookie: 'study_sid=participant' } });
  if (deniedExport.status !== 403) throw new Error('Participant could download researcher analysis CSV');
  const blocked = await fetch(`${base}/researcher/analytics?phase=pilot`, { headers: { cookie: 'study_sid=participant' }, redirect: 'manual' });
  if (![307, 308].includes(blocked.status)) throw new Error('Participant could open researcher analytics');
  console.log('PASS: natural cohort and participant analysis render with hash-linked reviewed outcomes');
} finally {
  web.kill('SIGTERM'); api.close(); rmSync(evidence, { recursive: true, force: true });
}
