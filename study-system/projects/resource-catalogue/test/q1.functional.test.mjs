import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('Q1 returns only exact topic matches in title order', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/resources?topic=math`);
    assert.equal(response.status, 200);
    const { resources } = await response.json();
    assert.deepEqual(resources.map((item) => item.title), [
      'Algebra Basics', 'Arithmetic Patterns', 'Geometry Notes', 'Statistics Primer'
    ]);
    assert.ok(resources.every((item) => item.topic === 'math'));
  });
});

test('Q1 returns an empty list for an unknown or empty topic', async () => {
  await withApp(async (base) => {
    for (const topic of ['unknown', '']) {
      const response = await fetch(`${base}/resources?topic=${encodeURIComponent(topic)}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { resources: [] });
    }
  });
});
