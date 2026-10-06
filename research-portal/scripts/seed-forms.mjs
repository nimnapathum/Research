import { readFileSync } from 'node:fs';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const defaults = JSON.parse(readFileSync('data/default-forms.json', 'utf8'));
try {
  for (const stage of ['pre_task', 'after_task', 'after_both']) {
    const form = defaults.forms[stage];
    await pool.query(`INSERT INTO questionnaires(slug, title, stage, version, schema_json, status, published_at)
      VALUES($1,$2,$3,1,$4::jsonb,'published',now()) ON CONFLICT(slug,version) DO NOTHING`,
    [stage, form.title, stage, JSON.stringify({ items: form.items, source_version: defaults.version })]);
  }
  await pool.query(`INSERT INTO questionnaires(slug,title,stage,version,schema_json,status)
    VALUES('interview-notes','Replay interview notes','interview',1,$1::jsonb,'draft')
    ON CONFLICT(slug,version) DO NOTHING`, [JSON.stringify({ items: [
      { id: 'goal', label: 'What were you trying to accomplish in the selected episode?', type: 'text', required: true, maxLength: 2000 },
      { id: 'checks', label: 'What did you check before and after the first decision?', type: 'text', required: false, maxLength: 2000 },
      { id: 'uncertainty', label: 'What uncertainty did you have about the proposed code?', type: 'text', required: false, maxLength: 2000 }
    ], source_version: 'portal-draft-1' })]);
  console.log('Seeded the existing study questionnaires and a draft interview form.');
} finally { await pool.end(); }
