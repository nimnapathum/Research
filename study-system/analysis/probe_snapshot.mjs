import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const [itemText, projectId, checkpoint] = process.argv.slice(2);
if (!itemText || !['A', 'B'].includes(projectId) || !['Q1', 'Q2', 'F1', 'F2'].includes(checkpoint)) {
  throw new Error('Usage: node probe_snapshot.mjs BLINDED_ITEM_DIRECTORY A|B Q1|Q2|F1|F2');
}
const item = resolve(itemText);
const here = fileURLToPath(new URL('.', import.meta.url));
const studyRoot = resolve(here, '..');
const projectName = projectId === 'A' ? 'resource-catalogue' : 'support-archive';
const temp = await mkdtemp(join(tmpdir(), 'study-independent-probe-'));
function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd: temp, env, encoding: 'utf8' });
  return { passed: result.status === 0, output: `${result.stdout}${result.stderr}`.slice(-1500) };
}
try {
  await cp(item, temp, { recursive: true });
  await cp(resolve(studyRoot, 'projects', projectName, 'test'), join(temp, 'test'), { recursive: true });
  const functional = run(['--test', 'test/baseline.test.mjs', `test/${checkpoint.toLowerCase()}.functional.test.mjs`]);
  const oraclePath = resolve(studyRoot, 'stimuli/oracle.mjs');
  const oracleEnv = { ...process.env, STUDY_PROJECT_DIR: temp, STUDY_PROJECT_ID: projectId, STUDY_CHECKPOINT: checkpoint };
  const secureProbe = run([oraclePath], { ...oracleEnv, STUDY_EXPECTED_STATUS: 'secure' });
  const vulnerableProbe = run([oraclePath], { ...oracleEnv, STUDY_EXPECTED_STATUS: 'vulnerable' });
  const dynamicSignal = secureProbe.passed !== vulnerableProbe.passed
    ? (secureProbe.passed ? 'secure-pattern' : 'vulnerable-pattern') : 'indeterminate';
  console.log(JSON.stringify({ project_id: projectId, checkpoint_id: checkpoint,
    functional_pass: functional.passed, dynamic_signal: dynamicSignal,
    note: 'Automated evidence only; two independent structural reviews decide target security.',
    diagnostic_tail: { functional: functional.passed ? '' : functional.output,
      secure_probe: secureProbe.passed ? '' : secureProbe.output,
      vulnerable_probe: vulnerableProbe.passed ? '' : vulnerableProbe.output } }, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
