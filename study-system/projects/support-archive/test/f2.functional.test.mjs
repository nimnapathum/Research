import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('F2 returns the stored attachment and missing ticket is 404', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/tickets/1/attachment`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Account setup attachment/);
    const missing = await fetch(`${base}/tickets/999/attachment`);
    assert.equal(missing.status, 404);
  });
});
