import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [projectId, condition, destination, sequenceText = 'Q1,Q2,F1,F2'] = process.argv.slice(2);
const projects = { A: 'resource-catalogue', B: 'support-archive' };
const sequence = sequenceText.split(',');
if (!projects[projectId] || !['acceleration', 'exploration'].includes(condition) || !destination ||
    sequence.length !== 4 || new Set(sequence).size !== 4 ||
    sequence.some((item) => !['Q1', 'Q2', 'F1', 'F2'].includes(item))) {
  throw new Error('Usage: node export_participant.mjs A|B acceleration|exploration NEW_DIRECTORY [Q1,Q2,F1,F2]');
}

const here = fileURLToPath(new URL('.', import.meta.url));
const project = projects[projectId];
const output = resolve(destination);
await mkdir(output);
await cp(resolve(here, '../projects', project), output, { recursive: true });
await mkdir(join(output, 'study'));
for (const checkpoint of sequence) {
  await cp(resolve(here, '../instruments', project, `${checkpoint}_TASK.md`),
    join(output, 'study', `${checkpoint}_TASK.md`));
}
await cp(resolve(here, '../instruments', `CONDITION_${condition.toUpperCase()}.md`),
  join(output, 'study/WORK_ORIENTATION.md'));
await cp(resolve(here, '../instruments/PARTICIPANT_WORKFLOW.md'),
  join(output, 'study/PARTICIPANT_WORKFLOW.md'));
await writeFile(join(output, 'study/START_HERE.md'),
  `# Start here\n\nRead WORK_ORIENTATION.md and PARTICIPANT_WORKFLOW.md. Complete checkpoints in this order: ${sequence.join(', ')}. The researcher will tell you when to open each task sheet. You may inspect every file, ask the coding agent questions, run checks, and revise or reject proposals after your first checkpoint decision.\n`);
await writeFile(join(output, 'study/PACKAGE_INFO.json'), JSON.stringify({
  project_id: projectId, assigned_condition: condition, checkpoint_order: sequence,
  package_kind: 'participant-only; no candidate labels or hidden oracles'
}, null, 2) + '\n');
console.log(`Participant-only ${projectId} workspace created at ${output}`);
