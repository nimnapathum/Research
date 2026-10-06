import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, cpSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createSession, hashTree, logEvent, openStore, taskFor } from './lib.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '..');
const [command, ...args] = process.argv.slice(2);
const store = openStore();

function fail(message) { throw new Error(message); }
function runGit(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) fail(`git ${args.join(' ')} failed: ${result.stderr}`);
}
function taskAndWorkspace(taskId, workspaceText) {
  const task = taskFor(store, taskId);
  if (!task) fail('Unknown task ID');
  const workspace = resolve(workspaceText);
  const infoPath = join(workspace, 'study/PACKAGE_INFO.json');
  if (!existsSync(infoPath)) fail('Participant workspace lacks study/PACKAGE_INFO.json');
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  if (info.project_id !== task.project_id || info.assigned_condition !== task.condition) {
    fail('Workspace project or assigned condition does not match task');
  }
  return { task, workspace };
}
function shellQuote(value) { return `'${String(value).replaceAll("'", "'\\''")}'`; }

if (command === 'create') {
  const [participantId] = args;
  const result = createSession(store, participantId);
  console.log(JSON.stringify(result, null, 2));
  console.log(`Participant form URL: http://127.0.0.1:4175/form/pre?token=${result.token}`);
} else if (command === 'configure-capture') {
  const [taskId, workspaceText] = args;
  if (!workspaceText) fail('Usage: configure-capture TASK_ID WORKSPACE');
  const { task, workspace } = taskAndWorkspace(taskId, workspaceText);
  const token = store.db.prepare('SELECT token FROM sessions WHERE participant_id = ?').get(task.participant_id).token;
  const captureDir = join(workspace, '.study-capture');
  mkdirSync(captureDir, { recursive: true });
  mkdirSync(join(workspace, '.agents'), { recursive: true });
  const hookPath = join(captureDir, 'hook.mjs');
  copyFileSync(resolve(root, 'capture/antigravity-hook.mjs'), hookPath);
  writeFileSync(join(workspace, 'study/CAPTURE_CONFIG.json'), JSON.stringify({
    task_id: taskId, token, collector_url: `http://127.0.0.1:${process.env.STUDY_PORT || 4175}`
  }, null, 2) + '\n', { mode: 0o600 });
  const hooks = {
    'study-observer': {
      PostToolUse: [{ matcher: 'run_command|write_to_file|replace_file_content|multi_replace_file_content|view_file',
        hooks: [{ type: 'command', command: `${shellQuote(process.execPath)} ${shellQuote(hookPath)}`, timeout: 8 }] }]
    }
  };
  writeFileSync(join(workspace, '.agents/hooks.json'), JSON.stringify(hooks, null, 2) + '\n');
  console.log(`Capture configured for ${taskId}. Open only ${workspace} in Antigravity.`);
} else if (command === 'prepare') {
  const [taskId, checkpoint, workspaceText] = args;
  if (!['Q1', 'Q2', 'F1', 'F2'].includes(checkpoint) || !workspaceText) fail('Usage: prepare TASK_ID Q1|Q2|F1|F2 WORKSPACE');
  const { task, workspace } = taskAndWorkspace(taskId, workspaceText);
  if (task.final_sha256) fail('Task already finalized');
  const sequence = JSON.parse(task.checkpoint_order_json);
  if (!sequence.includes(checkpoint)) fail('Checkpoint not assigned');
  const completed = new Set(store.db.prepare('SELECT checkpoint_id FROM reviews WHERE task_id = ?').all(taskId).map((row) => row.checkpoint_id));
  const unfinished = store.db.prepare('SELECT checkpoint_id FROM reviews WHERE task_id = ? AND decision_at IS NULL').all(taskId);
  if (unfinished.length) fail(`Finish the review for ${unfinished[0].checkpoint_id} before preparing another`);
  const nextCheckpoint = sequence.find((item) => !completed.has(item));
  if (checkpoint !== nextCheckpoint) fail(`Next assigned checkpoint is ${nextCheckpoint || 'none'}`);
  const prior = store.db.prepare('SELECT 1 FROM reviews WHERE task_id = ? AND checkpoint_id = ?').get(taskId, checkpoint);
  if (prior) fail('Checkpoint already prepared');
  const status = JSON.parse(task.status_json)[checkpoint];
  const project = task.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  const folder = resolve(root, 'stimuli', project, `${task.project_id}-${checkpoint}`);
  const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8'));
  const candidate = manifest.candidates.find((item) => item.expected_target_status === status);
  if (!candidate) fail('No candidate for assigned status');
  const patchPath = join(folder, candidate.patch);
  const patchText = readFileSync(patchPath, 'utf8');
  const touched = [...patchText.matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)].map((match) => [match[1], match[2]]);
  if (touched.length !== 1 || touched[0][0] !== manifest.starter_file || touched[0][1] !== manifest.starter_file) {
    fail('This checkpoint workflow accepts a one-file patch to the declared target only');
  }
  const reviewId = randomUUID();
  const snapshotDir = join(store.dir, 'snapshots', reviewId);
  mkdirSync(snapshotDir, { mode: 0o700 });
  const relativeFile = manifest.starter_file;
  const beforePath = join(snapshotDir, 'before-file');
  copyFileSync(join(workspace, relativeFile), beforePath);
  const baselineSha = hashTree(workspace);
  runGit(['apply', '--check', patchPath], workspace);
  runGit(['apply', patchPath], workspace);
  const proposalPath = join(snapshotDir, 'proposal');
  cpSync(workspace, proposalPath, {
    recursive: true,
    filter: (path) => !['.git', 'node_modules', '.DS_Store'].includes(basename(path))
  });
  const proposalSha = hashTree(workspace);
  copyFileSync(beforePath, join(workspace, relativeFile));
  if (hashTree(workspace) !== baselineSha) fail('Could not restore baseline after preparing proposal');
  store.db.prepare('UPDATE tasks SET workspace_path = ? WHERE task_id = ?').run(workspace, taskId);
  store.db.prepare(`INSERT INTO reviews
    (review_id, task_id, checkpoint_id, candidate_id, proposal_sha256, baseline_sha256, patch_text,
     relative_file, before_file_path, proposal_snapshot_path, workspace_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      reviewId, taskId, checkpoint, candidate.candidate_id, proposalSha, baselineSha, patchText,
      relativeFile, beforePath, proposalPath, workspace, new Date().toISOString()
    );
  logEvent(store, taskId, 'checkpoint_started', {
    checkpoint_id: checkpoint, candidate_id: candidate.candidate_id,
    proposal_sha256: proposalSha, evidence_ref: `snapshots/${reviewId}/proposal`,
    data: { review_id: reviewId }
  });
  const token = store.db.prepare('SELECT token FROM sessions WHERE participant_id = ?').get(task.participant_id).token;
  console.log(`Review ready. Participant URL: http://127.0.0.1:4175/review?token=${token}&review=${reviewId}`);
  console.log(`Proposal hash: ${proposalSha}`);
} else if (command === 'finalize') {
  const [taskId, workspaceText] = args;
  if (!workspaceText) fail('Usage: finalize TASK_ID WORKSPACE');
  const { task, workspace } = taskAndWorkspace(taskId, workspaceText);
  if (task.final_sha256) fail('Task already finalized');
  if (task.workspace_path && resolve(task.workspace_path) !== workspace) fail('Use the same workspace as the reviews');
  const reviews = store.db.prepare('SELECT * FROM reviews WHERE task_id = ?').all(taskId);
  if (reviews.length !== 4) fail('Complete all four assigned checkpoints before finalizing');
  if (reviews.some((row) => !row.decision_at)) fail('A prepared review has no decision yet');
  const finalId = randomUUID();
  const finalPath = join(store.dir, 'snapshots', `final-${finalId}`);
  cpSync(workspace, finalPath, { recursive: true, filter: (path) => !['.git', 'node_modules', '.DS_Store'].includes(basename(path)) });
  const hash = hashTree(workspace);
  store.db.prepare('UPDATE tasks SET workspace_path = ?, final_sha256 = ?, final_snapshot_path = ? WHERE task_id = ?')
    .run(workspace, hash, finalPath, taskId);
  logEvent(store, taskId, 'final_snapshot_saved', {
    evidence_ref: `snapshots/final-${finalId}`,
    data: { final_snapshot_sha256: hash }
  });
  logEvent(store, taskId, 'task_ended');
  console.log(`Final snapshot: ${hash}\nStored at ${finalPath}`);
} else if (command === 'attach') {
  const [taskId, kind, pathText, ...notes] = args;
  if (!['video', 'agent-transcript', 'interview-audio', 'interview-transcript', 'notes'].includes(kind) || !pathText) {
    fail('Usage: attach TASK_ID video|agent-transcript|interview-audio|interview-transcript|notes FILE [NOTES]');
  }
  if (!taskFor(store, taskId)) fail('Unknown task');
  const source = resolve(pathText);
  if (!statSync(source).isFile()) fail('Evidence path is not a file');
  const id = randomUUID();
  const targetDir = join(store.dir, 'raw', 'evidence');
  mkdirSync(targetDir, { recursive: true, mode: 0o700 });
  const target = join(targetDir, `${id}-${basename(source)}`);
  copyFileSync(source, target);
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(target)) digest.update(chunk);
  const hash = `sha256:${digest.digest('hex')}`;
  store.db.prepare('INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, taskId, kind, target, hash, notes.join(' '), new Date().toISOString()
  );
  console.log(`Evidence stored: ${id}, ${hash}`);
} else if (command === 'ingest-fallback') {
  const [taskId, workspaceText] = args;
  if (!workspaceText) fail('Usage: ingest-fallback TASK_ID WORKSPACE');
  const { workspace } = taskAndWorkspace(taskId, workspaceText);
  let imported = 0;
  for (const name of ['hook-fallback.jsonl', 'extension-fallback.jsonl']) {
    const path = join(workspace, '.study-capture', name);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      const sourceSha = createHash('sha256').update(taskId).update(name).update(line).digest('hex');
      if (store.db.prepare('SELECT 1 FROM ingests WHERE source_sha256 = ?').get(sourceSha)) continue;
      const row = JSON.parse(line);
      if (row.task_id !== taskId || !['antigravity-hook', 'companion-extension'].includes(row.source)) fail('Fallback row task/source mismatch');
      const event = logEvent(store, taskId, row.event_type, {
        source: row.source, actor: row.actor || 'unknown',
        data: { ...(row.data || {}), capture_timestamp_utc: row.timestamp_utc, imported_from_fallback: true },
        evidence_ref: `.study-capture/${name}`
      });
      store.db.prepare('INSERT INTO ingests VALUES (?, ?, ?)').run(sourceSha, taskId, event.event_id);
      imported++;
    }
  }
  console.log(`Imported ${imported} new fallback events for ${taskId}`);
} else if (command === 'audit') {
  const events = store.db.prepare('SELECT COUNT(*) AS n FROM events').get().n;
  const rawPath = join(store.dir, 'raw/events.jsonl');
  const raw = existsSync(rawPath) ? readFileSync(rawPath, 'utf8').split('\n').filter(Boolean).length : 0;
  const reviews = store.db.prepare('SELECT task_id, checkpoint_id, exposed_at, decision_at, proposal_sha256 FROM reviews').all();
  const incomplete = reviews.filter((row) => !row.exposed_at || !row.decision_at);
  const taskRows = store.db.prepare('SELECT task_id, final_sha256 FROM tasks').all();
  const sessions = store.db.prepare('SELECT participant_id FROM sessions').all();
  const missingSessionForms = sessions.map((session) => ({
    participant_id: session.participant_id,
    missing_pre_task_form: !store.db.prepare("SELECT 1 FROM forms WHERE participant_id = ? AND kind = 'pre_task'").get(session.participant_id),
    missing_after_both_form: !store.db.prepare("SELECT 1 FROM forms WHERE participant_id = ? AND kind = 'after_both'").get(session.participant_id)
  }));
  const missingByTask = taskRows.map((task) => {
    const evidence = store.db.prepare('SELECT kind FROM evidence WHERE task_id = ?').all(task.task_id).map((row) => row.kind);
    const taskReviews = reviews.filter((row) => row.task_id === task.task_id);
    const afterTask = store.db.prepare("SELECT 1 FROM forms WHERE task_id = ? AND kind = 'after_task'").get(task.task_id);
    return { task_id: task.task_id, missing_final_snapshot: !task.final_sha256,
      missing_checkpoints: ['Q1', 'Q2', 'F1', 'F2'].filter((id) => !taskReviews.some((row) => row.checkpoint_id === id)),
      exposed_reviews: taskReviews.filter((row) => row.exposed_at).length,
      missing_video: !evidence.includes('video'), missing_agent_transcript: !evidence.includes('agent-transcript'),
      missing_after_task_form: !afterTask };
  });
  console.log(JSON.stringify({ indexed_events: events, raw_events: raw, event_stream_match: events === raw,
    tasks: taskRows.length, reviews: reviews.length, incomplete_reviews: incomplete,
    missing_session_forms: missingSessionForms, missing_by_task: missingByTask }, null, 2));
  if (events !== raw || incomplete.length) process.exitCode = 1;
} else {
  console.log('Commands: create P001 | configure-capture TASK_ID WORKSPACE | prepare TASK_ID CHECKPOINT WORKSPACE | finalize TASK_ID WORKSPACE | attach TASK_ID KIND FILE [NOTES] | ingest-fallback TASK_ID WORKSPACE | audit');
  if (command) process.exitCode = 1;
}

store.db.close();
