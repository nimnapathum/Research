import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(workspace, 'study/CAPTURE_CONFIG.json'), 'utf8'));
const server = new URL(config.collector_url);
if (server.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(server.hostname)) {
  throw new Error('The study server must use HTTPS outside localhost');
}
const token = config.token, taskId = config.task_id;
const ignored = new Set(['.git', 'node_modules', '.DS_Store', '.study-capture']);
const fallbackNames = ['hook-fallback.jsonl', 'extension-fallback.jsonl', 'pointer-summary.jsonl'];
const transferOffset = new Map(fallbackNames.map((name) => [name, 0]));
function state() {
  const files = [], hash = createHash('sha256');
  let bytes = 0;
  function walk(folder) {
    for (const name of readdirSync(folder).sort()) {
      if (ignored.has(name)) continue;
      const path = join(folder, name), stat = lstatSync(path);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile()) {
        const data = readFileSync(path), nameInPackage = relative(workspace, path).replaceAll('\\', '/');
        bytes += data.length;
        if (bytes > 2_000_000 || files.length > 300) throw new Error('Workspace is too large for study capture');
        hash.update(nameInPackage).update('\0').update(data).update('\0');
        files.push({ path: nameInPackage, content_base64: data.toString('base64') });
      } else throw new Error('Symlinks and special files are not supported in the study workspace');
    }
  }
  walk(workspace);
  return { files, sha256: `sha256:${hash.digest('hex')}` };
}
async function request(path, method = 'GET', body = undefined) {
  const url = new URL(path, server);
  const response = await fetch(url, {
    method, headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify({ token, task_id: taskId, ...body }) : undefined,
    signal: AbortSignal.timeout(10000)
  });
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: ${value.error || response.status}`);
  return value;
}
const qs = `token=${encodeURIComponent(token)}&task_id=${encodeURIComponent(taskId)}`;
let lastHeartbeat = 0;
let lastTransfer = 0;
async function sendFallback() {
  for (const name of fallbackNames) {
    const path = join(workspace, '.study-capture', name);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    const start = transferOffset.get(name) || 0;
    if (start >= lines.length) continue;
    const batch = lines.slice(start, start + 20).map((line) => ({ name, record: JSON.parse(line) }));
    await request('/api/client/ingest-telemetry', 'POST', { rows: batch });
    transferOffset.set(name, start + batch.length);
  }
}
console.log(`Connected study client for ${taskId}. Keep this terminal open while coding.`);
while (true) {
  try {
    if (Date.now() - lastTransfer > 5000) {
      try { await sendFallback(); }
      catch (error) { console.error(`Optional telemetry upload: ${error.message}`); }
      lastTransfer = Date.now();
    }
    if (Date.now() - lastHeartbeat > 5000) {
      await request('/api/client/heartbeat', 'POST', { workspace_sha256: state().sha256 });
      lastHeartbeat = Date.now();
    }
    const job = await request(`/api/client/job?${qs}`);
    if (job.status === 'requested' || job.status === 'final_requested') {
      const current = state();
      await request(job.status === 'requested' ? '/api/client/prepare' : '/api/client/finalize',
        'POST', { job_id: job.job_id, ...current });
      console.log(job.status === 'requested' ? 'Review prepared. Return to the study page.' : 'Final code submitted.');
    } else if (job.status === 'reveal_requested') {
      const current = state();
      if (current.sha256 !== job.proposal_sha256) {
        if (current.sha256 !== job.baseline_sha256) throw new Error('Workspace changed before proposal reveal');
        const applied = spawnSync('git', ['apply', '-'], { cwd: workspace, input: job.patch, encoding: 'utf8' });
        if (applied.status !== 0) throw new Error(`Proposal could not be applied: ${applied.stderr}`);
      }
      const actual = state().sha256;
      if (actual !== job.proposal_sha256) throw new Error('Proposal hash mismatch after applying patch');
      await request('/api/client/applied', 'POST', { job_id: job.job_id, workspace_sha256: actual });
      console.log('Proposal is now in the IDE workspace. Review it before recording a decision.');
    } else if (job.status === 'restore_requested') {
      const path = resolve(workspace, job.relative_file);
      if (!path.startsWith(`${workspace}/`) && !path.startsWith(`${workspace}\\`)) throw new Error('Unsafe restore path');
      writeFileSync(path, Buffer.from(job.before_base64, 'base64'));
      await request('/api/client/restored', 'POST', { job_id: job.job_id, workspace_sha256: state().sha256 });
      console.log('Rejected proposal restored. You may continue coding.');
    } else if (job.status === 'decision_check_requested') {
      await request('/api/client/verify-decision', 'POST', { job_id: job.job_id,
        workspace_sha256: state().sha256 });
    }
  } catch (error) {
    console.error(`Study client: ${error.message}`);
  }
  await new Promise((done) => setTimeout(done, 1500));
}
