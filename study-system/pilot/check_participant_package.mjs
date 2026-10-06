// Checks export contents against a small allowlist; does not prove OS isolation.
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const temp = await mkdtemp(join(tmpdir(), 'security-trust-package-'));
async function files(folder) {
  const result = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else result.push(relative(folder, path));
    }
  }
  await walk(folder);
  return result.sort();
}
for (const project of ['A', 'B']) {
  for (const condition of ['acceleration', 'exploration']) {
    const name = project === 'A' ? 'resource-catalogue' : 'support-archive';
    const output = join(temp, `${project}-${condition}`);
    const result = spawnSync(process.execPath, [join(root, 'pilot/export_participant.mjs'),
      project, condition, output, 'Q1,Q2,F1,F2'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const sourceFiles = await files(join(root, 'projects', name));
    const studyFiles = ['study/PACKAGE_INFO.json', 'study/START_HERE.md',
      'study/WORK_ORIENTATION.md', 'study/PARTICIPANT_WORKFLOW.md',
      ...['Q1', 'Q2', 'F1', 'F2'].map((checkpoint) => `study/${checkpoint}_TASK.md`)];
    assert.deepEqual(await files(output), [...sourceFiles, ...studyFiles].sort(), 'Unexpected exported file');
    const info = JSON.parse(await readFile(join(output, 'study/PACKAGE_INFO.json'), 'utf8'));
    assert.equal(info.project_id, project);
    assert.equal(info.assigned_condition, condition);
    for (const file of await files(output)) {
      assert.ok(!/(^|\/)(stimuli|analysis|oracles|\.study-data)(\/|$)/i.test(file), `Hidden path: ${file}`);
      if (file.startsWith('study/')) {
        const content = await readFile(join(output, file), 'utf8');
        assert.ok(!/expected_target_status|main_study_eligible|candidate_status_by_checkpoint/.test(content),
          `Researcher label leaked in ${file}`);
      }
    }
  }
}
console.log('Participant export check passed for both projects and both conditions. OS-level access still needs host rehearsal.');
