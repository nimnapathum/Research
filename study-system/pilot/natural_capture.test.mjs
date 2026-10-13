import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./natural_kit.mjs', import.meta.url));

test('capture identity survives the ordinary natural ZIP extraction name', () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-renamed-test-'));
  const workspace = join(root, 'P12345678-T1-natural (1)');
  mkdirSync(join(workspace, 'study'), { recursive: true });
  writeFileSync(join(workspace, 'study/SESSION_INFO.json'), JSON.stringify({ task_id: 'P12345678-T1', protocol_version: 'test' }));
  const output = join(root, 'final');
  const result = spawnSync(process.execPath, [script, 'snapshot', workspace, output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(join(output, 'SNAPSHOT_MANIFEST.json'))).workspace, 'P12345678-T1');
});

test('agent workspace contains no assigned condition or encouragement card', () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-context-test-'));
  const destination = join(root, 'pair');
  const result = spawnSync(process.execPath, [script, 'create', 'P12345679', destination, '0'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const workspace = join(destination, 'P12345679-T1');
  const info = JSON.parse(readFileSync(join(workspace, 'study/SESSION_INFO.json')));
  assert.equal(info.condition, undefined);
  assert.ok(info.protocol_version);
  assert.equal(existsSync(join(workspace, 'study/WORK_ORIENTATION.md')), false);
  assert.doesNotMatch(readFileSync(join(workspace, 'AGENTS.md'), 'utf8'), /WORK_ORIENTATION|acceleration|exploration/);
  assert.doesNotMatch(readFileSync(join(workspace, 'study/capture.mjs'), 'utf8'), /acceleration|exploration/);
  assert.ok(existsSync(join(destination, 'P12345679-T1-ORIENTATION.md')));
});

test('natural snapshot excludes secrets and symlinks and records a verifiable source hash', () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-capture-test-'));
  const workspace = join(root, 'P777-T1');
  mkdirSync(join(workspace, 'src'), { recursive: true });
  writeFileSync(join(workspace, 'src', 'app.mjs'), 'export const ok = true;\n');
  writeFileSync(join(workspace, '.env'), 'SECRET=never-copy');
  writeFileSync(join(workspace, 'credentials.json'), '{"token":"never-copy"}');
  symlinkSync('/etc/passwd', join(workspace, 'src', 'outside.txt'));
  const output = join(root, 'final');
  const result = spawnSync(process.execPath, [script, 'snapshot', workspace, output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(join(output, 'SNAPSHOT_MANIFEST.json'), 'utf8'));
  assert.deepEqual(manifest.files.map((item) => item.path), ['src/app.mjs']);
  assert.match(readFileSync(join(output, 'src', 'app.mjs'), 'utf8'), /ok = true/);
  assert.match(manifest.snapshot_sha256, /^sha256:[a-f0-9]{64}$/);
});

test('natural snapshot fails closed when a source file exceeds the per-file cap', () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-capture-limit-'));
  const workspace = join(root, 'P778-T1');
  mkdirSync(workspace);
  writeFileSync(join(workspace, 'large.mjs'), 'x'.repeat(2 * 1024 * 1024 + 1));
  const result = spawnSync(process.execPath, [script, 'snapshot', workspace, join(root, 'final')], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Capture limit exceeded/);
});

test('watcher records initial capture and health status on normal stop', async () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-watch-test-'));
  const workspace = join(root, 'P779-T1');
  mkdirSync(workspace);
  writeFileSync(join(workspace, 'app.mjs'), 'export default 1;\n');
  const output = join(root, 'capture');
  const child = spawn(process.execPath, [script, 'watch', workspace, output], { stdio: 'ignore' });
  try {
    for (let attempt = 0; attempt < 50 && !existsSync(join(output, 'S0001', 'SNAPSHOT_MANIFEST.json')); attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(existsSync(join(output, 'S0001', 'SNAPSHOT_MANIFEST.json')));
  } finally {
    child.kill('SIGINT');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  const health = JSON.parse(readFileSync(join(output, 'CAPTURE_HEALTH.json'), 'utf8'));
  assert.equal(health.status, 'stopped');
  assert.equal(health.snapshot_count, 1);
  assert.deepEqual(health.errors, []);
  assert.ok(health.stopped_at);
});
