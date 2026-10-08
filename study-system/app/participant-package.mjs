import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const names = { A: 'resource-catalogue', B: 'support-archive' };

function projectFiles(project) {
  const base = resolve(root, 'projects', project);
  const files = new Map();
  function walk(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (['.git', 'node_modules', '.DS_Store'].includes(entry.name)) continue;
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && lstatSync(path).isFile()) files.set(relative(base, path).replaceAll('\\', '/'), readFileSync(path));
      else throw new Error('Unsupported project file in participant package');
    }
  }
  walk(base);
  return files;
}

// ZIP "store" format. The projects are small; avoiding an external archiver keeps
// the downloaded package portable and lets the allowlist be inspected here.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
export function zipFiles(files) {
  const local = [], central = [];
  let offset = 0;
  for (const [path, value] of files) {
    const name = Buffer.from(path);
    const data = Buffer.isBuffer(value) ? value : Buffer.from(value);
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6); // UTF-8 names
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

export function participantPackage(task, token, publicUrl) {
  const project = names[task.project_id];
  if (!project) throw new Error('Unknown project');
  const sequence = JSON.parse(task.checkpoint_order_json);
  const files = projectFiles(project);
  for (const checkpoint of sequence) files.set(`study/${checkpoint}_TASK.md`,
    readFileSync(resolve(root, 'instruments', project, `${checkpoint}_TASK.md`)));
  files.set('study/WORK_ORIENTATION.md', readFileSync(resolve(root, 'instruments', `CONDITION_${task.condition.toUpperCase()}.md`)));
  files.set('study/PARTICIPANT_WORKFLOW.md', readFileSync(resolve(root, 'instruments/PARTICIPANT_WORKFLOW.md')));
  files.set('study/START_HERE.md', Buffer.from(`# Start here\n\nOpen your private study page for the current task sheet. The assigned order is ${sequence.join(', ')}. Keep this project open in Antigravity, and run \`node study/setup.mjs\` then \`node study/client.mjs\` in a separate terminal before coding. The client terminal must remain open. Read all project files freely.\n`));
  files.set('study/PACKAGE_INFO.json', Buffer.from(JSON.stringify({
    project_id: task.project_id, assigned_condition: task.condition, checkpoint_order: sequence,
    package_kind: 'participant-only; no candidate labels or hidden oracles'
  }, null, 2) + '\n'));
  files.set('study/CAPTURE_CONFIG.json', Buffer.from(JSON.stringify({
    task_id: task.task_id, token, collector_url: publicUrl
  }, null, 2) + '\n'));
  files.set('study/setup.mjs', readFileSync(resolve(root, 'capture/participant-setup.mjs')));
  files.set('study/client.mjs', readFileSync(resolve(root, 'capture/participant-client.mjs')));
  files.set('study/pointer_recorder.py', readFileSync(resolve(root, 'capture/pointer_recorder.py')));
  files.set('study/POINTER_REQUIREMENTS.txt', readFileSync(resolve(root, 'capture/POINTER_REQUIREMENTS.txt')));
  files.set('study/upload-transcript.mjs', readFileSync(resolve(root, 'capture/upload-transcript.mjs')));
  files.set('.study-capture/hook.mjs', readFileSync(resolve(root, 'capture/antigravity-hook.mjs')));
  return zipFiles(files);
}
