import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('F1 returns a named preview', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/previews?name=algebra.txt`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Algebra preview/);
  });
});
