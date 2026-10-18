import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException,
  Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SessionGuard, type StudyRequest } from './auth';
import { DbService } from './db.service';
import { validateAnswers } from './forms';
import { ImportService, type UploadInput } from './imports';
import { callCheckpointBridge } from './checkpoint-bridge';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@UseGuards(SessionGuard)
@Controller('participant')
export class ParticipantController {
  constructor(private readonly db: DbService, private readonly imports: ImportService) {}
  private finalRatingReady(participantCode: string | null, taskId: string): boolean {
    const root = process.env.STUDY_EVIDENCE_ROOT;
    if (!root || !participantCode || !/^P\d{8}$/.test(participantCode) ||
        !taskId.startsWith(`${participantCode}-T`)) return false;
    try {
      const folder = join(root, participantCode, taskId);
      const manifest = JSON.parse(readFileSync(join(folder, 'final_manifest.data'), 'utf8'));
      const rating = JSON.parse(readFileSync(join(folder, 'rating_json.data'), 'utf8'));
      return manifest.workspace === taskId && rating.participant_task_id === taskId &&
        /^sha256:[a-f0-9]{64}$/.test(manifest.snapshot_sha256) &&
        manifest.snapshot_sha256 === rating.final_snapshot_sha256 && manifest.protocol_version === rating.protocol_version;
    } catch { return false; }
  }
  private schemaFor(stage: string, schema: unknown) {
    if (process.env.STUDY_PROTOCOL !== 'natural' || stage !== 'pre_task' ||
        !schema || typeof schema !== 'object') return schema;
    const source = schema as { items?: Array<{ id?: string }> };
    return { ...source, items: (source.items || []).filter((item) =>
      item.id !== 'sql_baseline' && item.id !== 'path_baseline') };
  }
  private participant(request: StudyRequest) {
    if (request.studyUser.role !== 'participant') throw new ForbiddenException('Participant access required');
    return request.studyUser;
  }
  private async checkpointContext(user: StudyRequest['studyUser']) {
    const tasks = await this.db.query<{ id: string; external_task_id: string; project_id: string;
      condition: string; task_order: number; checkpoint_order: string[] }>(`SELECT id,external_task_id,project_id,
      condition,task_order,checkpoint_order FROM study_tasks WHERE participant_id=$1 ORDER BY task_order`, [user.id]);
    const pre = await this.db.query<{ answers: Record<string, unknown> }>(`SELECT r.answers FROM questionnaire_responses r
      JOIN questionnaires q ON q.id=r.questionnaire_id WHERE r.participant_id=$1 AND q.stage='pre_task'
      ORDER BY r.submitted_at DESC LIMIT 1`, [user.id]);
    if (!pre.rows[0]) throw new BadRequestException('Complete the pre-task questionnaire first');
    return { participant_code: user.participant_code, pre_answers: pre.rows[0].answers,
      tasks: tasks.rows.map((task) => ({ task_id: task.external_task_id, project_id: task.project_id,
        condition: task.condition, task_order: task.task_order, checkpoint_order: task.checkpoint_order })),
      taskRows: tasks.rows };
  }
  @Get('dashboard')
  async dashboard(@Req() request: StudyRequest) {
    const user = this.participant(request);
    const tasks = await this.db.query(`SELECT id,external_task_id,project_id,condition,task_order,checkpoint_order,
      status,started_at,submitted_at FROM study_tasks WHERE participant_id=$1 ORDER BY task_order`, [user.id]);
    const forms = await this.db.query(`SELECT q.id,q.title,q.stage,q.version,q.schema_json,
      r.id AS response_id,r.task_id AS response_task_id,r.submitted_at
      FROM questionnaires q LEFT JOIN questionnaire_responses r ON r.questionnaire_id=q.id AND r.participant_id=$1
      WHERE q.status='published' ORDER BY CASE q.stage
      WHEN 'pre_task' THEN 1 WHEN 'after_task' THEN 2 WHEN 'after_both' THEN 3 ELSE 4 END`, [user.id]);
    const uploads = await this.db.query(`SELECT id,kind,original_filename,imported_count,created_at
      FROM import_batches WHERE participant_id=$1 ORDER BY created_at DESC LIMIT 20`, [user.id]);
    return { user, tasks: tasks.rows.map((task) => ({ ...task,
      final_rating_received: process.env.STUDY_PROTOCOL === 'natural' &&
        this.finalRatingReady(user.participant_code, task.external_task_id) })), questionnaires: forms.rows.map((form) =>
      ({ ...form, schema_json: this.schemaFor(form.stage, form.schema_json) })), uploads: uploads.rows };
  }
  @Get('questionnaires/:id')
  async questionnaire(@Req() request: StudyRequest, @Param('id') id: string) {
    const user = this.participant(request);
    const form = await this.db.query(`SELECT id,title,stage,version,schema_json FROM questionnaires
      WHERE id=$1 AND status='published'`, [id]);
    if (!form.rows[0]) throw new NotFoundException('Questionnaire unavailable');
    const answers = await this.db.query(`SELECT task_id,answers,submitted_at FROM questionnaire_responses
      WHERE questionnaire_id=$1 AND participant_id=$2 ORDER BY submitted_at`, [id, user.id]);
    return { ...form.rows[0], schema_json: this.schemaFor(form.rows[0].stage, form.rows[0].schema_json),
      responses: answers.rows };
  }
  @Post('responses')
  async respond(@Req() request: StudyRequest, @Body() body: { questionnaireId?: string; taskId?: string; answers?: unknown }) {
    const user = this.participant(request);
    const form = await this.db.query<{ id: string; stage: string; schema_json: unknown }>(`SELECT id,stage,schema_json
      FROM questionnaires WHERE id=$1 AND status='published'`, [body?.questionnaireId]);
    if (!form.rows[0]) throw new NotFoundException('Questionnaire unavailable');
    const taskSpecific = form.rows[0].stage === 'after_task';
    if (taskSpecific !== Boolean(body.taskId)) throw new BadRequestException('Task selection does not match questionnaire stage');
    if (taskSpecific) {
      const task = await this.db.query('SELECT external_task_id,status FROM study_tasks WHERE id=$1 AND participant_id=$2', [body.taskId, user.id]);
      if (!task.rowCount) throw new ForbiddenException('Task does not belong to this participant');
      if (process.env.STUDY_PROTOCOL === 'natural' &&
          !this.finalRatingReady(user.participant_code, task.rows[0].external_task_id)) {
        throw new BadRequestException('Save and upload the final manifest and security rating before the after-task form');
      }
    }
    if (form.rows[0].stage === 'after_both') {
      const completed = await this.db.query(`SELECT t.id FROM study_tasks t WHERE t.participant_id=$1
        AND t.status='submitted' AND EXISTS (SELECT 1 FROM questionnaire_responses r JOIN questionnaires q
        ON q.id=r.questionnaire_id WHERE r.participant_id=$1 AND r.task_id=t.id AND q.stage='after_task')`, [user.id]);
      if (completed.rowCount !== 2) throw new BadRequestException('Complete both tasks and their after-task forms first');
    }
    const answers = validateAnswers(this.schemaFor(form.rows[0].stage, form.rows[0].schema_json), body.answers);
    if (['after_task', 'after_both'].includes(form.rows[0].stage) &&
        process.env.CHECKPOINT_BRIDGE_ENABLED === '1' && process.env.STUDY_PROTOCOL !== 'natural') {
      const context = await this.checkpointContext(user);
      const selected = context.taskRows.find((task) => task.id === body.taskId);
      try {
        callCheckpointBridge({ command: 'mirror-form', ...context,
          task_id: selected?.external_task_id, kind: form.rows[0].stage, answers });
      } catch (error) { throw new BadRequestException((error as Error).message); }
    }
    const key = `${form.rows[0].id}:${user.id}:${body.taskId || 'session'}`;
    try {
      const result = await this.db.query(`INSERT INTO questionnaire_responses
        (questionnaire_id,participant_id,task_id,answers,submission_key)
        VALUES($1,$2,$3,$4::jsonb,$5) RETURNING id,submitted_at`,
      [form.rows[0].id, user.id, body.taskId || null, JSON.stringify(answers), key]);
      await this.db.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id)
        VALUES($1,'submit_questionnaire','questionnaire',$2)`, [user.id, form.rows[0].id]);
      return result.rows[0];
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new BadRequestException('This questionnaire was already submitted');
      throw error;
    }
  }
  @Patch('tasks/:id/status')
  async updateTask(@Req() request: StudyRequest, @Param('id') id: string,
    @Body() body: { status?: string }) {
    const user = this.participant(request);
    if (!['in_progress', 'paused', 'submitted'].includes(String(body?.status))) throw new BadRequestException('Invalid task status');
    const context = await this.checkpointContext(user);
    const selectedTask = context.taskRows.find((task) => task.id === id);
    if (!selectedTask) throw new NotFoundException('Task not found');
    if (context.taskRows[1]?.id === id) {
      const first = context.taskRows[0];
      const ready = await this.db.query(`SELECT 1 FROM study_tasks t WHERE t.id=$1 AND t.status='submitted'
        AND EXISTS (SELECT 1 FROM questionnaire_responses r JOIN questionnaires q ON q.id=r.questionnaire_id
          WHERE r.participant_id=$2 AND r.task_id=t.id AND q.stage='after_task')`, [first.id, user.id]);
      if (!ready.rowCount) throw new BadRequestException('Complete Task 1 and its after-task form first');
    }
    const current = await this.db.query('SELECT status FROM study_tasks WHERE id=$1', [id]);
    if (current.rows[0]?.status === 'submitted' && body.status !== 'submitted') {
      throw new BadRequestException('This task is already submitted; ask the researcher to record a correction');
    }
    if (body.status === 'submitted' && process.env.STUDY_PROTOCOL === 'natural') {
      const afterTask = await this.db.query(`SELECT 1 FROM questionnaire_responses r
        JOIN questionnaires q ON q.id=r.questionnaire_id
        WHERE r.participant_id=$1 AND r.task_id=$2 AND q.stage='after_task'`, [user.id, id]);
      if (!afterTask.rowCount) throw new BadRequestException('Complete this task’s after-task questionnaire before submitting');
      const selected = await this.db.query<{ external_task_id: string }>(
        'SELECT external_task_id FROM study_tasks WHERE id=$1 AND participant_id=$2', [id, user.id]);
      if (!selected.rows[0]) throw new NotFoundException('Task not found');
      const evidenceRoot = process.env.STUDY_EVIDENCE_ROOT;
      if (!evidenceRoot || !user.participant_code) throw new BadRequestException('Natural evidence storage is unavailable');
      try {
        const receipt = JSON.parse(readFileSync(join(evidenceRoot, user.participant_code,
          selected.rows[0].external_task_id, 'READY.json'), 'utf8')) as { task_id?: string };
        if (receipt.task_id !== selected.rows[0].external_task_id) throw new Error('Evidence task mismatch');
      } catch { throw new BadRequestException('Upload all natural-task evidence and resolve receipt issues before submitting'); }
    }
    if (body.status === 'submitted' && process.env.CHECKPOINT_BRIDGE_ENABLED === '1' &&
        process.env.STUDY_PROTOCOL !== 'natural') {
      const context = await this.checkpointContext(user);
      const selected = context.taskRows.find((task) => task.id === id);
      if (!selected) throw new NotFoundException('Task not found');
      try {
        const status = callCheckpointBridge({ command: 'status', ...context,
          task_id: selected.external_task_id });
        if (!status?.final_submitted) throw new BadRequestException('Submit final code on the checkpoint page first');
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        throw new BadRequestException((error as Error).message);
      }
    }
    const result = await this.db.query(`UPDATE study_tasks SET status=$1,
      started_at=CASE WHEN started_at IS NULL THEN now() ELSE started_at END,
      submitted_at=CASE WHEN $1='submitted' THEN now() ELSE submitted_at END
      WHERE id=$2 AND participant_id=$3 RETURNING id,status,started_at,submitted_at`, [body.status, id, user.id]);
    if (!result.rows[0]) throw new NotFoundException('Task not found');
    return result.rows[0];
  }
  @Post('imports')
  async upload(@Req() request: StudyRequest, @Body() body: UploadInput) {
    const user = this.participant(request);
    if (!['events_json', 'events_jsonl'].includes(body?.kind)) throw new BadRequestException('Participants may upload event exports only');
    return this.imports.ingest(user, { ...body, participantId: user.id });
  }
}
