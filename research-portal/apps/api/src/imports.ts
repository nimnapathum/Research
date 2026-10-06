import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { parse } from 'csv-parse/sync';
import { DbService } from './db.service';
import type { StudyUser } from './auth';

export type UploadInput = {
  kind: 'events_json' | 'events_jsonl' | 'analysis_summary' | 'opportunities_csv';
  filename: string; content: string; participantId?: string; taskId?: string;
};
type EventRecord = Record<string, unknown>;

function boolValue(value: unknown): boolean | null {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}
function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function eventRecords(kind: string, content: string): EventRecord[] {
  let rows: unknown;
  try {
    if (kind === 'events_jsonl') rows = content.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
    else {
      const parsed: unknown = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : (parsed as { events?: unknown })?.events;
    }
  } catch { throw new BadRequestException('Invalid JSON event export'); }
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 20_000 ||
      rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new BadRequestException('Expected 1–20,000 event objects');
  }
  return rows as EventRecord[];
}

@Injectable()
export class ImportService {
  constructor(private readonly db: DbService) {}
  async ingest(actor: StudyUser, input: UploadInput) {
    const kind = String(input?.kind || '');
    if (!['events_json','events_jsonl','analysis_summary','opportunities_csv'].includes(kind)) {
      throw new BadRequestException('Unsupported import kind');
    }
    if (typeof input?.content !== 'string' || !input.content.trim() ||
      Buffer.byteLength(input.content, 'utf8') > 5 * 1024 * 1024) throw new BadRequestException('File must be 1 byte to 5 MB');
    const filename = basename(String(input.filename || 'upload')).slice(0, 180);
    const participantId = input.participantId || null;
    const taskId = input.taskId || null;
    if (kind.startsWith('events_') && !participantId) throw new BadRequestException('Select a participant for event data');
    if (!kind.startsWith('events_') && actor.role !== 'researcher') throw new BadRequestException('Researcher access required');
    const participant = participantId ? await this.db.query<{ id: string; participant_code: string }>(
      `SELECT id,participant_code FROM users WHERE id=$1 AND role='participant'`, [participantId]) : null;
    if (participantId && !participant?.rows[0]) throw new NotFoundException('Participant not found');
    const task = taskId ? await this.db.query<{ id: string; external_task_id: string }>(
      `SELECT id,external_task_id FROM study_tasks WHERE id=$1 AND participant_id=$2`, [taskId, participantId]) : null;
    if (taskId && !task?.rows[0]) throw new NotFoundException('Task not found for participant');
    const sha256 = createHash('sha256').update(input.content).digest('hex');
    const already = await this.db.query('SELECT id FROM import_batches WHERE sha256=$1 AND kind=$2 AND participant_id IS NOT DISTINCT FROM $3',
      [sha256, kind, participantId]);
    if (already.rowCount) throw new ConflictException('This file was already imported for that participant');

    let events: EventRecord[] = [];
    let summary: Record<string, unknown> | null = null;
    let opportunities: Record<string, string>[] = [];
    if (kind.startsWith('events_')) events = eventRecords(kind, input.content);
    if (kind === 'analysis_summary') {
      try { summary = JSON.parse(input.content) as Record<string, unknown>; }
      catch { throw new BadRequestException('Invalid summary JSON'); }
      if (!summary || Array.isArray(summary) || typeof summary !== 'object' ||
        typeof summary.exposed_opportunities !== 'number') throw new BadRequestException('Expected study analysis summary.json');
    }
    if (kind === 'opportunities_csv') {
      try { opportunities = parse(input.content, { columns: true, skip_empty_lines: true, bom: true }) as Record<string, string>[]; }
      catch { throw new BadRequestException('Invalid opportunities CSV'); }
      if (opportunities.length < 1 || opportunities.length > 10_000 ||
        !['participant_id','condition','class','eligible_exposure','brier'].every((key) => key in opportunities[0])) {
        throw new BadRequestException('Expected analysis opportunities.csv with required columns');
      }
    }
    return this.db.transaction(async (client) => {
      const batch = await client.query<{ id: string }>(`INSERT INTO import_batches
        (uploaded_by,participant_id,task_id,kind,original_filename,sha256,raw_text)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [actor.id, participantId, taskId, kind, filename, sha256, input.content]);
      const importId = batch.rows[0].id;
      let count = 0;
      if (events.length) {
        for (const [index, item] of events.entries()) {
          const eventType = String(item.event_type || '');
          const time = String(item.timestamp_utc || item.occurred_at || '');
          const occurredAt = new Date(time);
          if (!/^[a-z][a-z0-9_]{1,79}$/.test(eventType) || Number.isNaN(occurredAt.getTime())) {
            throw new BadRequestException(`Invalid event at line/item ${index + 1}`);
          }
          if (item.participant_id && item.participant_id !== participant?.rows[0].participant_code) {
            throw new BadRequestException(`Participant ID mismatch at item ${index + 1}`);
          }
          if (taskId && item.task_id && item.task_id !== task?.rows[0].external_task_id) {
            throw new BadRequestException(`Task ID mismatch at item ${index + 1}`);
          }
          let resolvedTaskId = taskId;
          if (!resolvedTaskId && typeof item.task_id === 'string') {
            const match = await client.query<{ id: string }>(`SELECT id FROM study_tasks
              WHERE participant_id=$1 AND external_task_id=$2`, [participantId, item.task_id]);
            if (!match.rows[0]) throw new BadRequestException(`Unknown task ID at item ${index + 1}`);
            resolvedTaskId = match.rows[0].id;
          }
          const sourceId = String(item.event_id || createHash('sha256').update(JSON.stringify(item)).digest('hex'));
          const inserted = await client.query(`INSERT INTO captured_events
            (import_id,participant_id,task_id,source_event_id,event_type,occurred_at,payload)
            VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)
            ON CONFLICT(participant_id,source_event_id) DO NOTHING`,
          [importId, participantId, resolvedTaskId, sourceId.slice(0, 200), eventType,
            occurredAt.toISOString(), JSON.stringify(item)]);
          count += inserted.rowCount || 0;
        }
      }
      if (summary) {
        await client.query('INSERT INTO analysis_runs(import_id,summary) VALUES($1,$2::jsonb)',
          [importId, JSON.stringify(summary)]);
        count = 1;
      }
      if (opportunities.length) {
        for (const [index, row] of opportunities.entries()) {
          await client.query(`INSERT INTO analysis_opportunities
            (import_id,row_number,participant_code,condition,weakness_class,eligible_exposure,brier,
             exposed_vulnerable,final_target_retained,row_json)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
          [importId, index + 1, row.participant_id || null, row.condition || null, row.class || null,
            boolValue(row.eligible_exposure), numberValue(row.brier), boolValue(row.exposed_vulnerable),
            boolValue(row.final_target_retained), JSON.stringify(row)]);
        }
        count = opportunities.length;
      }
      await client.query('UPDATE import_batches SET imported_count=$1 WHERE id=$2', [count, importId]);
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id,details)
        VALUES($1,'import_file','import',$2,$3::jsonb)`,
      [actor.id, importId, JSON.stringify({ kind, filename, count })]);
      return { id: importId, kind, sha256, imported_count: count, filename };
    });
  }
}
