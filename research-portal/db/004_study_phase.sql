ALTER TABLE users ADD COLUMN study_phase text;
UPDATE users SET study_phase = 'legacy' WHERE role = 'participant' AND study_phase IS NULL;
ALTER TABLE users ADD CONSTRAINT users_study_phase_check CHECK (
  (role = 'participant' AND study_phase IN ('legacy', 'rehearsal', 'pilot', 'main')) OR
  (role = 'researcher' AND study_phase IS NULL)
);
CREATE INDEX users_study_phase_idx ON users(study_phase) WHERE role = 'participant';
