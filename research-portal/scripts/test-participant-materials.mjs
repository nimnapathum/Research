import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';

const require = createRequire(import.meta.url);
process.env.STUDY_MATERIALS_ROOT = resolve('../study-system');

function load(source) {
  const code = ts.transpileModule(readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => name === 'server-only' ? {} : require(name);
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

function zipNames(bytes) {
  const names = [];
  for (let offset = 0; offset < bytes.length - 46; offset++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) continue;
    const length = bytes.readUInt16LE(offset + 28);
    const extra = bytes.readUInt16LE(offset + 30);
    const comment = bytes.readUInt16LE(offset + 32);
    names.push(bytes.subarray(offset + 46, offset + 46 + length).toString());
    offset += 45 + length + extra + comment;
  }
  return names;
}

const { taskAccess } = load('apps/web/lib/task-access.ts');
const { taskSheets, starterPackage } = load('apps/web/lib/starter-package.ts');
const first = { id: 'one', project_id: 'A', condition: 'acceleration', task_order: 1,
  external_task_id: 'P001-T1', checkpoint_order: ['Q1', 'Q2', 'F1', 'F2'], status: 'not_started' };
const second = { ...first, id: 'two', project_id: 'B', condition: 'exploration', task_order: 2,
  external_task_id: 'P001-T2', checkpoint_order: ['F2', 'F1', 'Q2', 'Q1'] };
const dashboard = { tasks: [first, second], questionnaires: [] };
assert.equal(taskAccess(dashboard, first).allowed, false);
dashboard.questionnaires.push({ stage: 'pre_task', response_id: 'pre' });
assert.equal(taskAccess(dashboard, first).allowed, true);
assert.equal(taskAccess(dashboard, second).allowed, false);
first.status = 'submitted';
dashboard.questionnaires.push({ stage: 'after_task', response_task_id: first.id });
assert.equal(taskAccess(dashboard, second).allowed, true);

for (const task of [first, second]) {
  const sheets = await taskSheets(task);
  assert.deepEqual(sheets.sheets.map((item) => item.id), task.checkpoint_order);
  assert.ok(sheets.sheets.every((item) => item.source.includes('Security requirement')));
  const names = zipNames(await starterPackage(task));
  assert.ok(names.includes('AGENTS.md'));
  assert.ok(names.includes('study/START_HERE.md'));
  assert.ok(task.checkpoint_order.every((id) => names.includes(`study/${id}_TASK.md`)));
  assert.ok(names.every((name) => !/(^|\/)(stimuli|analysis|pilot|\.env|CAPTURE_CONFIG\.json)(\/|$)/.test(name)));
  assert.ok(names.some((name) => name.startsWith('src/')));
}
console.log('PASS: task gating, assigned sheets, and participant-only starter ZIP contents');
