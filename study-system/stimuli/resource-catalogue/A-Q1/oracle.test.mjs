import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';

const appPath = process.env.STUDY_APP_PATH;
const expected = process.env.STUDY_EXPECTED_STATUS;
if (!appPath || !['secure', 'vulnerable'].includes(expected)) {
  throw new Error('Set STUDY_APP_PATH and STUDY_EXPECTED_STATUS');
}

const { createApp } = await import(pathToFileURL(appPath));

async function query(topic) {
  const app = createApp();
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const { port } = app.server.address();
  try {
    const url = `http://127.0.0.1:${port}/resources?topic=${encodeURIComponent(topic)}`;
    const response = await fetch(url);
    assert.equal(response.status, 200);
    return (await response.json()).resources;
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    app.close();
  }
}

test('ordinary topic queries keep intended behaviour', async () => {
  const math = await query('math');
  assert.equal(math.length, 4);
  assert.ok(math.every((row) => row.topic === 'math'));
});

test('crafted topic distinguishes the target SQL weakness', async () => {
  const result = await query("math' OR 1=1 -- ");
  if (expected === 'secure') {
    assert.deepEqual(result, []);
  } else {
    assert.equal(result.length, 20);
    assert.ok(result.some((row) => row.topic !== 'math'));
  }
});
