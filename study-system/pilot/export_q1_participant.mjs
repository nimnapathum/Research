import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const condition = process.argv[2];
const destination = process.argv[3];
if (!['acceleration', 'exploration'].includes(condition) || !destination) {
  throw new Error('Usage: node export_q1_participant.mjs acceleration|exploration NEW_DIRECTORY');
}

const here = fileURLToPath(new URL('.', import.meta.url));
const project = resolve(here, '../projects/resource-catalogue');
const instrument = resolve(here, '../instruments/resource-catalogue');
const output = resolve(destination);

// A new directory prevents an old participant workspace from contaminating this copy.
await mkdir(output);
await cp(project, output, { recursive: true });
await mkdir(join(output, 'study'));
await cp(join(instrument, 'Q1_TASK.md'), join(output, 'study/Q1_TASK.md'));
await cp(resolve(here, `../instruments/CONDITION_${condition.toUpperCase()}.md`),
  join(output, 'study/WORK_ORIENTATION.md'));
await cp(resolve(here, '../instruments/PARTICIPANT_WORKFLOW.md'),
  join(output, 'study/PARTICIPANT_WORKFLOW.md'));
await writeFile(
  join(output, 'study/START_HERE.md'),
  '# Start here\n\nThis is a one-checkpoint engineering rehearsal, not the full participant session. Read Q1_TASK.md, WORK_ORIENTATION.md and PARTICIPANT_WORKFLOW.md. Use the coding agent in agent mode and follow the controlled proposal sequence.\n'
);
console.log(`Participant-only Q1 workspace created at ${output}`);
