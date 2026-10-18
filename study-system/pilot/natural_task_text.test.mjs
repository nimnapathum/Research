import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const kit = fileURLToPath(new URL('./natural_kit.mjs', import.meta.url));

test('task packages keep target requirements while varying the implementation abstraction', () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-task-text-'));
  try {
    const sheets = { A: {}, B: {} };
    for (const sequence of [0, 1]) {
      const destination = join(root, `pair-${sequence}`);
      const result = spawnSync(process.execPath, [kit, 'create', `P7654321${sequence}`, destination, String(sequence)],
        { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const allocation = JSON.parse(readFileSync(join(destination, 'RESEARCHER_ALLOCATION.json'), 'utf8'));
      for (const task of allocation.tasks) {
        const brief = readFileSync(join(task.workspace, 'study/TASK.md'), 'utf8');
        sheets[task.project_id][task.condition] = brief;
        assert.match(brief, /sorted by title/);
        assert.match(brief, /empty or has no matches, return an empty list/);
        assert.match(brief, /If no (topic|status) is given, return all/);
        assert.match(brief, /must not change the database query/);
        assert.match(brief, /UTF-8 text/);
        assert.match(brief, /outside that folder, including through a link/);
        assert.match(brief, /npm run test:q1/);
        assert.match(brief, /npm run test:f1/);
        assert.doesNotMatch(brief, /acceleration|exploration|Q2 and F2/);
        if (task.condition === 'acceleration') {
          assert.match(brief, /IMPLEMENTATION_MAP/);
          assert.match(readFileSync(join(task.workspace, 'study/IMPLEMENTATION_MAP.md'), 'utf8'), /two named functions/);
          assert.doesNotMatch(readFileSync(join(task.workspace, 'src/app.mjs'), 'utf8'), /documentPort/);
        } else {
          assert.match(brief, /INTERFACE_GUIDE/);
          assert.match(readFileSync(join(task.workspace, 'study/INTERFACE_GUIDE.md'), 'utf8'), /rows\(\{ statement, values \}\)/);
          assert.match(readFileSync(join(task.workspace, 'src/app.mjs'), 'utf8'), /documentPort/);
          assert.match(readFileSync(join(task.workspace, 'src/study-bridge.mjs'), 'utf8'), /recordPort/);
        }
      }
    }
    assert.notEqual(sheets.A.acceleration, sheets.A.exploration);
    assert.notEqual(sheets.B.acceleration, sheets.B.exploration);
    assert.match(sheets.A.acceleration, /resources\?topic=math/);
    assert.match(sheets.B.acceleration, /tickets\?status=open/);
    assert.match(sheets.A.exploration, /previews\?name=algebra\.txt/);
    assert.match(sheets.B.exploration, /attachments\?name=account\.txt/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
