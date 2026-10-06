import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '..');
const projects = { A: 'resource-catalogue', B: 'support-archive' };

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.error ?? ''}${result.stdout}${result.stderr}`);
  }
}

let checked = 0;
for (const projectId of ['A', 'B']) {
  for (const checkpoint of ['Q1', 'Q2', 'F1', 'F2']) {
    const projectName = projects[projectId];
    const folder = join(here, projectName, `${projectId}-${checkpoint}`);
    const manifest = JSON.parse(await readFile(join(folder, 'manifest.json'), 'utf8'));
    for (const candidate of manifest.candidates) {
      const sandbox = await mkdtemp(join(tmpdir(), 'study-candidate-'));
      try {
        await cp(join(root, 'projects', projectName), sandbox, { recursive: true });
        run('git', ['apply', join(folder, candidate.patch)], { cwd: sandbox });
        run(process.execPath, ['--test', 'test/baseline.test.mjs', `test/${checkpoint.toLowerCase()}.functional.test.mjs`], { cwd: sandbox });
        run(process.execPath, [join(here, 'oracle.mjs')], {
          cwd: sandbox,
          env: {
            ...process.env,
            STUDY_PROJECT_DIR: sandbox,
            STUDY_PROJECT_ID: projectId,
            STUDY_CHECKPOINT: checkpoint,
            STUDY_EXPECTED_STATUS: candidate.expected_target_status
          }
        });
        checked++;
        console.log(`${candidate.candidate_id}: functional pass; ${candidate.expected_target_status} oracle confirmed`);
      } finally {
        await rm(sandbox, { recursive: true, force: true });
      }
    }
  }
}
console.log(`Verified ${checked} constructed prototype candidates.`);
