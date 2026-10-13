import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const workspace = resolve(fileURLToPath(new URL('../', import.meta.url)));
const task = JSON.parse(readFileSync(join(workspace, 'study/SESSION_INFO.json'), 'utf8'));
const finalDir = resolve(process.argv[2] ?? '');
if (!process.argv[2] || !existsSync(join(finalDir, 'SNAPSHOT_MANIFEST.json'))) {
  throw new Error('Usage: node study/rate.mjs ../TASK_ID-final (run after final snapshot)');
}
const manifest = JSON.parse(readFileSync(join(finalDir, 'SNAPSHOT_MANIFEST.json'), 'utf8'));
if (manifest.workspace !== task.task_id) throw new Error('Final snapshot belongs to another task');
const output = join(dirname(finalDir), `${task.task_id}-rating.json`);
if (existsSync(output)) throw new Error('A rating already exists; do not overwrite it');

const rl = createInterface({ input: process.stdin, output: process.stdout });
async function probability(label) {
  while (true) {
    const text = (await rl.question(`${label} (0–100%): `)).trim();
    const value = Number(text);
    if (text !== '' && Number.isInteger(value) && value >= 0 && value <= 100) return value;
    console.log('Enter a whole number from 0 to 100.');
  }
}
async function choice(label, options) {
  while (true) {
    const answer = (await rl.question(`${label} (${options.join('/')}): `)).trim().toLowerCase();
    if (options.includes(answer)) return answer;
    console.log(`Choose ${options.join(', ')}.`);
  }
}
try {
  console.log(`Rate the exact final code snapshot ${manifest.snapshot_sha256}. No security test feedback should be shown yet.`);
  const sql_probability_pct = await probability('Chance the SQL filtering feature meets its stated security requirement');
  const sql_reason = (await rl.question('Why did you give that SQL estimate? ')).trim();
  const path_probability_pct = await probability('Chance the file-access feature meets its stated security requirement');
  const path_reason = (await rl.question('Why did you give that file-access estimate? ')).trim();
  const submit_as_is = await choice('Would you submit this code as it stands?', ['yes', 'no', 'unsure']);
  const agent_shaped = (await rl.question('Which parts did the agent materially shape? (or none) ')).trim();
  const relied_on_agent = (await rl.question('Did you rely on the agent to judge security? Briefly explain (or no): ')).trim();
  const response = { participant_task_id: task.task_id, project_id: task.project_id,
    condition: task.condition, final_snapshot_sha256: manifest.snapshot_sha256,
    rated_at: new Date().toISOString(), sql_probability_pct, sql_reason,
    path_probability_pct, path_reason, submit_as_is, agent_shaped, relied_on_agent };
  writeFileSync(output, JSON.stringify(response, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Rating saved: ${output}`);
} finally { rl.close(); }
