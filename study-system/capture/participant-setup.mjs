import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or later is required for the study client');
const git = spawnSync('git', ['--version'], { encoding: 'utf8' });
if (git.status !== 0) throw new Error('Git is required to apply controlled proposals. Install Git, then rerun setup.');
const config = JSON.parse(readFileSync(join(workspace, 'study/CAPTURE_CONFIG.json'), 'utf8'));
const url = new URL(config.collector_url);
if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error('The study server must use HTTPS outside localhost');
}
const hook = join(workspace, '.study-capture/hook.mjs');
const quote = (value) => `"${value.replaceAll('"', '\\"')}"`;
const hookCommand = (phase) => ({ type: 'command', command: `${quote(process.execPath)} ${quote(hook)} ${phase}`, timeout: 8 });
const hooks = { 'study-observer': {
  PreInvocation: [hookCommand('pre')],
  PostInvocation: [hookCommand('post')],
  PostToolUse: [{
    matcher: 'run_command|write_to_file|replace_file_content|multi_replace_file_content|view_file',
    hooks: [hookCommand('tool')]
  }]
} };
mkdirSync(join(workspace, '.agents'), { recursive: true });
writeFileSync(join(workspace, '.agents/hooks.json'), JSON.stringify(hooks, null, 2) + '\n');
console.log('Study capture hook configured. In Antigravity, open this project and confirm study-observer is enabled.');
console.log(`Preflight: ${platform()}, Node ${process.version}, ${git.stdout.trim()}.`);
console.log('Next: keep a separate terminal open with: node study/client.mjs');
