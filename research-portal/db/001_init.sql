CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('researcher', 'participant')),
  participant_code text UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CHECK ((role = 'participant' AND participant_code IS NOT NULL) OR
         (role = 'researcher' AND participant_code IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS login_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS login_sessions_user_idx ON login_sessions(user_id);

CREATE TABLE IF NOT EXISTS study_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_task_id text UNIQUE,
  project_id text NOT NULL CHECK (project_id IN ('A', 'B')),
  condition text NOT NULL CHECK (condition IN ('acceleration', 'exploration')),
  task_order smallint NOT NULL CHECK (task_order IN (1, 2)),
  checkpoint_order jsonb NOT NULL DEFAULT '["Q1","Q2","F1","F2"]'::jsonb,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','submitted','paused')),
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, task_order)
);

CREATE TABLE IF NOT EXISTS questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('pre_task','after_task','after_both','interview')),
  version integer NOT NULL DEFAULT 1,
  schema_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE(slug, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS questionnaires_one_published_stage ON questionnaires(stage) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id uuid NOT NULL REFERENCES questionnaires(id),
  participant_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES study_tasks(id) ON DELETE SET NULL,
  answers jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  submission_key text NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS responses_participant_idx ON questionnaire_responses(participant_id);

CREATE TABLE IF NOT EXISTS import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL REFERENCES users(id),
  participant_id uuid REFERENCES users(id) ON DELETE SET NULL,
  task_id uuid REFERENCES study_tasks(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('events_json','events_jsonl','analysis_summary','opportunities_csv')),
  original_filename text NOT NULL,
  sha256 text NOT NULL,
  raw_text text NOT NULL,
  imported_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, kind, sha256)
);

CREATE TABLE IF NOT EXISTS captured_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES study_tasks(id) ON DELETE SET NULL,
  source_event_id text NOT NULL,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  UNIQUE(participant_id, source_event_id)
);
CREATE INDEX IF NOT EXISTS captured_events_participant_time_idx ON captured_events(participant_id, occurred_at);
CREATE INDEX IF NOT EXISTS captured_events_type_idx ON captured_events(event_type);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL UNIQUE REFERENCES import_batches(id) ON DELETE CASCADE,
  summary jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS analysis_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  participant_code text,
  condition text,
  weakness_class text,
  eligible_exposure boolean,
  brier double precision,
  exposed_vulnerable boolean,
  final_target_retained boolean,
  row_json jsonb NOT NULL,
  UNIQUE(import_id, row_number)
);
CREATE INDEX IF NOT EXISTS analysis_opportunities_condition_idx ON analysis_opportunities(condition, weakness_class);

CREATE TABLE IF NOT EXISTS audit_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
