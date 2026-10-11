ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
UPDATE users SET username = lower(participant_code)
  WHERE role = 'participant' AND username IS NULL;
WITH legacy AS (
  SELECT id, lower(split_part(email, '@', 1)) AS candidate,
    count(*) OVER (PARTITION BY lower(split_part(email, '@', 1))) AS copies
  FROM users WHERE role = 'researcher'
)
UPDATE users AS u SET username = CASE
  WHEN legacy.candidate ~ '^[a-z][a-z0-9_-]{2,39}$'
    AND legacy.copies = 1
    AND NOT EXISTS (SELECT 1 FROM users AS p WHERE p.username = legacy.candidate)
  THEN legacy.candidate ELSE 'researcher-' || substr(u.id::text, 1, 8) END
FROM legacy WHERE u.id = legacy.id AND u.username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_format
  CHECK (username ~ '^[a-z][a-z0-9_-]{2,39}$');
CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username));
