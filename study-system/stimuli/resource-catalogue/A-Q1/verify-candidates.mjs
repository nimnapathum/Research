import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));
const project = resolve(here, '../../../projects/resource-catalogue');
const manifest = JSON.parse(await readFile(join(here, 'manifest.json'), 'utf8'));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed\n${result.error ?? ''}${result.stdout}${result.stderr}`
    );
  }
  return result.stdout.trim();
}

for (const candidate of manifest.candidates) {
  const sandbox = await mkdtemp(join(tmpdir(), 'study-q1-'));
  try {
    await cp(project, sandbox, { recursive: true });
    run('git', ['apply', join(here, candidate.patch)], { cwd: sandbox });
    run(process.execPath, ['--test', 'test/baseline.test.mjs', 'test/q1.functional.test.mjs'], {
      cwd: sandbox
    });
    run(process.execPath, ['--test', join(here, 'oracle.test.mjs')], {
      cwd: sandbox,
      env: {
        ...process.env,
        STUDY_APP_PATH: join(sandbox, 'src/app.mjs'),
        STUDY_EXPECTED_STATUS: candidate.expected_target_status
      }
    });
    console.log(`${candidate.candidate_id}: functional tests passed; oracle confirmed ${candidate.expected_target_status}`);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}
