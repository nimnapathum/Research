CREATE TABLE natural_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES study_tasks(id) ON DELETE CASCADE,
  weakness_class text NOT NULL CHECK (weakness_class IN ('sql', 'path')),
  final_snapshot_sha256 text NOT NULL CHECK (final_snapshot_sha256 ~ '^sha256:[a-f0-9]{64}$'),
  review_data jsonb NOT NULL,
  resolved_security text NOT NULL CHECK (resolved_security IN ('target_secure','vulnerable','not_implemented','unassessable')),
  resolved_functionality text NOT NULL CHECK (resolved_functionality IN ('pass','fail','not_implemented','unassessable')),
  resolution_note text NOT NULL,
  recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX natural_assessments_latest_idx ON natural_assessments(task_id, weakness_class, created_at DESC);
