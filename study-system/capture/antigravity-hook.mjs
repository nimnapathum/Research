import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const captureDir = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(captureDir, '..');
const configPath = join(workspace, 'study/CAPTURE_CONFIG.json');
let raw = '';
for await (const chunk of process.stdin) raw += chunk;

function localPath(value) {
  if (!value || typeof value !== 'string') return null;
  const rel = relative(workspace, resolve(value));
  return rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ? null : rel;
}
function commandHint(command) {
  return String(command || '').replace(/--(token|key|password|secret)\s+\S+/gi, '--$1 [redacted]').slice(0, 200);
}

try {
  const input = JSON.parse(raw);
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const call = input.toolCall || {};
  const name = call.name || '';
  let event = null;
  if (name === 'run_command') {
    const command = String(call.args?.CommandLine || '');
    if (/\b(codeql|snyk|sonar|semgrep)\b|npm\s+audit/i.test(command)) {
      event = { event_type: 'scanner_run', data: { command_hint: commandHint(command), tool_name: name } };
    } else if (/\b(npm\s+(test|run\s+test)|node\s+--test|curl|wget)\b/i.test(command)) {
      event = { event_type: 'test_run', data: { command_hint: commandHint(command), tool_name: name } };
    }
  } else if (name === 'view_file') {
    const path = localPath(call.args?.AbsolutePath);
    if (path) event = { event_type: 'file_viewed', data: { path, tool_name: name } };
  } else if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(name)) {
    const path = localPath(call.args?.TargetFile);
    if (path) event = { event_type: 'file_saved', data: { path, tool_name: name } };
  }
  if (event) {
    const payload = {
      token: config.token, task_id: config.task_id, source: 'antigravity-hook', actor: 'agent',
      event_type: event.event_type, data: { ...event.data, conversation_id: input.conversationId || null,
        step_index: Number.isInteger(input.stepIdx) ? input.stepIdx : null,
        model_name: input.modelName || null, transcript_path: input.transcriptPath || null,
        tool_failed: Boolean(input.error) }
    };
    try {
      const response = await fetch(`${config.collector_url}/api/event`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2500)
      });
      if (!response.ok) throw new Error(`collector HTTP ${response.status}`);
    } catch (error) {
      const fallback = { ...payload, token: undefined, capture_error: error.message,
        timestamp_utc: new Date().toISOString() };
      appendFileSync(join(captureDir, 'hook-fallback.jsonl'), JSON.stringify(fallback) + '\n');
    }
  }
} catch (error) {
  appendFileSync(join(captureDir, 'hook-errors.log'), `${new Date().toISOString()} ${error.message}\n`);
}

// PostToolUse hooks must return JSON and must not block the coding agent.
process.stdout.write('{}\n');
