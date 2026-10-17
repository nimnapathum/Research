import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const kit = fileURLToPath(new URL('./natural_kit.mjs', import.meta.url));

test('plain task briefs retain exact behavior and security requirements across both orientations', () => {
  const root = mkdtempSync(join(tmpdir(), 'natural-task-text-'));
  try {
    const sheets = { A: [], B: [] };
    for (const sequence of [0, 1]) {
      const destination = join(root, `pair-${sequence}`);
      const result = spawnSync(process.execPath, [kit, 'create', `P7654321${sequence}`, destination, String(sequence)],
        { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const allocation = JSON.parse(readFileSync(join(destination, 'RESEARCHER_ALLOCATION.json'), 'utf8'));
      for (const task of allocation.tasks) {
        const brief = readFileSync(join(task.workspace, 'study/TASK.md'), 'utf8');
        sheets[task.project_id].push(brief);
        assert.match(brief, /sorted by title/);
        assert.match(brief, /empty or has no matches, return an empty list/);
        assert.match(brief, /If no (topic|status) is given, return all/);
        assert.match(brief, /must not change the database query/);
        assert.match(brief, /UTF-8 text/);
        assert.match(brief, /outside that folder, including through a link/);
        assert.match(brief, /npm run test:q1/);
        assert.match(brief, /npm run test:f1/);
        assert.doesNotMatch(brief, /acceleration|exploration|Q2 and F2/);
      }
    }
    assert.equal(sheets.A[0], sheets.A[1]);
    assert.equal(sheets.B[0], sheets.B[1]);
    assert.match(sheets.A[0], /resources\?topic=math/);
    assert.match(sheets.B[0], /tickets\?status=open/);
    assert.match(sheets.A[0], /previews\?name=algebra\.txt/);
    assert.match(sheets.B[0], /attachments\?name=account\.txt/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
