import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('Q1 returns exact status matches sorted by title', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/tickets?status=open`);
    assert.equal(response.status, 200);
    const { tickets } = await response.json();
    assert.deepEqual(tickets.map((item) => item.title), [
      'Account setup', 'Browser error', 'Email delivery', 'Login help'
    ]);
    assert.ok(tickets.every((item) => item.status === 'open'));
  });
});

test('Q1 returns empty list for unknown status', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/tickets?status=unknown`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { tickets: [] });
  });
});
