// Engineering check for pilot allocation; no participants are created.
import assert from 'node:assert/strict';
import { assignmentFor } from '../app/assignment.mjs';

for (let seedNumber = 0; seedNumber < 100; seedNumber++) {
  const assignments = Array.from({ length: 32 }, (_, ordinal) =>
    assignmentFor(`P${String(ordinal + 1).padStart(3, '0')}`, ordinal, `test-seed-${seedNumber}`));
  for (let start = 0; start < assignments.length; start += 4) {
    const group = assignments.slice(start, start + 4);
    for (const key of ['sequence', 'profile', 'order']) {
      assert.deepEqual(group.map((item) => item.cell[key]).sort(), [0, 1, 2, 3],
        `${key} coverage failed in group beginning ${start}`);
    }
  }
  for (let start = 0; start < assignments.length; start += 16) {
    const cells = assignments.slice(start, start + 16).map((item) =>
      `${item.cell.sequence}:${item.cell.profile}`);
    assert.equal(new Set(cells).size, 16, 'A full block must cover sequence × profile');
  }
  for (const assignment of assignments) {
    assert.deepEqual(assignment.tasks.map((task) => task.project_id).sort(), ['A', 'B']);
    assert.deepEqual(assignment.tasks.map((task) => task.condition).sort(), ['acceleration', 'exploration']);
    for (const task of assignment.tasks) {
      assert.equal(new Set(task.checkpoint_order).size, 4);
      assert.equal(Object.values(task.candidate_status_by_checkpoint).filter((value) => value === 'vulnerable').length, 2);
    }
  }
}
console.log('Assignment check passed: 100 seeds, first-four balance, 16-cell balance, and both task conditions.');
