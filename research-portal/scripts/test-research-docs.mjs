import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const portal = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(portal, '..');
const api = createServer((request, response) => {
  const token = request.headers.authorization;
  const role = token === 'Bearer researcher' ? 'researcher' : token === 'Bearer participant' ? 'participant' : null;
  response.writeHead(role ? 200 : 401, { 'content-type': 'application/json' });
  response.end(JSON.stringify(role ? { id: 'test', email: 'test@example.invalid', role } : { error: 'Unauthorized' }));
});
await new Promise((resolveListen) => api.listen(0, '127.0.0.1', resolveListen));
const apiPort = api.address().port;
const webPort = 32000 + Math.floor(Math.random() * 10000);
const web = spawn(process.execPath, ['../../node_modules/next/dist/bin/next', 'start',
  '--hostname', '127.0.0.1', '--port', String(webPort)], {
  cwd: resolve(portal, 'apps/web'),
  env: { ...process.env, API_INTERNAL_URL: `http://127.0.0.1:${apiPort}`,
    RESEARCH_DOCS_ROOT: root, NODE_ENV: 'production' },
  stdio: 'ignore'
});
const base = `http://127.0.0.1:${webPort}`;

try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if (web.exitCode !== null) throw new Error('Next.js stopped before becoming ready');
    try {
      const response = await fetch(`${base}/login`);
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for startup. */ }
    await delay(200);
  }
  if (!ready) throw new Error('Next.js did not become ready');

  async function expectStatus(path, cookie, status) {
    const response = await fetch(`${base}${path}`, { headers: cookie ? { cookie } : {} });
    if (response.status !== status) throw new Error(`${path}: expected ${status}, got ${response.status}`);
    return response;
  }
  await expectStatus('/api/research/docs?doc=RQ.md', '', 401);
  await expectStatus('/api/research/docs?doc=RQ.md', 'study_sid=participant', 403);
  await expectStatus('/api/research/docs?doc=../.env', 'study_sid=researcher', 404);
  const document = await expectStatus('/api/research/docs?doc=RQ.md', 'study_sid=researcher', 200);
  if (!(await document.json()).source.includes('RQ1')) throw new Error('Markdown content missing');
  const current = await expectStatus('/api/research/docs?doc=CURRENT_STUDY.md', 'study_sid=researcher', 200);
  if (!(await current.json()).source.includes('work-structure')) throw new Error('Current-study evidence map missing');
  const guide = await expectStatus('/api/research/docs?doc=STUDY_GUIDE.md', 'study_sid=researcher', 200);
  const guideSource = (await guide.json()).source;
  if (!guideSource.includes('main-study procedure') || !guideSource.includes('RQ1') ||
      !guideSource.includes('SCREEN_RECORDING_EVALUATION_PLAN.md') || !guideSource.includes('REFERENCES.md')) {
    throw new Error('A–Z study guide missing its evidence and source path');
  }
  const audit = await expectStatus('/api/research/docs?doc=PORTAL_METHOD_AUDIT.md', 'study_sid=researcher', 200);
  if (!(await audit.json()).source.includes('Portal–methodology inspection')) throw new Error('Portal method audit missing');
  const workflow = await expectStatus('/api/research/docs?doc=RQ_ANALYTICS_REVIEW.md', 'study_sid=researcher', 200);
  if (!(await workflow.json()).source.includes('coding_status.csv')) throw new Error('RQ analysis workflow missing');
  const readiness = await expectStatus('/api/research/docs?doc=PILOT_READINESS_AUDIT_2026-10-18.md', 'study_sid=researcher', 200);
  if (!(await readiness.json()).source.includes('P0: required before the next real-user pilot')) {
    throw new Error('Current pilot release gates missing');
  }
  const page = await expectStatus('/researcher/research?doc=RQ.md', 'study_sid=researcher', 200);
  if (!(await page.text()).includes('Study documents')) throw new Error('Research page missing');
  const landing = await expectStatus('/researcher/research', 'study_sid=researcher', 200);
  const landingSource = await landing.text();
  if (!landingSource.includes('STUDY_GUIDE.md') || !landingSource.includes('Historical designs and status') ||
      !landingSource.includes('PILOT_READINESS_AUDIT_2026-10-18.md') ||
      !landingSource.includes('SCREEN_RECORDING_EVALUATION_PLAN.md') ||
      !landingSource.includes('NATURAL_ANALYSIS_PLAN.md')) {
    throw new Error('Research landing does not point to the current protocol');
  }
  console.log('PASS: research document loading and access controls');
} finally {
  web.kill('SIGTERM');
  api.close();
}
