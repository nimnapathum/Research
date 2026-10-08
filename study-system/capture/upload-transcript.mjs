import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(workspace, 'study/CAPTURE_CONFIG.json'), 'utf8'));
const input = process.argv[2];
if (!input) throw new Error('Usage: node study/upload-transcript.mjs PATH_TO_OFFICIAL_TRANSCRIPT');
const source = input === '~' ? homedir() : input.startsWith('~/') || input.startsWith('~\\')
  ? join(homedir(), input.slice(2)) : input;
const path = isAbsolute(source) ? source : resolve(process.cwd(), source);
if (!existsSync(path) || !statSync(path).isFile()) throw new Error('Transcript path is not a file');
const bytes = readFileSync(path);
if (bytes.length === 0 || bytes.length > 15_000_000) throw new Error('Transcript must be nonempty and at most 15 MB; use researcher-assisted transfer for larger files');
const expectedHash = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const origin = new URL(config.collector_url);
if (origin.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(origin.hostname)) {
  throw new Error('Study server must use HTTPS outside localhost');
}
const response = await fetch(new URL('/api/client/transcript', origin), {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ token: config.token, task_id: config.task_id,
    content_base64: bytes.toString('base64'), sha256: expectedHash }),
  signal: AbortSignal.timeout(60_000)
});
const result = await response.json();
if (!response.ok) throw new Error(result.error || `Upload failed: HTTP ${response.status}`);
if (result.sha256 !== expectedHash) throw new Error('Uploaded transcript hash differs from local file');
console.log(`Official agent transcript received for ${config.task_id}: ${result.sha256}`);
