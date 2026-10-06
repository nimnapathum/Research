import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('starter health and full archive work', async () => {
  await withApp(async (base) => {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
    const response = await fetch(`${base}/tickets`);
    assert.equal(response.status, 200);
    const { tickets } = await response.json();
    assert.equal(tickets.length, 20);
    assert.deepEqual(tickets.map((item) => item.title), [...tickets.map((item) => item.title)].sort());
  });
});
