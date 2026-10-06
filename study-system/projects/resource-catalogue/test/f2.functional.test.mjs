import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('F2 returns the preview referenced by a resource', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/resources/1/preview`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Algebra preview/);
    const missing = await fetch(`${base}/resources/999/preview`);
    assert.equal(missing.status, 404);
  });
});
