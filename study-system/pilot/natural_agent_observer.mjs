import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, linkSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 40 * 1024 * 1024;
const MAX_CONVERSATIONS = 10;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const now = () => new Date().toISOString();
const hash = (data) => createHash('sha256').update(data).digest('hex');
const roots = () => ['antigravity', 'antigravity-ide', 'antigravity-cli'].map((name) => join(homedir(), '.gemini', name));
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
function privateDirectory(path) { mkdirSync(path, { recursive: true, mode: 0o700 }); }
function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  renameSync(temporary, path);
}
function publishOnce(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(value) + '\n', { flag: 'wx', mode: 0o600 });
    try { linkSync(temporary, path); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  } finally { if (existsSync(temporary)) unlinkSync(temporary); }
}
function outside(workspace, output) {
  const rel = relative(workspace, output);
  if (rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))) {
    throw new Error('Agent capture output must be outside the coding workspace');
  }
}
function freshOutput(workspace, outputText) {
  let output = resolve(outputText);
  outside(workspace, output);
  if (existsSync(output)) throw new Error('Use a fresh agent capture directory; existing evidence will not be overwritten');
  privateDirectory(output);
  output = realpathSync(output);
  outside(workspace, output);
  for (const folder of ['events', 'registry', 'hook-errors', 'conversations']) privateDirectory(join(output, folder));
  return output;
}
function expandHome(path) {
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(homedir(), path.slice(2));
  if (!isAbsolute(path)) throw new Error('Transcript path must be absolute');
  return resolve(path);
}
export function validateTranscript(path, conversationId, allowedRoots = roots()) {
  if (typeof path !== 'string' || !uuid.test(conversationId || '')) throw new Error('Invalid conversation/transcript identity');
  const expanded = expandHome(path);
  const expected = allowedRoots.flatMap((root) => ['transcript.jsonl', 'transcript_full.jsonl'].map((filename) =>
    join(resolve(root), 'brain', conversationId, '.system_generated', 'logs', filename)));
  if (!expected.includes(expanded)) throw new Error('Transcript is outside the registered Antigravity conversation path');
  if (existsSync(expanded)) {
    if (!lstatSync(expanded).isFile() || lstatSync(expanded).isSymbolicLink()) throw new Error('Transcript is not a regular file');
    const root = allowedRoots.find((candidate) => ['transcript.jsonl', 'transcript_full.jsonl'].some((filename) =>
      expanded === join(resolve(candidate), 'brain', conversationId, '.system_generated', 'logs', filename)));
    const rel = relative(realpathSync(root), realpathSync(expanded));
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('Transcript resolves outside its approved root');
  }
  return expanded;
}
function taskInfo(workspace) {
  const info = json(join(workspace, 'study', 'SESSION_INFO.json'));
  if (!/^[A-Z0-9-]{3,30}-T[12]$/.test(info.task_id || '')) throw new Error('Invalid study task identity');
  return info;
}
function quote(path) {
  if (process.platform === 'win32') {
    if (/["%!\r\n]/.test(path)) throw new Error('This Windows path needs an individually tested hook configuration');
    return `"${path}"`;
  }
  return `'${path.replaceAll("'", "'\\''")}'`;
}
export function setupObserver(workspaceText, outputText, nodePath = process.execPath) {
  const workspace = realpathSync(resolve(workspaceText));
  const info = taskInfo(workspace);
  const hooksPath = join(workspace, '.agents', 'hooks.json');
  if (existsSync(join(workspace, '.agents')) && lstatSync(join(workspace, '.agents')).isSymbolicLink()) throw new Error('Hooks directory cannot be a symlink');
  if (existsSync(hooksPath) && lstatSync(hooksPath).isSymbolicLink()) throw new Error('Hooks file cannot be a symlink');
  const hooks = existsSync(hooksPath) ? json(hooksPath) : {};
  if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) throw new Error('Existing hooks configuration is not an object');
  if (hooks['study-natural-observer']) throw new Error('Study observer already configured; use a fresh study project for a new session');
  const script = join(workspace, 'study', 'agent-observer.mjs');
  const command = (event) => ({ type: 'command', command: `${quote(nodePath)} ${quote(script)} hook ${event}`, timeout: 2 });
  hooks['study-natural-observer'] = {
    SessionStart: [command('session_start')], PreInvocation: [command('invocation_start')],
    PostInvocation: [command('invocation_end')],
    PostToolUse: [{ matcher: '*', hooks: [command('tool_completed')] }], Stop: [command('agent_stop')]
  };
  const output = freshOutput(workspace, outputText);
  privateDirectory(join(workspace, '.study-observer'));
  const config = { task_id: info.task_id, protocol_version: info.protocol_version,
    workspace, output, configured_at: now(), capture_scope: 'fresh registered study conversations only' };
  atomicJson(join(workspace, '.study-observer', 'config.json'), config);
  privateDirectory(dirname(hooksPath));
  atomicJson(hooksPath, hooks);
  return config;
}
export function restartObserver(workspaceText, outputText) {
  const workspace = realpathSync(resolve(workspaceText));
  const info = taskInfo(workspace);
  const configPath = join(workspace, '.study-observer', 'config.json');
  const previous = json(configPath);
  if (previous.workspace !== workspace || previous.task_id !== info.task_id ||
      previous.protocol_version !== info.protocol_version) throw new Error('Observer setup does not match this workspace');
  const healthPath = join(previous.output, 'AGENT_CAPTURE_HEALTH.json');
  if (!existsSync(healthPath) || json(healthPath).status === 'running') {
    throw new Error('Stop the previous agent watcher with Ctrl+C before restarting');
  }
  const hooks = json(join(workspace, '.agents', 'hooks.json'));
  if (!hooks['study-natural-observer']) throw new Error('Study observer hook is not configured');
  const output = freshOutput(workspace, outputText);
  const config = { ...previous, output, previous_output: previous.output,
    restarted_at: now(), capture_scope: 'fresh registered study conversations only' };
  atomicJson(configPath, config);
  return config;
}
export function observeHook(config, event, input, allowedRoots = roots()) {
  if (!['session_start', 'invocation_start', 'invocation_end', 'tool_completed', 'agent_stop'].includes(event)) throw new Error('Unsupported observer event');
  if (!Array.isArray(input.workspacePaths) || input.workspacePaths.length !== 1 ||
      realpathSync(resolve(input.workspacePaths[0])) !== realpathSync(config.workspace)) {
    throw new Error('Hook belongs to a different or multi-workspace conversation');
  }
  const id = input.conversationId;
  const path = validateTranscript(input.transcriptPath, id, allowedRoots);
  const registrationPath = join(config.output, 'registry', `${id}.json`);
  if (!existsSync(registrationPath)) {
    if (event !== 'session_start') throw new Error('No fresh SessionStart observed; start a new study conversation');
    if (readdirSync(join(config.output, 'registry')).filter((file) => file.endsWith('.json')).length >= MAX_CONVERSATIONS) throw new Error('Conversation capture limit reached');
    publishOnce(registrationPath, { conversation_id: id, transcript_path: path,
      task_id: config.task_id, registered_at: now() });
  }
  if (json(registrationPath).transcript_path !== path) throw new Error('Registered conversation transcript changed path');
  const recorded = { kind: 'hook_event', event_id: randomUUID(), task_id: config.task_id,
    conversation_id: id, observed_at_utc: now(), event, model_name: input.modelName || null,
    step_index: Number.isInteger(input.stepIdx) ? input.stepIdx : null,
    invocation_number: Number.isInteger(input.invocationNum) ? input.invocationNum : null,
    tool_name: input.toolCall?.name || null, tool_failed: Boolean(input.error), fully_idle: input.fullyIdle ?? null };
  // Never return decisions, injected messages, permissions or source data to the agent.
  publishOnce(join(config.output, 'events', `${recorded.event_id}.json`), recorded);
  return recorded;
}

export class TranscriptCollector {
  constructor(config, allowedRoots = roots()) {
    this.config = config; this.allowedRoots = allowedRoots; this.states = new Map(); this.events = new Set(); this.hookErrors = new Set();
    this.path = join(config.output, 'AGENT_TRANSCRIPT.jsonl');
    if (existsSync(this.path)) throw new Error('Agent transcript output already exists; preserve it and use a fresh session');
    this.health = { task_id: config.task_id, protocol_version: config.protocol_version, started_at: now(),
      status: 'running', poll_interval_ms: 1000, conversations: 0, transcript_records: 0, hook_events: 0,
      source_rewrites: 0, last_poll_at: null, os: process.platform, node_version: process.version,
      errors: [], timestamp_semantics: 'observed_at_utc is collection time; original timestamps remain inside raw transcript records' };
    this.write({ kind: 'study_agent_capture', task_id: config.task_id, protocol_version: config.protocol_version,
      started_at: this.health.started_at, schema_version: 1, timestamp_semantics: this.health.timestamp_semantics });
  }
  write(record) {
    const text = JSON.stringify(record) + '\n';
    const size = existsSync(this.path) ? statSync(this.path).size : 0;
    if (size + Buffer.byteLength(text) > MAX_OUTPUT_BYTES) throw new Error('Agent export reached 40 MiB limit; notify researcher');
    appendFileSync(this.path, text, { mode: 0o600 });
  }
  warning(code, detail, conversationId = null) {
    const item = { at: now(), code, detail, conversation_id: conversationId };
    if (!this.health.errors.some((existing) => existing.code === code && existing.detail === detail && existing.conversation_id === conversationId)) {
      this.health.errors.push(item);
      try { this.write({ kind: 'capture_warning', ...item }); } catch {}
      console.error(`Agent capture warning: ${detail}`);
    }
  }
  poll(final = false) {
    for (const file of readdirSync(join(this.config.output, 'events')).filter((name) => name.endsWith('.json')).sort()) {
      if (this.events.has(file)) continue;
      try { this.write(json(join(this.config.output, 'events', file))); this.events.add(file); this.health.hook_events += 1; }
      catch (error) { this.warning('hook_event', error.message); }
    }
    for (const file of readdirSync(join(this.config.output, 'hook-errors')).filter((name) => name.endsWith('.json'))) {
      if (this.hookErrors.has(file)) continue;
      try { const error = json(join(this.config.output, 'hook-errors', file)); this.warning('hook_error', error.message); this.hookErrors.add(file); }
      catch (error) { this.warning('hook_error_read', error.message); }
    }
    for (const file of readdirSync(join(this.config.output, 'registry')).filter((name) => name.endsWith('.json'))) {
      let id;
      try {
        const registration = json(join(this.config.output, 'registry', file));
        id = registration.conversation_id;
        if (registration.task_id !== this.config.task_id) throw new Error('Registered task mismatch');
        const source = validateTranscript(registration.transcript_path, id, this.allowedRoots);
        if (!existsSync(source)) { if (final) this.warning('source_missing', 'Registered transcript file never became readable', id); continue; }
        if (statSync(source).size > MAX_SOURCE_BYTES) throw new Error('Conversation transcript exceeds 20 MiB limit');
        const data = readFileSync(source);
        if (data.length > MAX_SOURCE_BYTES) throw new Error('Conversation transcript exceeds 20 MiB limit');
        let state = this.states.get(id);
        if (!state) { state = { offset: 0, prefixHash: hash(Buffer.alloc(0)), segment: 0 }; this.states.set(id, state); }
        if (data.length < state.offset || hash(data.subarray(0, state.offset)) !== state.prefixHash) {
          this.warning('source_rewritten', 'Transcript was truncated or rewritten; revisions retained as separate segments', id);
          this.health.source_rewrites += 1; state.offset = 0; state.prefixHash = hash(Buffer.alloc(0)); state.segment += 1;
        }
        let end = data.lastIndexOf(10) + 1;
        if (final && data.length > end) {
          try { JSON.parse(data.subarray(end).toString('utf8')); end = data.length; }
          catch { this.warning('partial_record', 'Transcript ends with an incomplete record', id); }
        }
        try { while (state.offset < end) {
          const start = state.offset;
          const newline = data.indexOf(10, start);
          const stop = newline >= 0 && newline < end ? newline + 1 : end;
          const line = data.subarray(start, stop).toString('utf8').trim();
          if (Buffer.byteLength(line) > 1024 * 1024) throw new Error('Transcript record exceeds 1 MiB limit');
          if (line) {
            let raw;
            try { raw = JSON.parse(line); }
            catch { this.warning('invalid_json', 'Transcript includes a non-JSON record; raw line preserved', id); }
            this.write({ kind: 'transcript_record', task_id: this.config.task_id, conversation_id: id,
              observed_at_utc: now(), source_segment: state.segment, source_byte_start: start, source_byte_end: stop,
              source_line_sha256: hash(data.subarray(start, stop)), ...(raw === undefined ? { raw_line: line } : { raw }) });
            this.health.transcript_records += 1;
          }
          state.offset = stop;
        } } finally { state.prefixHash = hash(data.subarray(0, state.offset)); }
        const folder = join(this.config.output, 'conversations', id); privateDirectory(folder);
        const rawPath = join(folder, `transcript-segment-${state.segment}.jsonl`);
        const rawHash = hash(data);
        if (state.rawHash !== rawHash) {
          writeFileSync(rawPath, data, { mode: 0o600 });
          atomicJson(join(folder, 'SOURCE_MANIFEST.json'), { conversation_id: id, task_id: this.config.task_id,
            segment: state.segment, observed_at_utc: now(), size_bytes: data.length, sha256: rawHash });
          state.rawHash = rawHash;
        }
      } catch (error) { this.warning('transcript_read', error.message, id); }
    }
    this.health.conversations = this.states.size;
    this.health.last_poll_at = now();
    atomicJson(join(this.config.output, 'AGENT_CAPTURE_HEALTH.json'), this.health);
  }
  finish() {
    this.poll(true);
    this.health.stopped_at = now();
    this.health.status = this.health.errors.length ? 'degraded' : this.health.transcript_records === 0 ? 'no_transcript' : 'stopped';
    try { this.write({ kind: 'capture_health', ...this.health }); }
    catch (error) { this.health.status = 'degraded'; this.health.errors.push({ code: 'output_limit', detail: error.message, at: now() }); }
    atomicJson(join(this.config.output, 'AGENT_CAPTURE_HEALTH.json'), this.health);
    atomicJson(join(this.config.output, 'AGENT_CAPTURE_MANIFEST.json'), { task_id: this.config.task_id,
      protocol_version: this.config.protocol_version, stopped_at: this.health.stopped_at,
      filename: 'AGENT_TRANSCRIPT.jsonl', sha256: hash(readFileSync(this.path)), size_bytes: statSync(this.path).size });
    return this.health;
  }
}

async function main() {
  const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const [command, argument] = process.argv.slice(2);
  if (command === 'setup') {
    if (!argument) throw new Error('Usage: node study/agent-observer.mjs setup ../TASK-ID-agent');
    const config = setupObserver(workspace, argument);
    console.log(`Observer configured for ${config.task_id}. Confirm study-natural-observer is enabled in Antigravity Hooks, then run node study/agent-observer.mjs watch before starting a fresh conversation.`);
    console.log(`Agent evidence directory: ${config.output}`);
  } else if (command === 'restart') {
    if (!argument) throw new Error('Usage: node study/agent-observer.mjs restart ../TASK-ID-agent-retry');
    const config = restartObserver(workspace, argument);
    console.log(`Observer restarted with fresh evidence directory: ${config.output}`);
    console.log('Run node study/agent-observer.mjs watch, then start a fresh Antigravity conversation. Keep the previous evidence directory.');
  } else if (command === 'hook') {
    // Fail open to agent operation; retain diagnostic errors for the researcher.
    let config;
    let input;
    try {
      config = json(join(workspace, '.study-observer', 'config.json'));
      let text = '';
      for await (const chunk of process.stdin) { text += chunk; if (Buffer.byteLength(text) > 1024 * 1024) throw new Error('Hook input too large'); }
      input = JSON.parse(text);
      observeHook(config, argument, input);
    } catch (error) {
      if (config) try {
        const pathDiagnostic = error.message === 'Transcript is outside the registered Antigravity conversation path' &&
          input && typeof input === 'object' ? {
            conversation_id: typeof input.conversationId === 'string' ? input.conversationId : null,
            transcript_path: typeof input.transcriptPath === 'string' ? input.transcriptPath : null
          } : {};
        atomicJson(join(config.output, 'hook-errors', `${randomUUID()}.json`),
          { at: now(), message: error.message, ...pathDiagnostic });
      } catch {}
    } finally { process.stdout.write('{}\n'); }
  } else if (command === 'watch') {
    const config = json(join(workspace, '.study-observer', 'config.json'));
    const collector = new TranscriptCollector(config);
    collector.poll();
    const timer = setInterval(() => collector.poll(), 1000);
    const stop = () => { clearInterval(timer); const health = collector.finish(); console.log(JSON.stringify(health, null, 2)); process.exit(health.status === 'stopped' ? 0 : 1); };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
    console.log('Waiting for a fresh study conversation. Leave this terminal running; stop with Ctrl+C after the agent is idle and the final rating is saved.');
  } else if (command === 'status') {
    const config = json(join(workspace, '.study-observer', 'config.json'));
    console.log(JSON.stringify(json(join(config.output, 'AGENT_CAPTURE_HEALTH.json')), null, 2));
  } else throw new Error('Usage: agent-observer.mjs setup NEW_OUTPUT_DIRECTORY | restart NEW_OUTPUT_DIRECTORY | watch | status');
}
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) await main();
