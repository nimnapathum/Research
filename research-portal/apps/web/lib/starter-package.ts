import 'server-only';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { StudyTask } from './types';

const projectNames = { A: 'resource-catalogue', B: 'support-archive' } as const;
const checkpoints = new Set(['Q1', 'Q2', 'F1', 'F2']);
const conditions = new Set(['acceleration', 'exploration']);
const studyRoot = resolve(/* turbopackIgnore: true */ process.env.STUDY_MATERIALS_ROOT ||
  join(process.env.RESEARCH_DOCS_ROOT || resolve(process.cwd(), '../../..'), 'study-system'));
const allowedTopFiles = new Set(['AGENTS.md', 'README.md', 'package.json', 'package-lock.json']);
const allowedFolders = new Set(['src', 'test', 'previews', 'attachments']);

function safeTask(task: StudyTask) {
  if (!projectNames[task.project_id] || !conditions.has(task.condition) ||
      task.checkpoint_order.length !== 4 || new Set(task.checkpoint_order).size !== 4 ||
      task.checkpoint_order.some((checkpoint) => !checkpoints.has(checkpoint))) {
    throw new Error('Invalid task material assignment');
  }
  return projectNames[task.project_id];
}

export async function taskSheets(task: StudyTask) {
  const project = safeTask(task);
  const [orientation, workflow, ...sheets] = await Promise.all([
    readFile(join(studyRoot, 'instruments', `CONDITION_${task.condition.toUpperCase()}.md`), 'utf8'),
    readFile(join(studyRoot, 'instruments', 'PARTICIPANT_WORKFLOW.md'), 'utf8'),
    ...task.checkpoint_order.map((id) => readFile(join(studyRoot, 'instruments', project, `${id}_TASK.md`), 'utf8'))
  ]);
  return { project, orientation, workflow, sheets: task.checkpoint_order.map((id, index) => ({ id, source: sheets[index] })) };
}

async function projectFiles(project: string) {
  const root = join(studyRoot, 'projects', project);
  const files = new Map<string, Buffer>();
  async function walk(folder: string) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (folder === root && entry.isDirectory() && !allowedFolders.has(entry.name)) continue;
      if (folder === root && entry.isFile() && !allowedTopFiles.has(entry.name)) continue;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && (await lstat(path)).isFile()) {
        const name = relative(root, path).split(sep).join('/');
        files.set(name, await readFile(path));
      } else throw new Error('Unsupported file in participant project');
    }
  }
  await walk(root);
  return files;
}

// A small ZIP using the uncompressed "store" format. No extra archive package is needed.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Buffer) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function zipFiles(files: Map<string, Buffer>) {
  const local: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const [path, data] of files) {
    const name = Buffer.from(path);
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, data);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(data.length, 20);
    record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += header.length + name.length + data.length;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

export async function starterPackage(task: StudyTask) {
  const materials = await taskSheets(task);
  const files = await projectFiles(materials.project);
  files.set('study/WORK_ORIENTATION.md', Buffer.from(materials.orientation));
  files.set('study/PARTICIPANT_WORKFLOW.md', Buffer.from(materials.workflow));
  for (const sheet of materials.sheets) files.set(`study/${sheet.id}_TASK.md`, Buffer.from(sheet.source));
  files.set('study/START_HERE.md', Buffer.from(`# Start here\n\nThis is the starter codebase for Task ${task.task_order}. You can inspect it in Antigravity before the recorded task. Your assigned work style and task sheets are in the study folder and in your portal task page.\n\nThis ZIP does not connect to the controlled checkpoint collector. For a recorded study session, use the instrumented ZIP supplied by the checkpoint app or the researcher, and follow its checkpoint instructions before editing each target feature.\n`));
  return zipFiles(files);
}
