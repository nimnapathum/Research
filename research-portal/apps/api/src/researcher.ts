import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException,
  Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DbService } from './db.service';
import { hashPassword, researcherOnly, SessionGuard, type StudyRequest } from './auth';
import { validateSchema } from './forms';
import { ImportService, type UploadInput } from './imports';
import { callCheckpointBridge } from './checkpoint-bridge';

type ReservedTask = { task_id: string; project_id: 'A' | 'B'; condition: 'acceleration' | 'exploration';
  task_order: 1 | 2; checkpoint_order: string[] };

@UseGuards(SessionGuard)
@Controller('researcher')
export class ResearcherController {
  constructor(private readonly db: DbService, private readonly imports: ImportService) {}
  private require(request: StudyRequest) { researcherOnly(request.studyUser); }

  @Get('accounts')
  async accounts(@Req() request: StudyRequest) {
    this.require(request);
    const result = await this.db.query(`SELECT id,username,display_name,created_at,disabled_at
      FROM users WHERE role='researcher' ORDER BY created_at`);
    return result.rows;
  }

  @Post('accounts')
  async createResearcher(@Req() request: StudyRequest,
    @Body() body: { username?: string; displayName?: string }) {
    this.require(request);
    const username = String(body?.username || '').trim().toLowerCase();
    const displayName = String(body?.displayName || '').trim();
    if (!/^[a-z][a-z0-9_-]{2,39}$/.test(username) ||
      displayName.length > 120) throw new BadRequestException('Use a 3–40 character username starting with a letter');
    const password = randomBytes(18).toString('base64url');
    const hash = await hashPassword(password);
    try {
      const account = await this.db.transaction(async (client) => {
        const inserted = await client.query<{ id: string; username: string; display_name: string | null }>(
          `INSERT INTO users(username,password_hash,role,display_name)
           VALUES($1,$2,'researcher',$3) RETURNING id,username,display_name`,
          [username, hash, displayName || null]);
        await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id,details)
          VALUES($1,'create_researcher','user',$2,$3::jsonb)`,
          [request.studyUser.id, inserted.rows[0].id, JSON.stringify({ username })]);
        return inserted.rows[0];
      });
      return { ...account, temporary_password: password };
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('This username already exists');
      throw error;
    }
  }

  @Get('overview')
  async overview(@Req() request: StudyRequest) {
    this.require(request);
    if (process.env.STUDY_PROTOCOL === 'natural') {
      const [counts, progress] = await Promise.all([
        this.db.query(`SELECT
          (SELECT count(*)::int FROM users WHERE role='participant') AS participants,
          (SELECT count(*)::int FROM study_tasks) AS tasks,
          (SELECT count(*)::int FROM questionnaire_responses) AS responses`),
        this.db.query(`SELECT status,count(*)::int AS count FROM study_tasks GROUP BY status ORDER BY status`)
      ]);
      return { counts: { ...counts.rows[0], imports: 0, events: 0 }, progress: progress.rows,
        eventTypes: [], recentImports: [], latestAnalysis: null };
    }
    const [counts, progress, eventTypes, recent, newest] = await Promise.all([
      this.db.query(`SELECT
        (SELECT count(*)::int FROM users WHERE role='participant') AS participants,
        (SELECT count(*)::int FROM study_tasks) AS tasks,
        (SELECT count(*)::int FROM questionnaire_responses) AS responses,
        (SELECT count(*)::int FROM import_batches) AS imports,
        (SELECT count(*)::int FROM captured_events) AS events`),
      this.db.query(`SELECT status,count(*)::int AS count FROM study_tasks GROUP BY status ORDER BY status`),
      this.db.query(`SELECT event_type,count(*)::int AS count FROM captured_events GROUP BY event_type ORDER BY count DESC LIMIT 10`),
      this.db.query(`SELECT i.id,i.kind,i.original_filename,i.imported_count,i.created_at,u.participant_code
        FROM import_batches i LEFT JOIN users u ON u.id=i.participant_id ORDER BY i.created_at DESC LIMIT 8`),
      this.db.query(`SELECT summary,created_at FROM analysis_runs ORDER BY created_at DESC LIMIT 1`)
    ]);
    return { counts: counts.rows[0], progress: progress.rows, eventTypes: eventTypes.rows,
      recentImports: recent.rows, latestAnalysis: newest.rows[0] || null };
  }

  @Get('participants')
  async participants(@Req() request: StudyRequest) {
    this.require(request);
    const users = await this.db.query(`SELECT u.id,u.username,u.participant_code,u.display_name,u.study_phase,u.created_at,
      count(t.id)::int AS task_count,count(t.id) FILTER (WHERE t.status='submitted')::int AS submitted_tasks
      FROM users u LEFT JOIN study_tasks t ON t.participant_id=u.id
      WHERE u.role='participant' GROUP BY u.id ORDER BY u.created_at DESC`);
    const tasks = await this.db.query(`SELECT id,participant_id,external_task_id,project_id,condition,task_order,
      checkpoint_order,status,started_at,submitted_at FROM study_tasks ORDER BY task_order`);
    return { participants: users.rows, tasks: tasks.rows };
  }

  @Get('recordings')
  async recordings(@Req() request: StudyRequest) {
    this.require(request);
    const result = await this.db.query(`SELECT r.id,r.drive_url,r.label,r.notes,r.created_at,
      u.participant_code FROM session_recordings r JOIN users u ON u.id=r.participant_id
      ORDER BY r.created_at DESC`);
    return result.rows;
  }

  @Post('recordings/:participant')
  async addRecording(@Req() request: StudyRequest, @Param('participant') participant: string,
    @Body() body: { driveUrl?: string; label?: string; notes?: string }) {
    this.require(request);
    if (!/^P\d{8}$/.test(participant)) throw new BadRequestException('Invalid participant code');
    const driveUrl = String(body?.driveUrl || '').trim();
    let url: URL;
    try { url = new URL(driveUrl); } catch { throw new BadRequestException('Enter a Google Drive link'); }
    if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com' || url.username || url.password ||
        driveUrl.length > 2048) throw new BadRequestException('Use an HTTPS drive.google.com link');
    const label = String(body?.label || '').trim();
    const notes = String(body?.notes || '').trim();
    if (label.length > 120 || notes.length > 1000) throw new BadRequestException('Recording label or notes are too long');
    const person = await this.db.query<{ id: string }>(`SELECT id FROM users WHERE participant_code=$1 AND role='participant'`, [participant]);
    if (!person.rows[0]) throw new NotFoundException('Participant not found');
    return this.db.transaction(async (client) => {
      const saved = await client.query(`INSERT INTO session_recordings(participant_id,drive_url,label,notes,created_by)
        VALUES($1,$2,$3,$4,$5) RETURNING id,drive_url,label,notes,created_at`,
      [person.rows[0].id, url.toString(), label, notes, request.studyUser.id]);
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id,details)
        VALUES($1,'add_session_recording','session_recording',$2,$3::jsonb)`,
      [request.studyUser.id, saved.rows[0].id, JSON.stringify({ participant_code: participant })]);
      return { ...saved.rows[0], participant_code: participant };
    });
  }

  @Delete('recordings/:id')
  async deleteRecording(@Req() request: StudyRequest, @Param('id') id: string) {
    this.require(request);
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new BadRequestException('Invalid recording ID');
    return this.db.transaction(async (client) => {
      const removed = await client.query(`DELETE FROM session_recordings WHERE id=$1 RETURNING id`, [id]);
      if (!removed.rows[0]) throw new NotFoundException('Recording link not found');
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id)
        VALUES($1,'delete_session_recording','session_recording',$2)`, [request.studyUser.id, id]);
      return { deleted: true };
    });
  }

  @Post('participants')
  async createParticipant(@Req() request: StudyRequest,
    @Body() body: { displayName?: string; studyPhase?: string }) {
    this.require(request);
    if (process.env.CHECKPOINT_BRIDGE_ENABLED !== '1') {
      throw new BadRequestException('Start the study assignment service before creating participants');
    }
    const displayName = String(body?.displayName || '').trim();
    if (displayName.length > 120) throw new BadRequestException('Name must be at most 120 characters');
    const studyPhase = body?.studyPhase ?? 'rehearsal';
    if (!['rehearsal', 'pilot', 'main'].includes(studyPhase)) {
      throw new BadRequestException('Choose rehearsal, pilot, or main study phase');
    }
    const password = randomBytes(18).toString('base64url');
    const hash = await hashPassword(password);
    let code = '';
    let reserved = false;
    try {
      const result = await this.db.transaction(async (client) => {
        // Serialize portal reservations so the checkpoint allocator's block order
        // and portal accounts stay in the same order under concurrent requests.
        await client.query('SELECT pg_advisory_xact_lock(827451, 1)');
        let reservation: Record<string, unknown> | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          code = `P${randomInt(10_000_000, 100_000_000)}`;
          const exists = await client.query('SELECT 1 FROM users WHERE participant_code=$1', [code]);
          if (exists.rowCount) continue;
          try {
            reservation = callCheckpointBridge({ command: 'reserve', participant_code: code });
            reserved = true;
            break;
          } catch (error) {
            if ((error as Error).message === 'Participant ID already exists') continue;
            throw error;
          }
        }
        if (!reservation) throw new ConflictException('Could not allocate a unique participant ID; try again');
        const tasks = reservation?.tasks as ReservedTask[] | undefined;
        if (!Array.isArray(tasks) || tasks.length !== 2 ||
            new Set(tasks.map((task) => task.project_id)).size !== 2 ||
            new Set(tasks.map((task) => task.condition)).size !== 2 ||
            tasks.some((task, index) => task.task_id !== `${code}-T${index + 1}` || task.task_order !== index + 1 ||
              !Array.isArray(task.checkpoint_order) || task.checkpoint_order.length !== 4)) {
          throw new Error('Checkpoint service returned an invalid assignment');
        }
        const user = await client.query<{ id: string }>(`INSERT INTO users(username,password_hash,role,participant_code,display_name,study_phase)
          VALUES($1,$2,'participant',$3,$4,$5) RETURNING id`,
        [code.toLowerCase(), hash, code, displayName || null, studyPhase]);
        for (const task of tasks) {
          await client.query(`INSERT INTO study_tasks
            (participant_id,external_task_id,project_id,condition,task_order,checkpoint_order)
            VALUES($1,$2,$3,$4,$5,$6::jsonb)`,
          [user.rows[0].id, task.task_id, task.project_id, task.condition,
            task.task_order, JSON.stringify(task.checkpoint_order)]);
        }
        await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id,details)
          VALUES($1,'create_participant','user',$2,$3::jsonb)`,
        [request.studyUser.id, user.rows[0].id, JSON.stringify({ participant_code: code, study_phase: studyPhase })]);
        return { ...user.rows[0], tasks };
      });
      return { ...result, username: code.toLowerCase(), participant_code: code,
        study_phase: studyPhase, temporary_password: password };
    } catch (error) {
      if (reserved) {
        try { callCheckpointBridge({ command: 'cancel-reservation', participant_code: code }); }
        catch (cleanupError) { console.error('Checkpoint reservation needs reconciliation', code, cleanupError); }
      }
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Participant ID already exists; try again');
      throw error;
    }
  }

  @Patch('tasks/:id/status')
  async updateTask(@Req() request: StudyRequest, @Param('id') id: string,
    @Body() body: { status?: string }) {
    this.require(request);
    if (!['not_started','in_progress','paused','submitted'].includes(String(body?.status))) {
      throw new BadRequestException('Invalid task status');
    }
    const task = await this.db.query(`UPDATE study_tasks SET status=$1,
      started_at=CASE WHEN $1='not_started' THEN NULL WHEN started_at IS NULL THEN now() ELSE started_at END,
      submitted_at=CASE WHEN $1='submitted' THEN now() ELSE NULL END
      WHERE id=$2 RETURNING id,status`, [body.status, id]);
    if (!task.rows[0]) throw new NotFoundException('Task not found');
    return task.rows[0];
  }

  @Get('questionnaires')
  async questionnaires(@Req() request: StudyRequest) {
    this.require(request);
    const result = await this.db.query(`SELECT q.*,count(r.id)::int AS response_count
      FROM questionnaires q LEFT JOIN questionnaire_responses r ON r.questionnaire_id=q.id
      GROUP BY q.id ORDER BY q.stage,q.version DESC`);
    return result.rows;
  }
  @Post('questionnaires')
  async createQuestionnaire(@Req() request: StudyRequest,
    @Body() body: { slug?: string; title?: string; stage?: string; schema?: unknown }) {
    this.require(request);
    const title = String(body?.title || '').trim();
    const stage = String(body?.stage || '');
    const slug = String(body?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).slice(0, 80);
    if (!title || title.length > 200 || !/^[a-z0-9][a-z0-9-]{1,79}$/.test(slug) ||
      !['pre_task','after_task','after_both','interview'].includes(stage)) {
      throw new BadRequestException('Invalid questionnaire title, slug, or stage');
    }
    const schema = validateSchema(body.schema);
    const result = await this.db.transaction(async (client) => {
      const version = await client.query<{ version: number }>(`SELECT coalesce(max(version),0)+1 AS version
        FROM questionnaires WHERE slug=$1`, [slug]);
      const inserted = await client.query(`INSERT INTO questionnaires(slug,title,stage,version,schema_json)
        VALUES($1,$2,$3,$4,$5::jsonb) RETURNING *`,
      [slug, title, stage, version.rows[0].version, JSON.stringify(schema)]);
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id)
        VALUES($1,'create_questionnaire','questionnaire',$2)`, [request.studyUser.id, inserted.rows[0].id]);
      return inserted.rows[0];
    });
    return result;
  }
  @Post('questionnaires/:id/publish')
  async publish(@Req() request: StudyRequest, @Param('id') id: string) {
    this.require(request);
    return this.db.transaction(async (client) => {
      const selected = await client.query<{ id: string; stage: string; status: string }>(
        'SELECT id,stage,status FROM questionnaires WHERE id=$1 FOR UPDATE', [id]);
      if (!selected.rows[0]) throw new NotFoundException('Questionnaire not found');
      if (selected.rows[0].status !== 'draft') throw new BadRequestException('Only a draft can be published');
      await client.query(`UPDATE questionnaires SET status='archived' WHERE stage=$1 AND status='published'`,
        [selected.rows[0].stage]);
      const result = await client.query(`UPDATE questionnaires SET status='published',published_at=now()
        WHERE id=$1 RETURNING *`, [id]);
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id)
        VALUES($1,'publish_questionnaire','questionnaire',$2)`, [request.studyUser.id, id]);
      return result.rows[0];
    });
  }

  @Get('responses')
  async responses(@Req() request: StudyRequest) {
    this.require(request);
    const result = await this.db.query(`SELECT r.id,u.participant_code,u.study_phase,q.title,q.stage,q.version,
      t.external_task_id,r.answers,r.submitted_at
      FROM questionnaire_responses r JOIN users u ON u.id=r.participant_id
      JOIN questionnaires q ON q.id=r.questionnaire_id
      LEFT JOIN study_tasks t ON t.id=r.task_id
      ORDER BY r.submitted_at DESC LIMIT 1000`);
    return result.rows;
  }

  @Get('natural-assessments')
  async naturalAssessments(@Req() request: StudyRequest) {
    this.require(request);
    const result = await this.db.query(`SELECT DISTINCT ON (a.task_id,a.weakness_class)
      a.id,t.external_task_id AS task_id,u.participant_code,a.weakness_class,a.final_snapshot_sha256,
      a.review_data,a.resolved_security,a.resolved_functionality,a.resolution_note,a.created_at
      FROM natural_assessments a JOIN study_tasks t ON t.id=a.task_id
      JOIN users u ON u.id=t.participant_id
      ORDER BY a.task_id,a.weakness_class,a.created_at DESC,a.id DESC`);
    return result.rows;
  }

  @Post('natural-assessments')
  async recordNaturalAssessment(@Req() request: StudyRequest, @Body() body: {
    taskId?: string; weaknessClass?: string; finalHash?: string;
    reviews?: { reviewerCode?: string; security?: string; functionality?: string; inferredCondition?: boolean }[];
    resolvedSecurity?: string; resolvedFunctionality?: string; resolutionNote?: string
  }) {
    this.require(request);
    if (process.env.STUDY_PROTOCOL !== 'natural') throw new BadRequestException('Natural assessment is disabled');
    if (!/^[0-9a-f-]{36}$/.test(String(body?.taskId)) || !['sql','path'].includes(String(body?.weaknessClass)) ||
        !/^sha256:[a-f0-9]{64}$/.test(String(body?.finalHash))) throw new BadRequestException('Invalid task, class, or final hash');
    const securityLabels = ['target_secure','vulnerable','not_implemented','unassessable'];
    const functionLabels = ['pass','fail','not_implemented','unassessable'];
    const reviews = body.reviews;
    if (!Array.isArray(reviews) || reviews.length !== 2 || reviews.some((item) =>
      !/^[A-Za-z0-9_-]{2,50}$/.test(String(item.reviewerCode)) ||
      !securityLabels.includes(String(item.security)) || !functionLabels.includes(String(item.functionality)) ||
      (item.security === 'not_implemented') !== (item.functionality === 'not_implemented') ||
      typeof item.inferredCondition !== 'boolean') ||
      reviews[0].reviewerCode === reviews[1].reviewerCode ||
      !securityLabels.includes(String(body.resolvedSecurity)) || !functionLabels.includes(String(body.resolvedFunctionality)) ||
      (body.resolvedSecurity === 'not_implemented') !== (body.resolvedFunctionality === 'not_implemented')) {
      throw new BadRequestException('Enter two distinct reviewer codes and complete security/functionality labels');
    }
    const note = String(body.resolutionNote || '').trim();
    const disagreement = reviews[0].security !== reviews[1].security || reviews[0].functionality !== reviews[1].functionality;
    if (note.length < 10 || note.length > 2000 ||
        (!disagreement && (body.resolvedSecurity !== reviews[0].security || body.resolvedFunctionality !== reviews[0].functionality))) {
      throw new BadRequestException('Record review evidence, explain disagreements, and retain agreed labels when both reviews match');
    }
    const task = await this.db.query<{ external_task_id: string; participant_code: string }>(`SELECT t.external_task_id,u.participant_code
      FROM study_tasks t JOIN users u ON u.id=t.participant_id WHERE t.id=$1`, [body.taskId]);
    if (!task.rows[0] || !/^P\d{8}$/.test(task.rows[0].participant_code) ||
        !/^P\d{8}-T[12]$/.test(task.rows[0].external_task_id) ||
        !task.rows[0].external_task_id.startsWith(`${task.rows[0].participant_code}-`)) {
      throw new NotFoundException('Natural task not found');
    }
    const root = process.env.STUDY_EVIDENCE_ROOT;
    if (!root) throw new BadRequestException('Evidence storage is unavailable');
    let storedHash = '';
    try {
      const folder = join(root, task.rows[0].participant_code, task.rows[0].external_task_id);
      const bytes = readFileSync(join(folder, 'final_manifest.data'));
      const receipt = JSON.parse(readFileSync(join(folder, 'final_manifest.receipt.json'), 'utf8'));
      if (receipt.task_id !== task.rows[0].external_task_id || receipt.kind !== 'final_manifest' ||
          receipt.size_bytes !== bytes.length || receipt.sha256 !== createHash('sha256').update(bytes).digest('hex')) {
        throw new Error('Manifest receipt mismatch');
      }
      storedHash = JSON.parse(bytes.toString('utf8')).snapshot_sha256;
    } catch { throw new BadRequestException('Final snapshot manifest must be uploaded first'); }
    if (storedHash !== body.finalHash) throw new BadRequestException('Review hash does not match the uploaded final snapshot');
    return this.db.transaction(async (client) => {
      const saved = await client.query<{ id: string }>(`INSERT INTO natural_assessments
        (task_id,weakness_class,final_snapshot_sha256,review_data,resolved_security,resolved_functionality,resolution_note,recorded_by)
        VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8) RETURNING id`,
      [body.taskId, body.weaknessClass, body.finalHash, JSON.stringify(reviews),
        body.resolvedSecurity, body.resolvedFunctionality, note, request.studyUser.id]);
      await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id,details)
        VALUES($1,'record_natural_assessment','natural_assessment',$2,$3::jsonb)`,
      [request.studyUser.id, saved.rows[0].id, JSON.stringify({ task_id: task.rows[0].external_task_id,
        weakness_class: body.weaknessClass, final_hash: body.finalHash, disagreement })]);
      return { id: saved.rows[0].id, task_id: task.rows[0].external_task_id, weakness_class: body.weaknessClass };
    });
  }

  @Post('imports')
  async upload(@Req() request: StudyRequest, @Body() body: UploadInput) {
    this.require(request);
    return this.imports.ingest(request.studyUser, body);
  }
  @Get('imports')
  async importsList(@Req() request: StudyRequest) {
    this.require(request);
    const result = await this.db.query(`SELECT i.id,i.kind,i.original_filename,i.sha256,i.imported_count,i.created_at,
      u.participant_code,t.external_task_id FROM import_batches i
      LEFT JOIN users u ON u.id=i.participant_id LEFT JOIN study_tasks t ON t.id=i.task_id
      ORDER BY i.created_at DESC LIMIT 200`);
    return result.rows;
  }

  @Get('analytics')
  async analytics(@Req() request: StudyRequest) {
    this.require(request);
    const [latest, byCondition, byClass, eventsByDay, flags] = await Promise.all([
      this.db.query('SELECT summary,created_at FROM analysis_runs ORDER BY created_at DESC LIMIT 1'),
      this.db.query(`SELECT condition,count(*) FILTER (WHERE eligible_exposure)::int AS exposed,
        count(*) FILTER (WHERE brier IS NOT NULL)::int AS scored,
        avg(brier) AS mean_brier,
        count(*) FILTER (WHERE exposed_vulnerable)::int AS vulnerable_exposed,
        count(*) FILTER (WHERE final_target_retained)::int AS target_retained
        FROM analysis_opportunities GROUP BY condition ORDER BY condition`),
      this.db.query(`SELECT weakness_class,count(*) FILTER (WHERE eligible_exposure)::int AS exposed,
        avg(brier) AS mean_brier FROM analysis_opportunities GROUP BY weakness_class ORDER BY weakness_class`),
      this.db.query(`SELECT date_trunc('day',occurred_at)::date AS day,count(*)::int AS count
        FROM captured_events GROUP BY day ORDER BY day DESC LIMIT 14`),
      this.db.query(`SELECT u.participant_code,
        count(DISTINCT t.id)::int AS tasks,
        count(DISTINCT r.id)::int AS responses,
        count(DISTINCT e.id)::int AS events
        FROM users u LEFT JOIN study_tasks t ON t.participant_id=u.id
        LEFT JOIN questionnaire_responses r ON r.participant_id=u.id
        LEFT JOIN captured_events e ON e.participant_id=u.id
        WHERE u.role='participant' GROUP BY u.id ORDER BY u.participant_code`)
    ]);
    return { latestSummary: latest.rows[0] || null, byCondition: byCondition.rows,
      byClass: byClass.rows, eventsByDay: eventsByDay.rows.reverse(), participantCoverage: flags.rows };
  }

  @Get('export')
  async export(@Req() request: StudyRequest) {
    this.require(request);
    const [users, tasks, questionnaires, responses, imports, events, summaries, opportunities, recordings, naturalAssessments] = await Promise.all([
      this.db.query(`SELECT id,username,role,participant_code,study_phase,display_name,created_at FROM users ORDER BY created_at`),
      this.db.query('SELECT * FROM study_tasks ORDER BY created_at'),
      this.db.query('SELECT * FROM questionnaires ORDER BY created_at'),
      this.db.query('SELECT * FROM questionnaire_responses ORDER BY submitted_at'),
      this.db.query(`SELECT id,uploaded_by,participant_id,task_id,kind,original_filename,sha256,imported_count,created_at
        FROM import_batches ORDER BY created_at`),
      this.db.query('SELECT * FROM captured_events ORDER BY occurred_at'),
      this.db.query('SELECT * FROM analysis_runs ORDER BY created_at'),
      this.db.query('SELECT * FROM analysis_opportunities ORDER BY import_id,row_number'),
      this.db.query('SELECT id,participant_id,drive_url,label,notes,created_by,created_at FROM session_recordings ORDER BY created_at'),
      this.db.query('SELECT * FROM natural_assessments ORDER BY created_at')
    ]);
    return { exported_at_utc: new Date().toISOString(), schema_version: 'portal-4',
      users: users.rows, tasks: tasks.rows, questionnaires: questionnaires.rows,
      responses: responses.rows, imports: imports.rows, events: events.rows,
      summaries: summaries.rows, opportunities: opportunities.rows, recordings: recordings.rows,
      natural_assessments: naturalAssessments.rows };
  }
}
