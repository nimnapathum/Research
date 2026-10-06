import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('starter health and full catalogue work', async () => {
  await withApp(async (base) => {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });

    const response = await fetch(`${base}/resources`);
    assert.equal(response.status, 200);
    const { resources } = await response.json();
    assert.equal(resources.length, 20);
    assert.deepEqual(
      resources.map((item) => item.title),
      [...resources.map((item) => item.title)].sort()
    );
  });
});
