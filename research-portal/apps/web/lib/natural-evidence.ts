import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { access, chmod, link, mkdir, open, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export const evidenceKinds = {
  capture_zip: 500 * 1024 * 1024,
  capture_health: 1024 * 1024,
  final_zip: 100 * 1024 * 1024,
  final_manifest: 2 * 1024 * 1024,
  rating_json: 2 * 1024 * 1024,
  agent_transcript: 50 * 1024 * 1024,
  screen_recording: 1024 * 1024 * 1024
} as const;
export type EvidenceKind = keyof typeof evidenceKinds;
// Existing uploaded recordings remain readable, but Meet recordings are linked by the researcher.
export const requiredEvidence = Object.keys(evidenceKinds).filter((kind) => kind !== 'screen_recording') as EvidenceKind[];
export type EvidenceReceipt = { task_id: string; kind: EvidenceKind; filename: string;
  size_bytes: number; sha256: string; received_at: string };

const root = resolve(/* turbopackIgnore: true */ process.env.STUDY_EVIDENCE_ROOT ||
  join(process.cwd(), '../../.local-evidence'));
function safe(value: string, pattern: RegExp) {
  if (!pattern.test(value)) throw new Error('Invalid evidence identity');
  return value;
}
function taskFolder(participantCode: string, taskId: string) {
  safe(participantCode, /^P\d{8}$/);
  safe(taskId, /^P\d{8}-T[12]$/);
  if (!taskId.startsWith(`${participantCode}-`)) throw new Error('Evidence task does not belong to participant');
  return join(/* turbopackIgnore: true */ root, participantCode, taskId);
}
async function receipt(folder: string, kind: EvidenceKind): Promise<EvidenceReceipt | null> {
  try {
    const parsed = JSON.parse(await readFile(join(folder, `${kind}.receipt.json`), 'utf8')) as EvidenceReceipt;
    return parsed.kind === kind ? parsed : null;
  } catch { return null; }
}
async function structured(folder: string, kind: EvidenceKind) {
  try { return JSON.parse(await readFile(join(folder, `${kind}.data`), 'utf8')) as Record<string, unknown>; }
  catch { return null; }
}
async function agentCaptureSummary(path: string, taskId: string) {
  const text = (await readFile(path, 'utf8')).trim();
  if (!text) throw new Error('Agent transcript has no readable content');
  const lines = text.split(/\r?\n/);
  let header: Record<string, unknown>;
  try { header = JSON.parse(lines[0]); } catch { return { format: 'manual_export' }; }
  if (header?.kind !== 'study_agent_capture') return { format: 'manual_export' };
  const records = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  const health = records.at(-1)!;
  if (header.task_id !== taskId || health.kind !== 'capture_health' || health.task_id !== taskId ||
      header.protocol_version !== health.protocol_version || !Array.isArray(health.errors) ||
      health.transcript_records !== records.filter((row) => row.kind === 'transcript_record').length ||
      health.hook_events !== records.filter((row) => row.kind === 'hook_event').length) {
    throw new Error('Agent observer export is incomplete or belongs to another task; stop the watcher and select its final export');
  }
  return { format: 'study_observer', protocol_version: header.protocol_version, status: health.status,
    transcript_records: health.transcript_records, hook_events: health.hook_events,
    conversations: health.conversations, errors: health.errors,
    timestamp_semantics: health.timestamp_semantics };
}
export async function naturalEvidenceStatus(participantCode: string, taskId: string) {
  const folder = taskFolder(participantCode, taskId);
  const items = Object.fromEntries(await Promise.all(requiredEvidence.map(async (kind) =>
    [kind, await receipt(folder, kind)] as const))) as Record<EvidenceKind, EvidenceReceipt | null>;
  const missing = requiredEvidence.filter((kind) => !items[kind]);
  const issues: string[] = [];
  const manifest = items.final_manifest ? await structured(folder, 'final_manifest') : null;
  const rating = items.rating_json ? await structured(folder, 'rating_json') : null;
  const health = items.capture_health ? await structured(folder, 'capture_health') : null;
  if (items.final_manifest && !manifest) issues.push('Final snapshot manifest cannot be read');
  if (items.rating_json && !rating) issues.push('Final rating cannot be read');
  if (items.capture_health && !health) issues.push('Capture-health record cannot be read');
  if (manifest && rating && manifest.snapshot_sha256 !== rating.final_snapshot_sha256) {
    issues.push('Rating hash does not match the final snapshot manifest');
  }
  if (manifest && rating && manifest.protocol_version !== rating.protocol_version) issues.push('Rating and snapshot protocol versions differ');
  if (manifest && health && manifest.protocol_version !== health.protocol_version) issues.push('Capture and final snapshot protocol versions differ');
  if (health && (health.status !== 'stopped' || !Array.isArray(health.errors) || health.errors.length)) {
    issues.push('Capture watcher did not stop cleanly or reported errors');
  }
  const rating_ready = Boolean(manifest && rating && manifest.workspace === taskId &&
    rating.participant_task_id === taskId && manifest.snapshot_sha256 === rating.final_snapshot_sha256 &&
    manifest.protocol_version === rating.protocol_version);
  let agent_capture: Record<string, unknown> | null = null;
  try { agent_capture = JSON.parse(await readFile(join(folder, 'agent_capture_summary.json'), 'utf8')); } catch {}
  if (manifest && agent_capture?.format === 'study_observer' && agent_capture.protocol_version !== manifest.protocol_version) {
    issues.push('Agent export and final snapshot protocol versions differ');
  }
  const ready = missing.length === 0 && issues.length === 0;
  // Backfill submission for six-file sessions created before video moved to researcher-managed Drive.
  if (ready) await writeFile(join(folder, 'READY.json'), JSON.stringify({ task_id: taskId,
    ready_at: new Date().toISOString() }) + '\n', { flag: 'wx', mode: 0o600 }).catch(() => {});
  const warnings = agent_capture?.format === 'study_observer' && agent_capture.status !== 'stopped'
    ? ['Agent conversation capture reported missing records or errors; the researcher must assess coverage before analysis.'] : [];
  return { task_id: taskId, items, missing, issues, ready, rating_ready, agent_capture, warnings };
}

function validateJson(kind: EvidenceKind, object: Record<string, unknown>, taskId: string) {
  if (kind === 'final_manifest') {
    if (object.workspace !== taskId || !/^sha256:[a-f0-9]{64}$/.test(String(object.snapshot_sha256)) ||
        !Array.isArray(object.files) || object.files.length === 0) throw new Error('Invalid final snapshot manifest');
  }
  if (kind === 'rating_json') {
    if (object.participant_task_id !== taskId ||
        !/^sha256:[a-f0-9]{64}$/.test(String(object.final_snapshot_sha256)) ||
        !['sql_probability_pct', 'path_probability_pct'].every((key) =>
          Number.isInteger(object[key]) && Number(object[key]) >= 0 && Number(object[key]) <= 100)) {
      throw new Error('Invalid final security rating');
    }
  }
  if (kind === 'capture_health' && (object.workspace !== taskId ||
      !Array.isArray(object.errors) || !Number.isInteger(object.snapshot_count))) {
    throw new Error('Invalid capture-health record');
  }
}

export async function saveNaturalEvidence(participantCode: string, taskId: string,
  kind: EvidenceKind, filename: string, body: ReadableStream<Uint8Array>) {
  const folder = taskFolder(participantCode, taskId);
  if (!(kind in evidenceKinds)) throw new Error('Unsupported evidence kind');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await chmod(root, 0o700).catch(() => {});
  await chmod(join(/* turbopackIgnore: true */ root, participantCode), 0o700).catch(() => {});
  await chmod(folder, 0o700).catch(() => {});
  const limit = evidenceKinds[kind];
  const temporary = join(folder, `.upload-${randomUUID()}`);
  const target = join(folder, `${kind}.data`);
  const handle = await open(temporary, 'wx', 0o600);
  const hash = createHash('sha256');
  let size = 0;
  const firstBytes: number[] = [];
  try {
    const reader = body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > limit) throw new Error(`Evidence exceeds ${Math.round(limit / 1024 / 1024)} MiB limit`);
        for (const byte of value) { if (firstBytes.length < 4) firstBytes.push(byte); else break; }
        hash.update(value);
        let offset = 0;
        while (offset < value.byteLength) {
          const written = await handle.write(value, offset, value.byteLength - offset);
          if (written.bytesWritten === 0) throw new Error('Evidence write stopped unexpectedly');
          offset += written.bytesWritten;
        }
      }
    } finally { reader.releaseLock(); }
    await handle.close();
    if (size === 0) throw new Error('Evidence file is empty');
    if (kind.endsWith('_zip') && firstBytes.join(',') !== '80,75,3,4') throw new Error('Expected a ZIP archive');
    if (['final_manifest', 'rating_json', 'capture_health'].includes(kind)) {
      const object = JSON.parse(await readFile(temporary, 'utf8')) as Record<string, unknown>;
      validateJson(kind, object, taskId);
    }
    const agentSummary = kind === 'agent_transcript' ? await agentCaptureSummary(temporary, taskId) : null;
    const sha256 = hash.digest('hex');
    const existing = await receipt(folder, kind);
    if (existing) {
      if (existing.sha256 === sha256) return { ...existing, duplicate: true };
      throw new Error(`${kind} was already received with different content; ask the researcher to resolve it`);
    }
    try { await link(temporary, target); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`${kind} is already being received`);
      throw error;
    }
    const saved: EvidenceReceipt = { task_id: taskId, kind,
      filename: basename(filename || kind).slice(0, 180), size_bytes: size,
      sha256, received_at: new Date().toISOString() };
    if (agentSummary) await writeFile(join(folder, 'agent_capture_summary.json'), JSON.stringify(agentSummary, null, 2) + '\n', { mode: 0o600 });
    await writeFile(join(folder, `${kind}.receipt.json`), JSON.stringify(saved, null, 2) + '\n',
      { flag: 'wx', mode: 0o600 });
    await naturalEvidenceStatus(participantCode, taskId);
    return saved;
  } finally {
    await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
  }
}

export async function naturalEvidenceReady(participantCode: string, taskId: string) {
  const folder = taskFolder(participantCode, taskId);
  try { await access(join(folder, 'READY.json'), constants.R_OK); return true; }
  catch { return false; }
}

export async function naturalEvidenceFile(participantCode: string, taskId: string, kind: EvidenceKind) {
  if (!(kind in evidenceKinds)) throw new Error('Unsupported evidence kind');
  const folder = taskFolder(participantCode, taskId);
  const saved = await receipt(folder, kind);
  if (!saved || saved.task_id !== taskId) return null;
  const path = join(folder, `${kind}.data`);
  try {
    const file = await stat(path);
    if (!file.isFile() || file.size !== saved.size_bytes) return null;
    return { path, receipt: saved };
  } catch { return null; }
}
