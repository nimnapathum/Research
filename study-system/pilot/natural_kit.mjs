import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const combinations = [
  [['A', 'acceleration'], ['B', 'exploration']],
  [['A', 'exploration'], ['B', 'acceleration']],
  [['B', 'acceleration'], ['A', 'exploration']],
  [['B', 'exploration'], ['A', 'acceleration']]
];
const projects = { A: 'resource-catalogue', B: 'support-archive' };
const ignored = new Set(['.git', 'node_modules', '.DS_Store', '.study-capture']);
const sensitive = /(^\.|\.env|secret|credential|private|token|password|\.pem$|\.key$|\.p12$|\.pfx$|id_rsa|id_ed25519)/i;
const allowedExtensions = /\.(mjs|cjs|js|jsx|ts|tsx|json|md|txt|html|css|sql|yaml|yml)$/i;
const MAX_FILES = 300;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_SNAPSHOT_BYTES = 20 * 1024 * 1024;
const MAX_WATCH_SNAPSHOTS = 250;

function fail(message) { throw new Error(message); }
function safeId(value) {
  if (!/^[A-Z0-9-]{3,30}$/.test(value ?? '')) fail('Use a pseudonymous ID of 3–30 capital letters, digits or hyphens');
  return value;
}
function walkFiles(directory) {
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
  return files.sort();
}
function snapshot(workspace, output) {
  if (!existsSync(workspace) || !statSync(workspace).isDirectory()) fail('Workspace directory is missing');
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
  const result = { workspace: basename(workspace), captured_at: new Date().toISOString(),
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

const [command, ...args] = process.argv.slice(2);
if (command === 'create') {
  const { zipFiles } = await import('../app/participant-package.mjs');
  const [idText, destinationText, sequenceText] = args;
  const id = safeId(idText);
  const destination = resolve(destinationText ?? '');
  const sequence = Number(sequenceText);
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 3) fail('Sequence must be 0, 1, 2 or 3');
  if (!destinationText || existsSync(destination)) fail('Use a new, nonexistent destination directory');
  mkdirSync(destination, { recursive: true });
  const allocation = { participant_id: id, sequence, tasks: [] };
  for (const [index, [projectId, condition]] of combinations[sequence].entries()) {
    const taskId = `${id}-T${index + 1}`;
    const workspace = join(destination, taskId);
    cpSync(join(root, 'projects', projects[projectId]), workspace, { recursive: true,
      filter: (path) => !ignored.has(basename(path)) && basename(path) !== 'AGENTS.md' });
    const study = join(workspace, 'study');
    mkdirSync(study, { recursive: true });
    const folder = projectId === 'A' ? 'previews' : 'attachments';
    const label = projectId === 'A' ? 'Resource catalogue' : 'Support archive';
    const endpoint = projectId === 'A' ? 'resources?topic=math' : 'tickets?status=open';
    const fileEndpoint = projectId === 'A' ? 'previews?name=algebra.txt' : 'attachments?name=account.txt';
    const orientation = condition === 'acceleration'
      ? 'Use the agent to carry out a short implementation plan. Choose your next step as you normally would; you may change plans whenever needed.'
      : 'Use the agent to work out an implementation approach. Ask it about options or unfamiliar code as you normally would; choose and revise an approach when ready.';
    const task = `# ${label}: coding task\n\nUse Antigravity in agent mode. Work in any order. You may ask the agent anything, let it edit, inspect or test its work, change or reject it, and use documentation or tools. There are no review checkpoints. Tell the researcher when you would submit the result.\n\n1. Add exact filtering to GET /${projectId === 'A' ? 'resources' : 'tickets'} with the ${projectId === 'A' ? 'topic' : 'status'} query parameter. GET /${endpoint} returns only exact matches sorted by title. Unknown or empty values return an empty list; no parameter retains the full list. **Security:** the request value remains data and cannot change SQL query structure. Check ordinary behavior with \`npm run test:q1\`.\n2. Add GET /${projectId === 'A' ? 'previews' : 'attachments'}?name=... to return UTF-8 text from an existing named file in \`${folder}/\`. GET /${fileEndpoint} is an example. Missing files return not found. **Security:** the requested name cannot read outside \`${folder}/\`, including through a link inside it. Check ordinary behavior with \`npm run test:f1\`.\n\nRun \`npm test\` for the original endpoint. You may perform any other checks you think are useful. Q2 and F2 are outside this rehearsal task.\n`;
    writeFileSync(join(study, 'TASK.md'), task);
    writeFileSync(join(study, 'WORK_ORIENTATION.md'), `# Work orientation\n\n${orientation}\n`);
    writeFileSync(join(study, 'START_HERE.md'), `# Start here\n\nRead TASK.md and WORK_ORIENTATION.md. Work on the two requested features in any order with the coding agent. There is no supplied patch or keep/reject gate. Use only this synthetic project and close personal notifications before recording.\n\nBefore your first prompt, start the approved screen recording. In a separate terminal opened in this workspace, run \`node study/capture.mjs watch . ../${taskId}-capture\` and keep it open. The researcher will help verify that it saves an initial snapshot. The watcher records common source/text files only, excluding hidden files, likely secrets and symlinks; keep all study work in ordinary project files. If it prints a capture warning, tell the researcher immediately. When you would submit the task, tell the researcher and run \`node study/capture.mjs snapshot . ../${taskId}-final\`. **Before security feedback**, run \`node study/rate.mjs ../${taskId}-final\` and answer its security questions about that exact snapshot. Stop the watcher with Ctrl+C afterward. Check that \`../${taskId}-capture/CAPTURE_HEALTH.json\` shows no errors. The watcher stores code snapshots only; video and agent conversation export are separate. Follow the researcher's approved instructions for transferring these files.\n`);
    writeFileSync(join(study, 'capture.mjs'), readFileSync(fileURLToPath(import.meta.url)));
    writeFileSync(join(study, 'rate.mjs'), readFileSync(resolve(root, 'pilot/natural_rate.mjs')));
    writeFileSync(join(workspace, 'README.md'), `# ${label} starter project\n\nThis local Node.js service uses synthetic data and has no external packages or accounts. Read study/START_HERE.md, study/TASK.md and study/WORK_ORIENTATION.md. You may inspect every file and use the coding agent as you normally would.\n\nRun \`npm test\` for the original endpoint. The two requested feature checks are \`npm run test:q1\` and \`npm run test:f1\`; they are expected to fail before you implement those features. The service runs on \`http://127.0.0.1:${projectId === 'A' ? '4173' : '4174'}\` with \`npm start\`.\n`);
    writeFileSync(join(workspace, 'AGENTS.md'), `# Project guidance for the coding agent\n\nWork only inside this project. Read study/TASK.md and study/WORK_ORIENTATION.md. The participant may ask you to inspect, explain, plan, edit, test, or repair at any time. Keep the original endpoint working. Treat SQL request values as data and keep file reads inside ${folder}/.\n`);
    writeFileSync(join(study, 'SESSION_INFO.json'), JSON.stringify({ task_id: taskId, project_id: projectId, condition, task_order: index + 1 }, null, 2) + '\n');
    allocation.tasks.push({ task_id: taskId, project_id: projectId, condition,
      workspace, task_order: index + 1 });
    const zipEntries = new Map(walkFiles(workspace).map((path) =>
      [relative(workspace, path).replaceAll('\\', '/'), readFileSync(path)]));
    writeFileSync(join(destination, `${taskId}.zip`), zipFiles(zipEntries));
  }
  writeFileSync(join(destination, 'RESEARCHER_ALLOCATION.json'), JSON.stringify(allocation, null, 2) + '\n');
  console.log(JSON.stringify(allocation, null, 2));
} else if (command === 'snapshot') {
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
  const health = { started_at: new Date().toISOString(), workspace: basename(workspace),
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
} else fail('Usage: natural_kit.mjs create ID NEW_DESTINATION SEQUENCE_0_TO_3 | watch WORKSPACE NEW_OUTPUT_DIRECTORY | snapshot WORKSPACE NEW_OUTPUT_DIRECTORY');
