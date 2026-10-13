import 'server-only';
import { spawnSync } from 'node:child_process';
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { StudyTask } from './types';

const studyRoot = resolve(/* turbopackIgnore: true */ process.env.STUDY_MATERIALS_ROOT ||
  join(process.env.RESEARCH_DOCS_ROOT || resolve(process.cwd(), '../../..'), 'study-system'));
const packageRoot = resolve(/* turbopackIgnore: true */ process.env.STUDY_PACKAGE_ROOT ||
  join(process.cwd(), '../../.local-packages'));
type StoredPackage = { taskId: string; projectId: string; condition: string; taskOrder: number;
  protocolVersion: string; packageSha256: string; zipBase64: string; taskSheet: string; orientation: string; startHere: string };
function loadPackage(path: string, task: StudyTask) {
  const stored = JSON.parse(readFileSync(path, 'utf8')) as StoredPackage;
  const zip = Buffer.from(stored.zipBase64, 'base64');
  if (stored.taskId !== task.external_task_id || stored.projectId !== task.project_id ||
      stored.condition !== task.condition || stored.taskOrder !== task.task_order ||
      createHash('sha256').update(zip).digest('hex') !== stored.packageSha256) {
    throw new Error('Frozen package identity or hash mismatch; researcher must resolve it');
  }
  return { ...stored, zip };
}

function sequenceFor(tasks: StudyTask[]): number {
  const ordered = [...tasks].sort((a, b) => a.task_order - b.task_order);
  if (ordered.length !== 2 || ordered[0].task_order !== 1 || ordered[1].task_order !== 2 ||
      ordered[0].project_id === ordered[1].project_id || ordered[0].condition === ordered[1].condition) {
    throw new Error('Natural task assignment must contain opposite projects and conditions');
  }
  const first = ordered[0];
  return first.project_id === 'A' ? (first.condition === 'acceleration' ? 0 : 1)
    : (first.condition === 'acceleration' ? 2 : 3);
}

export function naturalTaskMaterials(task: StudyTask, tasks: StudyTask[]) {
  if (!/^[A-Z0-9-]{3,30}-T[12]$/.test(task.external_task_id) ||
      !tasks.some((item) => item.id === task.id)) throw new Error('Invalid natural task ID');
  const participantId = task.external_task_id.replace(/-T[12]$/, '');
  const sequence = sequenceFor(tasks);
  const cached = join(packageRoot, `${task.external_task_id}.json`);
  if (existsSync(cached)) return loadPackage(cached, task);
  const folder = mkdtempSync(join(tmpdir(), 'natural-portal-'));
  const destination = join(folder, 'pair');
  try {
    const result = spawnSync(process.execPath, [join(studyRoot, 'pilot/natural_kit.mjs'), 'create',
      participantId, destination, String(sequence)], { encoding: 'utf8', timeout: 20_000, maxBuffer: 1024 * 1024 });
    if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr.trim() || 'Natural package generation failed');
    const workspace = join(destination, task.external_task_id);
    const info = JSON.parse(readFileSync(join(workspace, 'study/SESSION_INFO.json'), 'utf8')) as {
      task_id: string; project_id: string; protocol_version: string; task_order: number };
    const allocation = JSON.parse(readFileSync(join(destination, 'RESEARCHER_ALLOCATION.json'), 'utf8')) as {
      tasks: Array<{ task_id: string; condition: string }> };
    if (info.task_id !== task.external_task_id || info.project_id !== task.project_id ||
        allocation.tasks.find((item) => item.task_id === task.external_task_id)?.condition !== task.condition || info.task_order !== task.task_order) {
      throw new Error('Generated natural task does not match portal assignment');
    }
    const zip = readFileSync(join(destination, `${task.external_task_id}.zip`));
    const stored: StoredPackage = { taskId: task.external_task_id, projectId: task.project_id,
      condition: task.condition, taskOrder: task.task_order, zipBase64: zip.toString('base64'),
      packageSha256: createHash('sha256').update(zip).digest('hex'), protocolVersion: info.protocol_version,
      taskSheet: readFileSync(join(workspace, 'study/TASK.md'), 'utf8'),
      orientation: readFileSync(join(destination, `${task.external_task_id}-ORIENTATION.md`), 'utf8'),
      startHere: readFileSync(join(workspace, 'study/START_HERE.md'), 'utf8') };
    mkdirSync(packageRoot, { recursive: true, mode: 0o700 });
    const temporary = join(packageRoot, `.package-${randomUUID()}`);
    try {
      writeFileSync(temporary, JSON.stringify(stored), { flag: 'wx', mode: 0o600 });
      try { linkSync(temporary, cached); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    } finally { unlinkSync(temporary); }
    return loadPackage(cached, task);
  } finally { rmSync(folder, { recursive: true, force: true }); }
}
