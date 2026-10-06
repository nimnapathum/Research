import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('F1 returns a named attachment', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/attachments?name=account.txt`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Account setup attachment/);
  });
});
