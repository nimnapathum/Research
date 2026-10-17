import { randomBytes, randomInt, scrypt as scryptCallback } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

const root = process.env.PORTAL_BASE_URL || 'http://127.0.0.1:3000';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const folder = mkdtempSync(join(tmpdir(), 'natural-portal-smoke-'));
const code = `P${randomInt(10_000_000, 100_000_000)}`;
const password = randomBytes(18).toString('base64url');
const evidenceRoot = process.env.STUDY_EVIDENCE_ROOT || join(process.cwd(), '.local-evidence');
const packageRoot = process.env.STUDY_PACKAGE_ROOT || join(process.cwd(), '.local-packages');
let userId;
let researcherId;
function zip(source, output) {
  const result = spawnSync('python3', ['-c', `
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
root = Path(sys.argv[1])
with ZipFile(sys.argv[2], 'w', ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(root))
`, source, output], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ZIP creation failed: ${result.error?.message || result.stderr || result.status}`);
}
async function request(path, options = {}, cookie = '') {
  const response = await fetch(`${root}${path}`, { ...options,
    headers: { ...(cookie ? { cookie } : {}), ...(options.method ? { origin: root } : {}), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}
const json = (value, method = 'POST') => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) });
try {
  const salt = randomBytes(16).toString('hex');
  const key = await promisify(scryptCallback)(password, Buffer.from(salt, 'hex'), 64,
    { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  const inserted = await pool.query(`INSERT INTO users(username,password_hash,role,participant_code)
    VALUES($1,$2,'participant',$3) RETURNING id`, [code.toLowerCase(), `scrypt:17:${salt}:${key.toString('hex')}`, code]);
  userId = inserted.rows[0].id;
  const researcherName = `smoke_${code.toLowerCase()}`;
  researcherId = (await pool.query(`INSERT INTO users(username,password_hash,role)
    VALUES($1,$2,'researcher') RETURNING id`, [researcherName, `scrypt:17:${salt}:${key.toString('hex')}`])).rows[0].id;
  const tasks = [];
  for (const [index, project, condition] of [[1, 'A', 'acceleration'], [2, 'B', 'exploration']]) {
    const result = await pool.query(`INSERT INTO study_tasks
      (participant_id,external_task_id,project_id,condition,task_order,checkpoint_order)
      VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING id,external_task_id`,
    [userId, `${code}-T${index}`, project, condition, index, JSON.stringify(['Q1','F1','Q2','F2'])]);
    tasks.push(result.rows[0]);
  }
  const login = await request('/api/auth/login', json({ username: code.toLowerCase(), password }));
  if (!login.response.ok) throw new Error(`Login failed: ${JSON.stringify(login.body)}`);
  const cookie = login.response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Session cookie missing');
  const early = await request(`/api/participant/tasks/${tasks[0].id}/package`, {}, cookie);
  if (early.response.status !== 403) throw new Error('Package opened before the pre-task form');
  const dashboard = await request('/api/backend/participant/dashboard', {}, cookie);
  const pre = dashboard.body.questionnaires.find((item) => item.stage === 'pre_task');
  const after = dashboard.body.questionnaires.find((item) => item.stage === 'after_task');
  const earlySecond = await request(`/api/backend/participant/tasks/${tasks[1].id}/status`, json({ status: 'in_progress' }, 'PATCH'), cookie);
  if (earlySecond.response.status !== 400) throw new Error('Task 2 could start before Task 1 completion');
  if (!pre || pre.schema_json.items.some((item) => ['sql_baseline','path_baseline'].includes(item.id))) {
    throw new Error('Natural pre-task form still primes SQL or path mechanisms');
  }
  const answers = Object.fromEntries(pre.schema_json.items.map((item) => [item.id,
    item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'smoke' : item.min ?? 1]));
  const savedPre = await request('/api/backend/participant/responses', json({ questionnaireId: pre.id, answers }), cookie);
  if (!savedPre.response.ok) throw new Error(`Pre-task response failed: ${JSON.stringify(savedPre.body)}`);
  const page = await fetch(`${root}/participant/tasks/${tasks[0].id}`, { headers: { cookie } });
  const html = await page.text();
  if (!page.ok || !html.includes('Download natural-task ZIP') ||
      !html.includes('The Resource catalogue stores learning resources and their text previews') ||
      !html.includes('node study/capture.mjs watch') ||
      !html.includes('node study/capture.mjs snapshot') ||
      !html.includes('node study/agent-observer.mjs setup') ||
      !html.includes('node study/agent-observer.mjs watch') ||
      !html.includes('node study/rate.mjs') || html.includes('Show proposed change') || html.includes('Upload events') || !html.includes('id="evidence"')) {
    throw new Error('Natural participant page was not served');
  }
  const legacyUpload = await fetch(`${root}/participant/upload`, { headers: { cookie }, redirect: 'manual' });
  if (![307, 308].includes(legacyUpload.status) || legacyUpload.headers.get('location') !== '/dashboard') {
    throw new Error('Natural participant can still open the legacy event upload page');
  }
  const download = await fetch(`${root}/api/participant/tasks/${tasks[0].id}/package`, { headers: { cookie } });
  const bytes = Buffer.from(await download.arrayBuffer());
  if (!download.ok || !download.headers.get('content-disposition')?.includes('-natural.zip') ||
      !bytes.includes(Buffer.from('study/capture.mjs')) || !bytes.includes(Buffer.from('study/rate.mjs')) ||
      !bytes.includes(Buffer.from('study/agent-observer.mjs')) ||
      bytes.includes(Buffer.from('study/WORK_ORIENTATION.md')) ||
      bytes.includes(Buffer.from('study/client.mjs')) || bytes.includes(Buffer.from('study/PARTICIPANT_WORKFLOW.md'))) {
    throw new Error('Natural ZIP contents were wrong');
  }
  const repeat = await fetch(`${root}/api/participant/tasks/${tasks[0].id}/package`, { headers: { cookie } });
  if (!bytes.equals(Buffer.from(await repeat.arrayBuffer())) ||
      !download.headers.get('x-study-protocol-version') || !download.headers.get('x-study-package-sha256')) {
    throw new Error('Frozen repeat download or protocol metadata failed');
  }
  const zipPath = join(folder, 'task.zip');
  writeFileSync(zipPath, bytes);
  const workspace = join(folder, code + '-T1-natural (1)');
  mkdirSync(workspace);
  const unpacked = spawnSync('python3', ['-c', `
from zipfile import ZipFile
import sys
with ZipFile(sys.argv[1]) as archive:
    archive.extractall(sys.argv[2])
`, zipPath, workspace], { encoding: 'utf8' });
  if (unpacked.status !== 0) throw new Error(`Natural ZIP could not be extracted: ${unpacked.error?.message || unpacked.stderr || unpacked.status}`);
  const final = join(folder, 'final');
  const snapshot = spawnSync(process.execPath, ['study/capture.mjs', 'snapshot', '.', final],
    { cwd: workspace, encoding: 'utf8' });
  if (snapshot.status !== 0) throw new Error(`Final snapshot failed: ${snapshot.stderr}`);
  const manifest = JSON.parse(readFileSync(join(final, 'SNAPSHOT_MANIFEST.json'), 'utf8'));
  if (manifest.workspace !== `${code}-T1`) throw new Error('Extracted folder name changed the task identity');
  const capture = join(folder, 'capture');
  const initial = spawnSync(process.execPath, ['study/capture.mjs', 'snapshot', '.', join(capture, 'S0001')],
    { cwd: workspace, encoding: 'utf8' });
  if (initial.status !== 0) throw new Error(`Capture snapshot failed: ${initial.stderr}`);
  writeFileSync(join(capture, 'CAPTURE_HEALTH.json'), JSON.stringify({ workspace: `${code}-T1`,
    protocol_version: manifest.protocol_version, status: 'stopped', snapshot_count: 1, errors: [] }));
  writeFileSync(join(folder, 'rating.json'), JSON.stringify({ participant_task_id: `${code}-T1`,
    protocol_version: manifest.protocol_version, final_snapshot_sha256: manifest.snapshot_sha256, sql_probability_pct: 50,
    path_probability_pct: 50, rated_at: new Date().toISOString() }));
  zip(capture, join(folder, 'capture.zip'));
  zip(final, join(folder, 'final.zip'));
  const premature = await request(`/api/backend/participant/tasks/${tasks[0].id}/status`,
    json({ status: 'submitted' }, 'PATCH'), cookie);
  if (premature.response.status !== 400) throw new Error('Task submitted without evidence');
  const files = [
    ['capture_zip', 'capture.zip'], ['capture_health', 'capture/CAPTURE_HEALTH.json'],
    ['final_zip', 'final.zip'], ['final_manifest', 'final/SNAPSHOT_MANIFEST.json'],
    ['rating_json', 'rating.json']
  ];
  for (const [kind, name] of files) {
    const path = join(folder, name);
    const response = await request(`/api/participant/tasks/${tasks[0].id}/evidence?kind=${kind}`,
      { method: 'PUT', headers: { 'x-filename': encodeURIComponent(name) }, body: readFileSync(path) }, cookie);
    if (!response.response.ok || !/^[a-f0-9]{64}$/.test(response.body.sha256)) {
      throw new Error(`${kind} receipt failed: ${JSON.stringify(response.body)}`);
    }
  }
  const incomplete = await request(`/api/participant/tasks/${tasks[0].id}/evidence`, {}, cookie);
  if (incomplete.body.ready || !incomplete.body.missing.includes('agent_transcript')) {
    throw new Error('Incomplete natural evidence was accepted');
  }
  if (!incomplete.body.rating_ready || !after) throw new Error('After-task form unavailable after final rating upload');
  const afterAnswers = Object.fromEntries(after.schema_json.items.map((item) => [item.id,
    item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'smoke' : item.min ?? 1]));
  const afterResponse = await request('/api/backend/participant/responses', json({ questionnaireId: after.id,
    taskId: tasks[0].id, answers: afterAnswers }), cookie);
  if (!afterResponse.response.ok) throw new Error(`After-task form blocked by unfinished media upload: ${JSON.stringify(afterResponse.body)}`);
  const stamp = new Date().toISOString();
  const observerRecords = [
    { kind: 'study_agent_capture', task_id: `${code}-T1`, protocol_version: manifest.protocol_version },
    { kind: 'hook_event', task_id: `${code}-T1`, conversation_id: 'synthetic', observed_at_utc: stamp, event: 'session_start' },
    { kind: 'transcript_record', task_id: `${code}-T1`, conversation_id: 'synthetic', observed_at_utc: stamp,
      raw: { role: 'user', content: 'Synthetic observer upload check' } },
    { kind: 'capture_health', task_id: `${code}-T1`, protocol_version: manifest.protocol_version,
      status: 'stopped', transcript_records: 1, hook_events: 1, conversations: 1, errors: [] }
  ];
  const invalidObserver = await request(`/api/participant/tasks/${tasks[0].id}/evidence?kind=agent_transcript`,
    { method: 'PUT', headers: { 'x-filename': 'AGENT_TRANSCRIPT.jsonl' },
      body: observerRecords.slice(0, -1).map((row) => JSON.stringify(row)).join('\n') + '\n' }, cookie);
  if (invalidObserver.response.status !== 400) throw new Error('Incomplete observer export was accepted');
  const agentText = observerRecords.map((row) => JSON.stringify(row)).join('\n') + '\n';
  const agentUpload = await request(`/api/participant/tasks/${tasks[0].id}/evidence?kind=agent_transcript`,
    { method: 'PUT', headers: { 'x-filename': 'AGENT_TRANSCRIPT.jsonl' }, body: agentText }, cookie);
  if (!agentUpload.response.ok) throw new Error(`Agent transcript receipt failed: ${JSON.stringify(agentUpload.body)}`);
  const rejectedVideo = await request(`/api/participant/tasks/${tasks[0].id}/evidence?kind=screen_recording`,
    { method: 'PUT', headers: { 'x-filename': 'video.txt' }, body: 'no participant video' }, cookie);
  if (rejectedVideo.response.status !== 400) throw new Error('Participant video upload was not disabled');
  const complete = await request(`/api/participant/tasks/${tasks[0].id}/evidence`, {}, cookie);
  if (!complete.body.ready) throw new Error(`Complete evidence was not recognized: ${JSON.stringify(complete.body)}`);
  if (complete.body.agent_capture?.format !== 'study_observer' || complete.body.agent_capture.transcript_records !== 1) {
    throw new Error('Observer capture receipt summary missing');
  }
  const privateFile = `/api/researcher/evidence/${code}/${code}-T1/final_manifest`;
  const participantDenied = await fetch(`${root}${privateFile}`, { headers: { cookie } });
  if (participantDenied.status !== 403) throw new Error('Participant could download researcher evidence');
  const researcherLogin = await request('/api/auth/login', json({ username: researcherName, password }));
  const researcherCookie = researcherLogin.response.headers.get('set-cookie')?.split(';')[0];
  if (!researcherLogin.response.ok || !researcherCookie) throw new Error('Synthetic researcher login failed');
  const evidencePage = await fetch(`${root}/researcher/evidence`, { headers: { cookie: researcherCookie } });
  if (!evidencePage.ok || !(await evidencePage.text()).includes(code)) {
    throw new Error('Researcher evidence page did not show the uploaded task');
  }
  const recording = await request(`/api/backend/researcher/recordings/${code}`,
    json({ driveUrl: `https://drive.google.com/file/d/smoke-${code}/view`, label: 'Synthetic link', notes: 'Task 1 00:00' }), researcherCookie);
  if (!recording.response.ok) throw new Error(`Researcher recording link failed: ${JSON.stringify(recording.body)}`);
  const links = await request('/api/backend/researcher/recordings', {}, researcherCookie);
  if (!links.response.ok || !links.body.some((row) => row.id === recording.body.id)) throw new Error('Recording link not listed');
  const reviewPage = await fetch(`${root}/researcher/evidence/${code}/${code}-T1`, { headers: { cookie: researcherCookie } });
  if (!reviewPage.ok || !(await reviewPage.text()).includes('Initial to final code')) throw new Error('Code inspection page unavailable');
  const retrieved = await fetch(`${root}${privateFile}`, { headers: { cookie: researcherCookie } });
  if (!retrieved.ok || retrieved.headers.get('content-disposition')?.includes('attachment') !== true ||
      !Buffer.from(await retrieved.arrayBuffer()).equals(readFileSync(join(final, 'SNAPSHOT_MANIFEST.json')))) {
    throw new Error('Researcher could not retrieve the exact uploaded manifest');
  }
  const submitted = await request(`/api/backend/participant/tasks/${tasks[0].id}/status`,
    json({ status: 'submitted' }, 'PATCH'), cookie);
  if (!submitted.response.ok) throw new Error(`Natural task submission failed: ${JSON.stringify(submitted.body)}`);
  const reopening = await request(`/api/backend/participant/tasks/${tasks[0].id}/status`,
    json({ status: 'in_progress' }, 'PATCH'), cookie);
  if (reopening.response.status !== 400) throw new Error('Submitted task could be reopened without a correction record');
  const secondStart = await request(`/api/backend/participant/tasks/${tasks[1].id}/status`,
    json({ status: 'in_progress' }, 'PATCH'), cookie);
  if (!secondStart.response.ok) throw new Error('Task 2 did not unlock after Task 1 evidence and form');
  const secondDownload = await fetch(`${root}/api/participant/tasks/${tasks[1].id}/package`, { headers: { cookie } });
  if (!secondDownload.ok || !secondDownload.headers.get('content-disposition')?.includes(`${code}-T2-natural.zip`)) {
    throw new Error('Task 2 natural package unavailable');
  }
  const secondPage = await fetch(`${root}/participant/tasks/${tasks[1].id}`, { headers: { cookie } });
  if (!secondPage.ok || !(await secondPage.text()).includes('The Support archive stores support tickets and their text attachments')) {
    throw new Error('Plain-language Support archive task brief unavailable');
  }
  const secondZip = join(folder, 'task2.zip');
  writeFileSync(secondZip, Buffer.from(await secondDownload.arrayBuffer()));
  const secondWorkspace = join(folder, `${code}-T2-natural`);
  mkdirSync(secondWorkspace);
  const secondUnpack = spawnSync('python3', ['-c', `
from zipfile import ZipFile
import sys
with ZipFile(sys.argv[1]) as archive:
    archive.extractall(sys.argv[2])
`, secondZip, secondWorkspace], { encoding: 'utf8' });
  if (secondUnpack.status !== 0) throw new Error(`Task 2 ZIP failed: ${secondUnpack.stderr}`);
  const secondFinal = join(folder, 'final2');
  const secondSnapshot = spawnSync(process.execPath, ['study/capture.mjs', 'snapshot', '.', secondFinal],
    { cwd: secondWorkspace, encoding: 'utf8' });
  if (secondSnapshot.status !== 0) throw new Error(`Task 2 snapshot failed: ${secondSnapshot.stderr}`);
  const secondManifest = JSON.parse(readFileSync(join(secondFinal, 'SNAPSHOT_MANIFEST.json'), 'utf8'));
  if (secondManifest.workspace !== `${code}-T2`) throw new Error('Task 2 snapshot identity mismatch');
  const secondCapture = join(folder, 'capture2');
  const secondInitial = spawnSync(process.execPath, ['study/capture.mjs', 'snapshot', '.', join(secondCapture, 'S0001')],
    { cwd: secondWorkspace, encoding: 'utf8' });
  if (secondInitial.status !== 0) throw new Error(`Task 2 capture failed: ${secondInitial.stderr}`);
  writeFileSync(join(secondCapture, 'CAPTURE_HEALTH.json'), JSON.stringify({ workspace: `${code}-T2`,
    protocol_version: secondManifest.protocol_version, status: 'stopped', snapshot_count: 1, errors: [] }));
  const secondRating = join(folder, 'rating2.json');
  writeFileSync(secondRating, JSON.stringify({ participant_task_id: `${code}-T2`,
    protocol_version: secondManifest.protocol_version, final_snapshot_sha256: secondManifest.snapshot_sha256,
    sql_probability_pct: 50, path_probability_pct: 50, rated_at: new Date().toISOString() }));
  zip(secondCapture, join(folder, 'capture2.zip'));
  zip(secondFinal, join(folder, 'final2.zip'));
  const secondFiles = [
    ['capture_zip', join(folder, 'capture2.zip')],
    ['capture_health', join(secondCapture, 'CAPTURE_HEALTH.json')],
    ['final_zip', join(folder, 'final2.zip')],
    ['final_manifest', join(secondFinal, 'SNAPSHOT_MANIFEST.json')],
    ['rating_json', secondRating]
  ];
  for (const [kind, path] of secondFiles) {
    const response = await request(`/api/participant/tasks/${tasks[1].id}/evidence?kind=${kind}`,
      { method: 'PUT', headers: { 'x-filename': encodeURIComponent(path.split('/').at(-1)) },
        body: readFileSync(path) }, cookie);
    if (!response.response.ok) throw new Error(`Task 2 ${kind} failed: ${JSON.stringify(response.body)}`);
  }
  const secondAfter = await request('/api/backend/participant/responses', json({ questionnaireId: after.id,
    taskId: tasks[1].id, answers: afterAnswers }), cookie);
  if (!secondAfter.response.ok) throw new Error(`Task 2 after-task form failed: ${JSON.stringify(secondAfter.body)}`);
  const secondObserver = observerRecords.map((row) => ({ ...row, task_id: `${code}-T2` }))
    .map((row) => JSON.stringify(row)).join('\n') + '\n';
  const secondAgent = await request(`/api/participant/tasks/${tasks[1].id}/evidence?kind=agent_transcript`,
    { method: 'PUT', headers: { 'x-filename': 'AGENT_TRANSCRIPT.jsonl' }, body: secondObserver }, cookie);
  if (!secondAgent.response.ok) throw new Error(`Task 2 agent transcript failed: ${JSON.stringify(secondAgent.body)}`);
  const secondSubmitted = await request(`/api/backend/participant/tasks/${tasks[1].id}/status`,
    json({ status: 'submitted' }, 'PATCH'), cookie);
  if (!secondSubmitted.response.ok) throw new Error(`Task 2 submission failed: ${JSON.stringify(secondSubmitted.body)}`);
  const afterBoth = dashboard.body.questionnaires.find((item) => item.stage === 'after_both');
  if (!afterBoth) throw new Error('Final session form unavailable');
  const finalAnswers = Object.fromEntries(afterBoth.schema_json.items.map((item) => [item.id,
    item.type === 'choice' ? item.options[0] : item.type === 'text' ? 'smoke' : item.min ?? 1]));
  const finalForm = await request('/api/backend/participant/responses', json({ questionnaireId: afterBoth.id,
    answers: finalAnswers }), cookie);
  if (!finalForm.response.ok) throw new Error(`Final session form failed: ${JSON.stringify(finalForm.body)}`);
  const secondAudited = spawnSync('python3', ['../study-system/analysis/audit_natural_evidence.py',
    join(evidenceRoot, code, `${code}-T2`)], { encoding: 'utf8' });
  if (secondAudited.status !== 0) throw new Error(`Task 2 archive/hash audit failed: ${secondAudited.stdout}${secondAudited.stderr}`);
  const audited = spawnSync('python3', ['../study-system/analysis/audit_natural_evidence.py',
    join(evidenceRoot, code, `${code}-T1`)], { encoding: 'utf8' });
  if (audited.status !== 0) throw new Error(`Received archive/hash audit failed: ${audited.stdout}${audited.stderr}`);
  console.log(`PASS: natural page/commands, frozen ZIPs, six receipts per task, Drive link, code inspection, archive/hash audit, both submissions and final form (${code})`);
} finally {
  if (userId) await pool.query('DELETE FROM users WHERE id=$1', [userId]);
  if (researcherId) await pool.query('DELETE FROM users WHERE id=$1', [researcherId]);
  await pool.end();
  if (userId) {
    rmSync(join(evidenceRoot, code), { recursive: true, force: true });
    for (const index of [1, 2]) rmSync(join(packageRoot, `${code}-T${index}.json`), { force: true });
  }
  rmSync(folder, { recursive: true, force: true });
}
