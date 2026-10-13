import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ignored = new Set(['.git', 'node_modules', '.DS_Store', '.study-capture']);
const sensitive = /(^\.|\.env|secret|credential|private|token|password|\.pem$|\.key$|\.p12$|\.pfx$|id_rsa|id_ed25519)/i;
const allowedExtensions = /\.(mjs|cjs|js|jsx|ts|tsx|json|md|txt|html|css|sql|yaml|yml)$/i;
const MAX_FILES = 300;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const MAX_WATCH_SNAPSHOTS = 250;

function fail(message) { throw new Error(message); }
function identity(workspace) {
  const infoPath = join(workspace, 'study', 'SESSION_INFO.json');
  if (!existsSync(infoPath)) return { task_id: basename(workspace), protocol_version: 'unspecified' };
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  if (!/^[A-Z0-9-]{3,30}-T[12]$/.test(info.task_id ?? '')) fail('Invalid task identity in SESSION_INFO.json');
  return info;
}
export function walkFiles(directory) {
  const files = [];
  function walk(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      if (sensitive.test(entry.name)) continue;
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isSymbolicLink()) continue;
      else if (entry.isFile() && allowedExtensions.test(entry.name)) files.push(path);
    }
  }
  walk(directory);
  if (files.length > MAX_FILES) fail(`Capture limit exceeded: more than ${MAX_FILES} files`);
  let bytes = 0;
  for (const path of files) {
    const size = statSync(path).size;
    if (size > MAX_FILE_BYTES) fail(`Capture limit exceeded: ${relative(directory, path)} is over 2 MiB`);
    bytes += size;
  }
  if (bytes > MAX_SNAPSHOT_BYTES) fail('Capture limit exceeded: project files total over 20 MiB');
  return files.sort((a, b) => {
    const left = relative(directory, a).replaceAll('\\', '/');
    const right = relative(directory, b).replaceAll('\\', '/');
    return left < right ? -1 : left > right ? 1 : 0;
  });
}
function snapshot(workspace, output) {
  if (!existsSync(workspace) || !statSync(workspace).isDirectory()) fail('Workspace directory is missing');
  if (output === workspace || output.startsWith(workspace + sep)) fail('Snapshot output must be outside the workspace');
  if (existsSync(output)) fail('Snapshot destination already exists; use a fresh destination');
  const files = walkFiles(workspace);
  const hash = createHash('sha256');
  mkdirSync(output, { recursive: true, mode: 0o700 });
  const manifest = [];
  for (const path of files) {
    const name = relative(workspace, path).replaceAll('\\', '/');
    const data = readFileSync(path);
    hash.update(name).update('\0').update('file\0').update(data).update('\0');
    const destination = join(output, name);
    mkdirSync(resolve(destination, '..'), { recursive: true, mode: 0o700 });
    writeFileSync(destination, data, { mode: 0o600 });
    manifest.push({ path: name, kind: 'file', sha256: createHash('sha256').update(data).digest('hex') });
  }
  const info = identity(workspace);
  const result = { workspace: info.task_id, protocol_version: info.protocol_version,
    captured_at: new Date().toISOString(),
    snapshot_sha256: `sha256:${hash.digest('hex')}`, files: manifest };
  writeFileSync(join(output, 'SNAPSHOT_MANIFEST.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ output, snapshot_sha256: result.snapshot_sha256, file_count: files.length }, null, 2));
}
function treeHash(workspace) {
  const hash = createHash('sha256');
  for (const path of walkFiles(workspace)) {
    hash.update(relative(workspace, path).replaceAll('\\', '/')).update('\0')
      .update('file\0').update(readFileSync(path)).update('\0');
  }
  return hash.digest('hex');
}


export function runCapture(command, args) {
if (command === 'snapshot') {
  const [workspaceText, outputText] = args;
  if (!workspaceText || !outputText) fail('Usage: natural_kit.mjs snapshot WORKSPACE NEW_OUTPUT_DIRECTORY');
  snapshot(resolve(workspaceText), resolve(outputText));
} else if (command === 'watch') {
  const [workspaceText, outputText] = args;
  if (!workspaceText || !outputText) fail('Usage: natural_kit.mjs watch WORKSPACE NEW_OUTPUT_DIRECTORY');
  const workspace = resolve(workspaceText), output = resolve(outputText);
  if (!existsSync(workspace) || !statSync(workspace).isDirectory()) fail('Workspace directory is missing');
  if (output === workspace || output.startsWith(workspace + sep)) fail('Capture output must be outside the participant workspace');
  if (existsSync(output)) fail('Use a fresh capture output directory');
  mkdirSync(output, { recursive: true, mode: 0o700 });
  let last = '', count = 0, busy = false;
  const info = identity(workspace);
  const health = { started_at: new Date().toISOString(), workspace: info.task_id,
    protocol_version: info.protocol_version, sampling_interval_ms: 2000,
    status: 'running', snapshot_count: 0, last_snapshot_at: null, errors: [] };
  const saveHealth = () => writeFileSync(join(output, 'CAPTURE_HEALTH.json'),
    JSON.stringify(health, null, 2) + '\n', { mode: 0o600 });
  saveHealth();
  const check = () => {
    if (busy) return;
    busy = true;
    try {
      const current = treeHash(workspace);
      if (current !== last) {
        if (count >= MAX_WATCH_SNAPSHOTS) fail(`Capture stopped at ${MAX_WATCH_SNAPSHOTS} snapshots; notify researcher`);
        count += 1;
        const folder = join(output, `S${String(count).padStart(4, '0')}`);
        snapshot(workspace, folder);
        last = current;
        health.snapshot_count = count;
        health.last_snapshot_at = new Date().toISOString();
        health.status = 'running';
      }
    } catch (error) {
      health.status = 'error';
      health.errors.push({ at: new Date().toISOString(), message: error.message });
      console.error(`Capture warning: ${error.message}`);
    }
    saveHealth();
    busy = false;
  };
  check();
  const timer = setInterval(check, 2000);
  process.on('SIGINT', () => {
    clearInterval(timer);
    health.stopped_at = new Date().toISOString();
    if (health.status === 'running') health.status = 'stopped';
    saveHealth();
    process.exit(0);
  });
  console.log(`Watching ${workspace}. Save this terminal output and stop with Ctrl+C after the task.`);
} else fail('Usage: capture.mjs watch WORKSPACE NEW_OUTPUT_DIRECTORY | snapshot WORKSPACE NEW_OUTPUT_DIRECTORY');
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  runCapture(process.argv[2], process.argv.slice(3));
}
