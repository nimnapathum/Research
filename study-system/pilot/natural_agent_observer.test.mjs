import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setupObserver, observeHook, TranscriptCollector, validateTranscript } from './natural_agent_observer.mjs';

const id = '12345678-1234-1234-1234-123456789abc';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'natural-agent-test-'));
  const workspace = join(root, 'P12345678-T1-natural');
  mkdirSync(join(workspace, 'study'), { recursive: true });
  writeFileSync(join(workspace, 'study/SESSION_INFO.json'), JSON.stringify({ task_id: 'P12345678-T1', protocol_version: 'test-r3' }));
  copyFileSync(fileURLToPath(new URL('./natural_agent_observer.mjs', import.meta.url)), join(workspace, 'study/agent-observer.mjs'));
  const appRoot = join(root, 'antigravity-ide');
  const source = join(appRoot, 'brain', id, '.system_generated/logs/transcript.jsonl');
  mkdirSync(join(source, '..'), { recursive: true });
  writeFileSync(source, '');
  const config = setupObserver(workspace, join(root, 'agent'));
  const input = { conversationId: id, workspacePaths: [workspace], transcriptPath: source, modelName: 'test-model' };
  return { root, workspace, source, config, input, roots: [appRoot] };
}

test('setup preserves other hooks and observer outputs contain no control messages', () => {
  const root = mkdtempSync(join(tmpdir(), 'agent-hooks-'));
  const workspace = join(root, 'P12345679-T1');
  mkdirSync(join(workspace, 'study'), { recursive: true }); mkdirSync(join(workspace, '.agents'));
  writeFileSync(join(workspace, 'study/SESSION_INFO.json'), JSON.stringify({ task_id: 'P12345679-T1', protocol_version: 'r3' }));
  writeFileSync(join(workspace, '.agents/hooks.json'), JSON.stringify({ existing: { enabled: false } }));
  setupObserver(workspace, join(root, 'output'));
  const hooks = JSON.parse(readFileSync(join(workspace, '.agents/hooks.json')));
  assert.deepEqual(hooks.existing, { enabled: false });
  assert.equal(hooks['study-natural-observer'].PreToolUse, undefined);
  assert.doesNotMatch(JSON.stringify(hooks), /injectSteps|auto_approve|permissionOverrides/);
});

test('foreign workspaces, reused conversations and unrelated transcript paths are rejected', () => {
  const f = fixture();
  assert.throws(() => observeHook(f.config, 'invocation_start', f.input, f.roots), /fresh SessionStart/);
  assert.throws(() => observeHook(f.config, 'session_start', { ...f.input, workspacePaths: [f.root] }, f.roots), /different/);
  assert.throws(() => observeHook(f.config, 'session_start', { ...f.input, transcriptPath: join(f.root, 'personal.jsonl') }, f.roots), /outside/);
  assert.throws(() => observeHook(f.config, 'session_start', { ...f.input, workspacePaths: [f.workspace, f.root] }, f.roots), /multi-workspace/);
});

test('complete records are captured once, partial lines wait, timestamps are preserved as raw data', () => {
  const f = fixture();
  observeHook(f.config, 'session_start', f.input, f.roots);
  const collector = new TranscriptCollector(f.config, f.roots);
  writeFileSync(join(f.config.output, 'events', '.publishing.tmp'), '{');
  writeFileSync(join(f.config.output, 'registry', '.publishing.tmp'), '{');
  writeFileSync(f.source, '{"role":"user","content":"Implement a filter","timestamp":"source-time"}\n{"role":"assistant"');
  collector.poll(); collector.poll();
  assert.equal(collector.health.transcript_records, 1);
  appendFileSync(f.source, ',"content":"Done"}\n'); collector.poll();
  const health = collector.finish();
  assert.equal(health.status, 'stopped'); assert.equal(health.transcript_records, 2);
  const rows = readFileSync(collector.path, 'utf8').trim().split('\n').map(JSON.parse);
  const user = rows.find((row) => row.raw?.role === 'user');
  assert.equal(user.raw.timestamp, 'source-time'); assert.match(user.observed_at_utc, /Z$/);
  assert.equal(rows.at(-1).kind, 'capture_health');
});

test('transcript rewrites are flagged and both revisions remain in the export', () => {
  const f = fixture(); observeHook(f.config, 'session_start', f.input, f.roots);
  const collector = new TranscriptCollector(f.config, f.roots);
  writeFileSync(f.source, '{"role":"user","content":"first"}\n'); collector.poll();
  writeFileSync(f.source, '{"role":"user","content":"changed"}\n'); collector.poll();
  const health = collector.finish();
  assert.equal(health.status, 'degraded'); assert.equal(health.source_rewrites, 1);
  assert.match(readFileSync(collector.path, 'utf8'), /first/); assert.match(readFileSync(collector.path, 'utf8'), /changed/);
});

test('missing transcript cannot report successful collection and CLI hook returns inert JSON on error', () => {
  const f = fixture(); const collector = new TranscriptCollector(f.config, f.roots);
  assert.equal(collector.finish().status, 'no_transcript');
  const result = spawnSync(process.execPath, [join(f.workspace, 'study/agent-observer.mjs'), 'hook', 'session_start'], { input: '{}', encoding: 'utf8' });
  assert.equal(result.status, 0); assert.equal(result.stdout, '{}\n');
});

test('a transcript symlink to a personal file is rejected', () => {
  const f = fixture();
  const otherId = '12345678-1234-1234-1234-123456789abd';
  const path = join(f.roots[0], 'brain', otherId, '.system_generated/logs/transcript.jsonl');
  mkdirSync(join(path, '..'), { recursive: true });
  symlinkSync(f.source, path);
  assert.throws(() => validateTranscript(path, otherId, f.roots), /regular file/);
});
