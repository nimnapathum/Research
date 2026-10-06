import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('Q2 returns only the author match and respects the limit', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/resources/by-author?name=Asha`);
    assert.equal(response.status, 200);
    const { resources } = await response.json();
    assert.deepEqual(resources.map((item) => item.title), ['Algebra Basics']);
    assert.ok(resources.length <= 5);
  });
});

test('Q2 returns an empty list for unknown author', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/resources/by-author?name=unknown`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { resources: [] });
  });
});
