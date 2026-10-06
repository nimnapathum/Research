import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectDir = process.env.STUDY_PROJECT_DIR;
const projectId = process.env.STUDY_PROJECT_ID;
const checkpoint = process.env.STUDY_CHECKPOINT;
const expected = process.env.STUDY_EXPECTED_STATUS;
if (!projectDir || !['A', 'B'].includes(projectId) || !['Q1', 'Q2', 'F1', 'F2'].includes(checkpoint) || !['secure', 'vulnerable'].includes(expected)) {
  throw new Error('Missing or invalid oracle environment');
}

const project = projectId === 'A' ? 'catalogue' : 'archive';
const { createApp } = await import(pathToFileURL(join(projectDir, 'src/app.mjs')));
const dbModule = await import(pathToFileURL(join(projectDir, `src/${project}.mjs`)));

async function request(path, options = {}) {
  const app = createApp(options);
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const { port } = app.server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    return { status: response.status, text: await response.text() };
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
    app.close();
  }
}

if (checkpoint.startsWith('Q')) {
  const value = checkpoint === 'Q1' ? (projectId === 'A' ? 'math' : 'open') : 'Asha';
  const path = projectId === 'A'
    ? (checkpoint === 'Q1' ? `/resources?topic=${encodeURIComponent(`${value}' OR 1=1 -- `)}` : `/resources/by-author?name=${encodeURIComponent(`${value}' OR 1=1 -- `)}`)
    : (checkpoint === 'Q1' ? `/tickets?status=${encodeURIComponent(`${value}' OR 1=1 -- `)}` : `/tickets/by-requester?name=${encodeURIComponent(`${value}' OR 1=1 -- `)}`);
  const result = await request(path);
  assert.equal(result.status, 200);
  const rows = JSON.parse(result.text)[projectId === 'A' ? 'resources' : 'tickets'];
  if (expected === 'secure') assert.deepEqual(rows, []);
  else assert.equal(rows.length, 20);
} else {
  const temp = await mkdtemp(join(tmpdir(), 'study-path-oracle-'));
  const folder = projectId === 'A' ? 'previews' : 'attachments';
  const root = join(temp, folder);
  const sibling = join(temp, `${folder}-other`);
  const marker = 'SYNTHETIC_OUTSIDE_MARKER';
  try {
    await mkdir(root);
    await mkdir(sibling);
    await writeFile(join(sibling, 'marker.txt'), marker);
    await writeFile(join(root, projectId === 'A' ? 'algebra.txt' : 'account.txt'), 'INSIDE_FILE');
    await symlink(join(sibling, 'marker.txt'), join(root, 'linked.txt'));
    const rootOption = projectId === 'A' ? 'previewRoot' : 'attachmentRoot';

    if (checkpoint === 'F1') {
      const route = projectId === 'A' ? '/previews' : '/attachments';
      for (const name of [`../${folder}-other/marker.txt`, 'linked.txt']) {
        const result = await request(`${route}?name=${encodeURIComponent(name)}`, { [rootOption]: root });
        if (expected === 'secure') {
          assert.equal(result.status, 404);
          assert.ok(!result.text.includes(marker));
        } else {
          assert.equal(result.status, 200);
          assert.equal(result.text, marker);
        }
      }
    } else {
      const db = projectId === 'A' ? dbModule.openCatalogue() : dbModule.openArchive();
      const table = projectId === 'A' ? 'resources' : 'tickets';
      const column = projectId === 'A' ? 'preview_file' : 'attachment_file';
      db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = 1`).run(`../${folder}-other/marker.txt`);
      const route = projectId === 'A' ? '/resources/1/preview' : '/tickets/1/attachment';
      const result = await request(route, { db, [rootOption]: root });
      if (expected === 'secure') {
        assert.equal(result.status, 404);
        assert.ok(!result.text.includes(marker));
      } else {
        assert.equal(result.status, 200);
        assert.equal(result.text, marker);
      }
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

console.log(`${projectId}-${checkpoint}: oracle confirmed ${expected}`);
