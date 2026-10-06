import test from 'node:test';
import assert from 'node:assert/strict';
import { withApp } from './helpers.mjs';

test('Q2 returns exact requester matches in title order with a limit', async () => {
  await withApp(async (base) => {
    const response = await fetch(`${base}/tickets/by-requester?name=Asha`);
    assert.equal(response.status, 200);
    const { tickets } = await response.json();
    assert.deepEqual(tickets.map((item) => item.title), [
      'Access review', 'Account setup', 'Export request', 'Old export', 'Profile update'
    ]);
    assert.ok(tickets.every((item) => item.requester === 'Asha'));
    assert.ok(tickets.length <= 5);
  });
});
