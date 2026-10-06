import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException,
  Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DbService } from './db.service';
import { hashPassword, researcherOnly, SessionGuard, type StudyRequest } from './auth';
import { validateSchema } from './forms';
import { ImportService, type UploadInput } from './imports';

type TaskInput = { projectId: 'A' | 'B'; condition: 'acceleration' | 'exploration';
  taskOrder: 1 | 2; externalTaskId: string; checkpointOrder?: string[] };

@UseGuards(SessionGuard)
@Controller('researcher')
export class ResearcherController {
  constructor(private readonly db: DbService, private readonly imports: ImportService) {}
  private require(request: StudyRequest) { researcherOnly(request.studyUser); }

  @Get('overview')
  async overview(@Req() request: StudyRequest) {
    this.require(request);
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
    const users = await this.db.query(`SELECT u.id,u.email,u.participant_code,u.display_name,u.created_at,
      count(t.id)::int AS task_count,count(t.id) FILTER (WHERE t.status='submitted')::int AS submitted_tasks
      FROM users u LEFT JOIN study_tasks t ON t.participant_id=u.id
      WHERE u.role='participant' GROUP BY u.id ORDER BY u.created_at DESC`);
    const tasks = await this.db.query(`SELECT id,participant_id,external_task_id,project_id,condition,task_order,
      checkpoint_order,status,started_at,submitted_at FROM study_tasks ORDER BY task_order`);
    return { participants: users.rows, tasks: tasks.rows };
  }

  @Post('participants')
  async createParticipant(@Req() request: StudyRequest,
    @Body() body: { email?: string; participantCode?: string; displayName?: string; tasks?: TaskInput[] }) {
    this.require(request);
    const email = String(body?.email || '').trim().toLowerCase();
    const code = String(body?.participantCode || '').trim().toUpperCase();
    const tasks = body?.tasks;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^P\d{3,}$/.test(code) ||
      !Array.isArray(tasks) || tasks.length !== 2 ||
      new Set(tasks.map((task) => task.taskOrder)).size !== 2 ||
      new Set(tasks.map((task) => task.projectId)).size !== 2 ||
      new Set(tasks.map((task) => task.condition)).size !== 2) {
      throw new BadRequestException('Provide a participant email/code and one task for each project, condition, and order');
    }
    for (const task of tasks) {
      if (!['A','B'].includes(task.projectId) || !['acceleration','exploration'].includes(task.condition) ||
        ![1,2].includes(task.taskOrder) || task.externalTaskId !== `${code}-T${task.taskOrder}` ||
        !Array.isArray(task.checkpointOrder) || task.checkpointOrder.length !== 4 ||
        new Set(task.checkpointOrder).size !== 4 ||
        task.checkpointOrder.some((item) => !['Q1','Q2','F1','F2'].includes(item))) {
        throw new BadRequestException('Task assignment must exactly match the existing study-system assignment');
      }
    }
    const password = randomBytes(18).toString('base64url');
    const hash = await hashPassword(password);
    try {
      const result = await this.db.transaction(async (client) => {
        const user = await client.query<{ id: string }>(`INSERT INTO users(email,password_hash,role,participant_code,display_name)
          VALUES($1,$2,'participant',$3,$4) RETURNING id`,
        [email, hash, code, String(body.displayName || '').trim().slice(0, 120) || null]);
        for (const task of tasks) {
          await client.query(`INSERT INTO study_tasks
            (participant_id,external_task_id,project_id,condition,task_order,checkpoint_order)
            VALUES($1,$2,$3,$4,$5,$6::jsonb)`,
          [user.rows[0].id, task.externalTaskId, task.projectId, task.condition,
            task.taskOrder, JSON.stringify(task.checkpointOrder)]);
        }
        await client.query(`INSERT INTO audit_actions(actor_id,action,target_type,target_id,details)
          VALUES($1,'create_participant','user',$2,$3::jsonb)`,
        [request.studyUser.id, user.rows[0].id, JSON.stringify({ participant_code: code })]);
        return user.rows[0];
      });
      return { ...result, email, participant_code: code, temporary_password: password };
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Email, participant code, or task ID already exists');
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
    const result = await this.db.query(`SELECT r.id,u.participant_code,q.title,q.stage,q.version,
      t.external_task_id,r.answers,r.submitted_at
      FROM questionnaire_responses r JOIN users u ON u.id=r.participant_id
      JOIN questionnaires q ON q.id=r.questionnaire_id
      LEFT JOIN study_tasks t ON t.id=r.task_id
      ORDER BY r.submitted_at DESC LIMIT 1000`);
    return result.rows;
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
    const [users, tasks, questionnaires, responses, imports, events, summaries, opportunities] = await Promise.all([
      this.db.query(`SELECT id,email,role,participant_code,display_name,created_at FROM users ORDER BY created_at`),
      this.db.query('SELECT * FROM study_tasks ORDER BY created_at'),
      this.db.query('SELECT * FROM questionnaires ORDER BY created_at'),
      this.db.query('SELECT * FROM questionnaire_responses ORDER BY submitted_at'),
      this.db.query(`SELECT id,uploaded_by,participant_id,task_id,kind,original_filename,sha256,imported_count,created_at
        FROM import_batches ORDER BY created_at`),
      this.db.query('SELECT * FROM captured_events ORDER BY occurred_at'),
      this.db.query('SELECT * FROM analysis_runs ORDER BY created_at'),
      this.db.query('SELECT * FROM analysis_opportunities ORDER BY import_id,row_number')
    ]);
    return { exported_at_utc: new Date().toISOString(), schema_version: 'portal-1',
      users: users.rows, tasks: tasks.rows, questionnaires: questionnaires.rows,
      responses: responses.rows, imports: imports.rows, events: events.rows,
      summaries: summaries.rows, opportunities: opportunities.rows };
  }
}
