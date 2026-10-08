import { createHash } from 'node:crypto';
import { logEvent } from './lib.mjs';

const accepted = new Map([
  ['hook-fallback.jsonl', { source: 'antigravity-hook', types: new Set(['file_viewed', 'file_saved', 'test_run', 'scanner_run', 'agent_invocation_started', 'agent_invocation_ended']) }],
  ['extension-fallback.jsonl', { source: 'companion-extension', types: new Set(['file_viewed', 'file_saved', 'diff_opened', 'test_run', 'scanner_run']) }],
  ['pointer-summary.jsonl', { source: 'pointer-recorder', types: new Set(['pointer_summary']) }]
]);
const pointerFields = new Set([
  'window_started_utc', 'elapsed_ms', 'move_events', 'distance_px',
  'median_speed_px_s', 'p90_speed_px_s', 'clicks', 'scrolls', 'platform', 'scope'
]);

export function ingestTelemetryRows(store, taskId, rows) {
  if (!Array.isArray(rows) || rows.length > 50) throw new Error('Invalid telemetry batch');
  let imported = 0;
  for (const item of rows) {
    const name = item?.name;
    const row = item?.record;
    const rule = accepted.get(name);
    if (!rule || !row || typeof row !== 'object' || Array.isArray(row) ||
        row.task_id !== taskId || row.source !== rule.source || !rule.types.has(row.event_type) ||
        typeof row.timestamp_utc !== 'string' || !Number.isFinite(Date.parse(row.timestamp_utc)) ||
        !row.data || typeof row.data !== 'object' || Array.isArray(row.data) ||
        JSON.stringify(row.data).length > 2000) throw new Error('Invalid telemetry row');
    if (name === 'pointer-summary.jsonl') {
      const data = row.data;
      if (row.actor !== 'participant' ||
          Object.keys(data).some((field) => !pointerFields.has(field)) ||
          typeof data.window_started_utc !== 'string' ||
          !Number.isFinite(Date.parse(data.window_started_utc)) ||
          data.scope !== 'all pointer activity while recorder runs; no foreground filter' ||
          !['darwin', 'windows', 'linux'].includes(data.platform) ||
          !Number.isInteger(data.elapsed_ms) || data.elapsed_ms > 60_000 ||
          ['move_events', 'clicks', 'scrolls'].some((field) => !Number.isInteger(data[field])) ||
          ['elapsed_ms', 'move_events', 'distance_px', 'clicks', 'scrolls'].some((field) =>
            !Number.isFinite(data[field]) || data[field] < 0) ||
          ['median_speed_px_s', 'p90_speed_px_s'].some((field) =>
            data[field] !== null && (!Number.isFinite(data[field]) || data[field] < 0))) {
        throw new Error('Invalid pointer summary');
      }
    }
    const sourceSha = createHash('sha256').update(taskId).update(name).update(JSON.stringify(row)).digest('hex');
    if (store.db.prepare('SELECT 1 FROM ingests WHERE source_sha256 = ?').get(sourceSha)) continue;
    const event = logEvent(store, taskId, row.event_type, {
      source: row.source, actor: row.actor || 'unknown',
      evidence_ref: `.study-capture/${name}`,
      data: { ...row.data, capture_timestamp_utc: row.timestamp_utc, imported_from_fallback: true }
    });
    store.db.prepare('INSERT INTO ingests VALUES (?, ?, ?)').run(sourceSha, taskId, event.event_id);
    imported++;
  }
  return { imported };
}
