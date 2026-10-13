import { createServer } from 'node:http';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSession, escapeHtml, forms, hashTree, logEvent, openStore, reviewFor, sessionForToken, taskFor, validateAnswers } from './lib.mjs';
import { participantPackage } from './participant-package.mjs';
import { ingestTelemetryRows } from './telemetry-ingest.mjs';
import { measurementAudit } from './measurement-audit.mjs';
import { heartbeat, currentJob, requestReview, prepareReview, reviewJob, markApplied, markRestored, requestFinal, submitFinal, requestDecisionCheck, verifyDecision } from './participant-remote.mjs';

const store = openStore();
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const pageCss = readFileSync(new URL('./ui.css', import.meta.url), 'utf8');
const formVersion = JSON.parse(readFileSync(resolve(root, 'instruments/forms.json'), 'utf8')).version;
const port = Number(process.env.STUDY_PORT || 4175);
const publicUrl = (process.env.STUDY_PUBLIC_URL || `http://127.0.0.1:${port}`).replace(/\/+$/, '');
const publicOrigin = new URL(publicUrl);
if (publicOrigin.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(publicOrigin.hostname)) {
  throw new Error('STUDY_PUBLIC_URL must be HTTPS outside localhost');
}
if (publicOrigin.pathname !== '/' || publicOrigin.search || publicOrigin.hash) {
  throw new Error('STUDY_PUBLIC_URL must be an origin without a path, query or fragment');
}
if (process.env.STUDY_ADMIN_PASSWORD && process.env.STUDY_ADMIN_PASSWORD.length < 16) {
  throw new Error('STUDY_ADMIN_PASSWORD must contain at least 16 characters');
}

function respond(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function page(title, content, script = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${pageCss}</style></head>
  <body><header class="site-header"><div class="site-header-inner"><strong>Security Trust Study</strong><span>Checkpoint workspace</span></div></header>
  <main class="page-shell">${content}</main>${script}</body></html>`;
}
function studyInline(text) {
  return escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function studyMarkdown(source) {
  return source.trim().split(/\n\s*\n/).map((block) => {
    const lines = block.trim().split('\n');
    if (/^#{1,3} /.test(lines[0])) {
      const heading = lines.shift().replace(/^#{1,3} /, '');
      return `<h3>${studyInline(heading)}</h3>${lines.length ? `<p>${studyInline(lines.join(' '))}</p>` : ''}`;
    }
    if (lines.every((line) => /^\d+\. /.test(line))) {
      return `<ol>${lines.map((line) => `<li>${studyInline(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    }
    return `<p>${studyInline(lines.join(' '))}</p>`;
  }).join('');
}
function formItem(item) {
  const required = item.required ? ' required' : '';
  const label = `<label for="${item.id}">${escapeHtml(item.label)}</label>`;
  if (item.type === 'choice') {
    return `${label}<select id="${item.id}" name="${item.id}"${required}><option value="">Select one</option>${item.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`;
  }
  if (item.type === 'text') return `${label}<textarea id="${item.id}" name="${item.id}" maxlength="${item.maxLength}"${required}></textarea>`;
  const step = item.type === 'scale' ? '1' : 'any';
  const anchors = item.anchors ? `<small>${item.min}: ${escapeHtml(item.anchors[String(item.min)])}; ${item.max}: ${escapeHtml(item.anchors[String(item.max)])}</small>` : '';
  return `${label}<input id="${item.id}" name="${item.id}" type="number" min="${item.min}" max="${item.max}" step="${step}"${required}>${anchors}`;
}
function tokenSession(token) {
  const session = sessionForToken(store, token);
  if (!session) throw new Error('Invalid session token');
  return session;
}
function ownedTask(session, taskId) {
  const task = taskFor(store, taskId);
  if (!task || task.participant_id !== session.participant_id) throw new Error('Task does not belong to this session');
  return task;
}
function hasForm(participantId, kind, taskId = null) {
  return Boolean(store.db.prepare('SELECT 1 FROM forms WHERE participant_id = ? AND kind = ? AND task_id IS ?')
    .get(participantId, kind, taskId));
}
function checkpointProgress(task) {
  const sequence = JSON.parse(task.checkpoint_order_json);
  const reviews = store.db.prepare('SELECT checkpoint_id, decision_at FROM reviews WHERE task_id = ?').all(task.task_id);
  const skips = new Set(store.db.prepare('SELECT checkpoint_id FROM skips WHERE task_id = ?').all(task.task_id)
    .map((row) => row.checkpoint_id));
  const decided = new Set(reviews.filter((row) => row.decision_at).map((row) => row.checkpoint_id));
  const resolved = new Set([...decided, ...skips]);
  return { sequence, skips, resolved, current: sequence.find((id) => !resolved.has(id)) || null };
}
function checkpointTimeline(progress, finalSubmitted, label = 'Task progress') {
  const { sequence, skips, resolved, current } = progress;
  const recorded = sequence.filter((id) => resolved.has(id)).length + Number(Boolean(finalSubmitted));
  const steps = sequence.map((id, index) => {
    const state = skips.has(id) ? 'skipped' : resolved.has(id) ? 'done' : id === current ? 'current' : 'pending';
    const status = state === 'skipped' ? 'Skipped' : state === 'done' ? 'Completed' : state === 'current' ? 'Current' : 'Pending';
    return `<li class="timeline-step ${state}"${state === 'current' ? ' aria-current="step"' : ''}>
      <span class="timeline-marker" aria-hidden="true">${state === 'done' ? '✓' : state === 'skipped' ? '–' : index + 1}</span>
      <span class="timeline-label"><strong>Checkpoint ${escapeHtml(id)}</strong><small>${status}</small></span></li>`;
  });
  const finalState = finalSubmitted ? 'done' : current ? 'pending' : 'current';
  steps.push(`<li class="timeline-step ${finalState}"${finalState === 'current' ? ' aria-current="step"' : ''}>
    <span class="timeline-marker" aria-hidden="true">${finalSubmitted ? '✓' : sequence.length + 1}</span>
    <span class="timeline-label"><strong>Final code</strong><small>${finalSubmitted ? 'Submitted' : finalState === 'current' ? 'Current' : 'Pending'}</small></span></li>`);
  return `<div class="timeline-heading"><h2>${escapeHtml(label)}</h2><span>${recorded} of ${sequence.length + 1} recorded</span></div>
    <progress class="timeline-progress" value="${recorded}" max="${sequence.length + 1}" aria-label="${escapeHtml(label)}: ${recorded} of ${sequence.length + 1} steps recorded">${recorded} of ${sequence.length + 1}</progress>
    <ol class="checkpoint-timeline">${steps.join('')}</ol>`;
}
function taskAvailable(session, task) {
  if (!hasForm(session.participant_id, 'pre_task')) throw new Error('Complete pre-task questions first');
  if (task.task_order === 2) {
    const first = store.db.prepare('SELECT task_id, final_sha256 FROM tasks WHERE participant_id = ? AND task_order = 1')
      .get(session.participant_id);
    if (!first?.final_sha256 || !hasForm(session.participant_id, 'after_task', first.task_id)) {
      throw new Error('Finish Task 1 and its after-task questions first');
    }
  }
}
function adminAuthorized(req) {
  const password = process.env.STUDY_ADMIN_PASSWORD;
  if (!password) return false;
  const match = /^Basic (.+)$/i.exec(req.headers.authorization || '');
  if (!match) return false;
  let decoded;
  try { decoded = Buffer.from(match[1], 'base64').toString('utf8'); } catch { return false; }
  const colon = decoded.indexOf(':');
  if (colon < 0 || decoded.slice(0, colon) !== 'researcher') return false;
  const provided = Buffer.from(decoded.slice(colon + 1));
  const expected = Buffer.from(password);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
function adminPage() {
  const sessions = store.db.prepare('SELECT participant_id, token, created_at FROM sessions ORDER BY ordinal DESC').all();
  const rows = sessions.map((row) => `<tr><td>${escapeHtml(row.participant_id)}</td><td>${escapeHtml(row.created_at)}</td>
    <td><a href="/session?token=${encodeURIComponent(row.token)}">Participant link</a></td></tr>`).join('');
  return page('Researcher console', `<h1>Researcher console</h1><p>Private: keep this screen and its participant links away from participants.</p>
    <p><a href="/admin/audit">Measurement and recording audit</a></p>
    <form method="post" action="/admin/create"><label for="participant_id">New pseudonymous participant ID</label>
    <input id="participant_id" name="participant_id" pattern="P[0-9]{3,}" required placeholder="P014">
    <button type="submit">Create participant and two task assignments</button></form>
    <h2>Sessions</h2><table><thead><tr><th>ID</th><th>Created</th><th>Link</th></tr></thead><tbody>${rows}</tbody></table>`);
}
function adminAuditPage() {
  const report = measurementAudit(store);
  const rows = report.tasks.map((task) => `<tr><td>${escapeHtml(task.task_id)}</td>
    <td>${escapeHtml(task.condition)}</td><td>${task.checkpoints.filter((item) => item.exposed).length}/4 exposed</td>
    <td>${task.checkpoints.filter((item) => item.decision).length}/4 decided</td>
    <td>${task.final_snapshot_received ? 'yes' : 'no'}</td>
    <td>${escapeHtml(Object.entries(task.source_counts).map(([name, count]) => `${name}: ${count}`).join(', ') || 'none')}</td>
    <td>${escapeHtml(task.warnings.join(', ') || 'none')}</td>
    <td>${escapeHtml(task.optional_notes.join(', ') || 'none')}</td></tr>`).join('');
  return page('Measurement audit', `<p><a href="/admin">Researcher console</a></p><h1>Measurement and recording audit</h1>
    <p>Generated ${escapeHtml(report.generated_at_utc)}. Missing optional pointer data does not invalidate a task. Verify actual screen visibility and transcript completeness separately.</p>
    <p><a href="/admin/audit.json">Download full JSON audit with per-checkpoint timing and evidence hashes</a></p>
    <table border="1" cellpadding="5"><thead><tr><th>Task</th><th>Condition</th><th>Exposure</th><th>Decision</th><th>Final code</th><th>Event sources</th><th>Core warnings</th><th>Optional notes</th></tr></thead><tbody>${rows}</tbody></table>`);
}
function formPage(kind, token, taskId) {
  const form = forms[kind];
  const fields = form.items.map(formItem).join('');
  const content = `<a class="back-link" href="/session?token=${encodeURIComponent(token)}">← Back to session</a>
  <div class="page-heading"><p class="eyebrow">Study questions</p><h1>${escapeHtml(form.title)}</h1>
  <p>${escapeHtml(form.timing)}. Your participant code is used; do not enter a name or email address.</p></div>
  <form id="study-form" class="panel">${fields}<button type="submit">Save answers</button></form><p id="message" class="status-line" role="status"></p>`;
  const script = `<script>
const kind=${JSON.stringify(kind)}, token=${JSON.stringify(token)}, taskId=${JSON.stringify(taskId || '')};
document.getElementById('study-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const answers={};
  for (const item of ${JSON.stringify(form.items.map(({ id, type }) => ({ id, type })))}) {
    const value=document.getElementById(item.id).value;
    if(value !== '') answers[item.id]=(item.type==='number'||item.type==='scale')?Number(value):value;
  }
  const response=await fetch('/api/form',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,kind,task_id:taskId||null,answers})});
  const result=await response.json();
  const message=document.getElementById('message');
  if(response.ok)message.innerHTML='Saved. <a href="/session?token='+encodeURIComponent(token)+'">Continue to your study page</a>.';
  else message.textContent=result.error;
  message.className=response.ok?'':'error';
  if(response.ok) document.querySelector('button[type=submit]').disabled=true;
});</script>`;
  return page(form.title, content, script);
}

function practicePage() {
  const example = `-export function label(name) { return name; }\n+export function label(name) { return name.trim(); }`;
  return page('Practice review', `<div class="page-heading"><p class="eyebrow">Unscored practice</p><h1>Practice review</h1>
  <p>This short example teaches the review controls. It does not save an answer or change an IDE file.</p></div>
  <section class="panel"><p>Requirement: remove spaces at the beginning and end of a name before displaying it.</p></section>
  <button id="practice-reveal">Show proposed change</button>
  <section id="practice-proposal" class="panel" hidden><h2>Proposed change</h2><pre id="practice-patch"></pre>
  <label for="practice-decision">Would you provisionally keep or reject this change?</label>
  <select id="practice-decision"><option value="">Select one</option><option>Keep</option><option>Reject</option></select>
  <label for="practice-confidence">What is the chance (0–100%) that it meets the requirement?</label>
  <input id="practice-confidence" type="number" min="0" max="100" step="1">
  <button id="practice-record">Record practice answer</button></section>
  <p id="practice-message" class="status-line" role="status"></p>`, `<script>
const sample=${JSON.stringify(example)};
document.getElementById('practice-reveal').addEventListener('click',()=>{
  document.getElementById('practice-patch').textContent=sample;
  document.getElementById('practice-proposal').hidden=false;
  document.getElementById('practice-reveal').hidden=true;
});
document.getElementById('practice-record').addEventListener('click',()=>{
  const decision=document.getElementById('practice-decision').value;
  const raw=document.getElementById('practice-confidence').value;
  const number=Number(raw);
  const message=document.getElementById('practice-message');
  if(!decision||raw===''||!Number.isInteger(number)||number<0||number>100){
    message.textContent='Choose a decision and a whole-number estimate from 0 to 100.';return;
  }
  message.textContent='Practice complete. No answer was saved. In the real task, the proposed change also appears in the IDE workspace.';
  document.getElementById('practice-record').disabled=true;
});</script>`);
}

function sessionPage(session, token) {
  const preDone = hasForm(session.participant_id, 'pre_task');
  const portalManaged = JSON.parse(session.assignment_json).source === 'research-portal-assignment';
  const tasks = store.db.prepare('SELECT * FROM tasks WHERE participant_id = ? ORDER BY task_order').all(session.participant_id);
  const cards = tasks.map((task, index) => {
    const previousFinished = index === 0 || (Boolean(tasks[index - 1].final_sha256) &&
      hasForm(session.participant_id, 'after_task', tasks[index - 1].task_id));
    if (!preDone || !previousFinished) return `<section><p class="eyebrow">Task ${task.task_order} · Upcoming</p><h2>Task ${task.task_order}</h2><p>${!preDone ? 'Available after pre-task questions.' : `Available after Task ${task.task_order - 1} and its after-task questions.`}</p>
      <div class="task-card-progress">${checkpointTimeline(checkpointProgress(task), task.final_sha256, `Task ${task.task_order} checkpoints`)}</div></section>`;
    const name = task.project_id === 'A' ? 'Resource catalogue' : 'Support archive';
    const progress = checkpointProgress(task);
    const sequence = progress.sequence;
    const taskLink = `/task?token=${encodeURIComponent(token)}&task_id=${encodeURIComponent(task.task_id)}`;
    const packageLink = `/package?token=${encodeURIComponent(token)}&task_id=${encodeURIComponent(task.task_id)}`;
    const afterLink = `/form/after-task?token=${encodeURIComponent(token)}&task_id=${encodeURIComponent(task.task_id)}`;
    return `<section><p class="eyebrow">Task ${task.task_order} · ${task.final_sha256 ? 'Submitted' : 'Available'}</p><h2>Task ${task.task_order}: ${name}</h2><p>Assigned work style: <strong>${escapeHtml(task.condition)}</strong>. Four short steps: ${sequence.join(', ')}.</p>
      <div class="task-card-progress">${checkpointTimeline(progress, task.final_sha256, `Task ${task.task_order} checkpoints`)}</div>
      <div class="action-row"><a class="button secondary" href="${packageLink}">Download this task's codebase (.zip)</a>
      <a class="button" href="${taskLink}">Open task sheet and progress</a></div>
      ${task.final_sha256 ? portalManaged ? '<p class="notice good">Final code received. Return to the login portal, mark this task submitted, and complete its after-task questions there.</p>'
        : `<p class="notice good">Final code received. <a href="${afterLink}">After-task questions</a></p>` : ''}</section>`;
  }).join('');
  const finalLink = `/form/after-both?token=${encodeURIComponent(token)}`;
  return page('Your study session', `<div class="page-heading"><p class="eyebrow">Participant workspace</p><h1>Study session ${escapeHtml(session.session_id)}</h1>
    <p>Use this page for task instructions and answers. Do the coding in Antigravity with the downloaded project.</p></div>
    ${preDone ? '<p class="notice good">Pre-task questions received.</p>' : `<p class="notice warning"><a href="/form/pre?token=${encodeURIComponent(token)}">Complete pre-task questions first</a>.</p>`}
    ${preDone ? `<section class="panel"><h2>Before coding</h2><ol><li>Install Antigravity and sign in. Install Node.js 24 so <code>node --version</code> works in a terminal.</li>
    <li>Download and extract the first codebase ZIP. Open that extracted folder in Antigravity.</li>
    <li>In the project terminal run <code>node study/setup.mjs</code>, then <code>node study/client.mjs</code> in a terminal you leave open.</li>
    <li>Confirm the <code>study-observer</code> workspace hook is enabled in Antigravity. The task page will show whether the client and agent capture have connected.</li></ol>
    <p><a href="/practice">Try the unscored review controls</a>.</p></section>` : '<p>Setup instructions unlock after the pre-task questions.</p>'}<h2>Your tasks</h2><div class="task-grid">${cards}</div>
    ${tasks.every((task) => task.final_sha256 && hasForm(session.participant_id, 'after_task', task.task_id)) ?
      portalManaged ? '<p>Complete the final questions after both tasks in the login portal.</p>' : `<p><a href="${finalLink}">Final questions after both tasks</a></p>` : ''}`);
}

function taskPage(session, token, task) {
  const portalManaged = JSON.parse(session.assignment_json).source === 'research-portal-assignment';
  const progress = checkpointProgress(task);
  const { sequence, resolved, current } = progress;
  logEvent(store, task.task_id, 'task_page_opened', {
    source: 'participant-portal', actor: 'participant', checkpoint_id: current || undefined,
    data: { task_order: task.task_order }
  });
  const project = task.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  const condition = readFileSync(resolve(root, 'instruments', `CONDITION_${task.condition.toUpperCase()}.md`), 'utf8');
  const sheet = current ? readFileSync(resolve(root, 'instruments', project, `${current}_TASK.md`), 'utf8') : '';
  const taskId = task.task_id;
  const content = `<a class="back-link" href="/session?token=${encodeURIComponent(token)}">← Back to session</a>
    <div class="page-heading"><p class="eyebrow">Task ${task.task_order} · Checkpoint study</p><h1>Task ${task.task_order}: ${escapeHtml(project.replace('-', ' '))}</h1>
    <p>Complete the steps in this order: ${sequence.map((id) => `${id}${resolved.has(id) ? ' ✓' : ''}`).join(' → ')}.</p></div>
    <section class="panel">${checkpointTimeline(progress, task.final_sha256)}</section>
    <div class="two-column"><section class="panel"><h2>Work style</h2><div class="study-copy">${studyMarkdown(condition)}</div></section>
    ${current ? `<section class="panel"><h2>Current task sheet: ${current}</h2><div class="study-copy">${studyMarkdown(sheet)}</div></section>` :
      `<section class="panel"><h2>Task status</h2><p>${task.final_sha256 ? 'Final code received.' : 'All steps are recorded.'}</p></section>`}</div>
    ${current ? `<section class="panel"><h2>Continue in Antigravity</h2><p>Open the downloaded project in Antigravity. Ask the coding agent to inspect or discuss this step, then request the supplied proposal. Keep <code>node study/client.mjs</code> running.</p>
      <p id="capture-status" class="status-line" role="status">Checking the study client…</p><div class="action-row"><button id="request-review">I am ready to review the proposal</button></div><p id="review-status" class="status-line" role="status"></p></section>` :
      task.final_sha256 ? portalManaged ? '<p class="notice good">Your final code has been received. Return to the login portal for the after-task form.</p>'
        : '<p class="notice good">Your final code has been received. Return to your session page for the after-task form.</p>'
        : '<section class="panel"><h2>Submit your work</h2><p>All steps are recorded. Submit the final code from your current workspace.</p><button id="finish-task">Submit final code</button><p id="review-status" class="status-line" role="status"></p></section>'}`;
  const script = `<script>
const token=${JSON.stringify(token)},taskId=${JSON.stringify(taskId)},checkpoint=${JSON.stringify(current || '')};
async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,task_id:taskId,...body})});const v=await r.json();if(!r.ok)throw Error(v.error);return v;}
async function refresh(){try{const r=await fetch('/api/client/status?token='+encodeURIComponent(token)+'&task_id='+encodeURIComponent(taskId)+'&checkpoint='+encodeURIComponent(checkpoint));const v=await r.json();if(!r.ok)throw Error(v.error);
  const c=document.getElementById('capture-status');if(c)c.textContent=v.client_connected?'Study client connected'+(v.agent_capture_seen?'; agent hook observed.':'; waiting for agent activity.'): 'Study client not connected. Run node study/setup.mjs and node study/client.mjs in the project.';
  const s=document.getElementById('review-status');if(s){if(v.review_url)s.innerHTML='<a href="'+v.review_url+'">Open the prepared proposal review</a>';else if(v.job_status==='requested')s.textContent='Preparing your review from the IDE workspace…';else if(v.job_status==='final_requested')s.textContent='Waiting for final code upload…';else if(v.finalized)location.reload();}
}catch(e){const s=document.getElementById('review-status');if(s)s.textContent=e.message;}}
const reviewButton=document.getElementById('request-review');if(reviewButton)reviewButton.onclick=async()=>{try{await post('/api/client/request-review',{checkpoint_id:checkpoint});reviewButton.disabled=true;refresh();}catch(e){document.getElementById('review-status').textContent=e.message;}};
const finishButton=document.getElementById('finish-task');if(finishButton)finishButton.onclick=async()=>{try{await post('/api/client/request-final',{});finishButton.disabled=true;refresh();}catch(e){document.getElementById('review-status').textContent=e.message;}};
refresh();setInterval(refresh,2000);
</script>`;
  return page(`Task ${task.task_order}`, content, script);
}

function reviewPage(session, review, token, skipped) {
  const task = ownedTask(session, review.task_id);
  const project = task.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  const sheet = readFileSync(resolve(root, 'instruments', project, `${review.checkpoint_id}_TASK.md`), 'utf8');
  const locked = skipped ? '<p>This checkpoint was stopped by the researcher. Return to the task workspace.</p>' :
    review.decision_at ? '<p>This review has already been recorded.</p>' : '';
  const content = `<a class="back-link" href="/task?token=${encodeURIComponent(token)}&task_id=${encodeURIComponent(task.task_id)}">← Return to task progress</a>
  <div class="page-heading"><p class="eyebrow">Checkpoint ${escapeHtml(review.checkpoint_id)}</p><h1>Review proposed change</h1><p>Task ${escapeHtml(task.task_id)}, checkpoint ${escapeHtml(review.checkpoint_id)}</p></div>
  <section class="panel"><h2>Requirement</h2><div class="study-copy">${studyMarkdown(sheet)}</div></section>
  <p class="review-rule">This is a fixed, preselected study proposal, not a live display of the coding agent's edits. The patch below stays frozen even if the workspace changes later. Review the exact applied code before giving your first decision and confidence rating; after that, you may edit or replace it. This controlled-review page is separate from the natural-coding rehearsal.</p>
  ${skipped ? locked : ''}<div class="action-row"><button id="reveal"${review.exposed_at || skipped ? ' hidden' : ''}>Show proposed change</button></div>
  <section id="proposal" class="panel"${review.exposed_at ? '' : ' hidden'}><h2>Proposed change</h2><pre id="patch">${review.exposed_at ? escapeHtml(review.patch_text) : ''}</pre>
  <small>Snapshot: ${escapeHtml(review.proposal_sha256)}</small>
  ${skipped ? '' : locked}<form id="review-form" class="review-form"${review.decision_at || skipped ? ' hidden' : ''}>
  <label for="decision">Will you provisionally keep or reject this exact proposed change?</label><select id="decision" required><option value="">Select one</option><option value="keep">Keep</option><option value="reject">Reject</option></select>
  <label for="confidence">What is the chance (0–100%) that this exact proposed code meets the security requirement above?</label><input id="confidence" type="number" min="0" max="100" step="1" required>
  <label for="reason">What evidence led to that estimate? (optional)</label><textarea id="reason" maxlength="500"></textarea>
  <label for="planned">What, if anything, will you check before final submission? (optional)</label><textarea id="planned" maxlength="500"></textarea>
  <button type="submit">Record decision and confidence</button></form></section><p id="message" class="status-line" role="status"></p>
  <p><a href="/task?token=${encodeURIComponent(token)}&task_id=${encodeURIComponent(task.task_id)}">Return to task progress</a></p>`;
  const script = `<script>
const token=${JSON.stringify(token)},reviewId=${JSON.stringify(review.review_id)};
document.getElementById('reveal').addEventListener('click',async()=>{
  const response=await fetch('/api/expose',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,review_id:reviewId})});
  const result=await response.json();
  if(!response.ok){document.getElementById('message').textContent=result.error;return;}
  if(result.pending){document.getElementById('message').textContent='Applying the proposal in Antigravity…';
    for(let i=0;i<60;i++){await new Promise(done=>setTimeout(done,1000));const check=await fetch('/api/client/review-status?token='+encodeURIComponent(token)+'&review_id='+encodeURIComponent(reviewId));const value=await check.json();if(value.exposed){result.patch=value.patch;break;}}
    if(!result.patch){document.getElementById('message').textContent='Still waiting for the study client. Check its terminal and try again.';return;}
  }
  document.getElementById('patch').textContent=result.patch;
  document.getElementById('proposal').hidden=false;document.getElementById('reveal').hidden=true;
  document.getElementById('message').textContent='Proposal is ready in the IDE workspace.';
});
document.getElementById('review-form').addEventListener('submit',async(event)=>{
  event.preventDefault();
  const body={token,review_id:reviewId,decision:document.getElementById('decision').value,
    security_probability_pct:Number(document.getElementById('confidence').value),
    confidence_reason:document.getElementById('reason').value,planned_check:document.getElementById('planned').value};
  const response=await fetch('/api/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();
  const message=document.getElementById('message');
  if(response.ok&&result.pending){message.textContent='Checking the exact code snapshot in Antigravity…';
    let confirmed=false;
    for(let i=0;i<30;i++){await new Promise(done=>setTimeout(done,1000));const check=await fetch('/api/client/review-status?token='+encodeURIComponent(token)+'&review_id='+encodeURIComponent(reviewId));const value=await check.json();
      if(value.decision_saved){confirmed=true;break;}
      if(value.job_status==='review_conflict'){message.textContent='The code changed during review. Your decision was not recorded; ask the researcher to check.';return;}}
    if(!confirmed){message.textContent='Still waiting for the study client. Check its terminal before trying again.';return;}
    if(body.decision==='reject'){
      message.textContent='Decision recorded. Restoring the previous code…';
      let restored=false;
      for(let i=0;i<30;i++){await new Promise(done=>setTimeout(done,1000));const check=await fetch('/api/client/review-status?token='+encodeURIComponent(token)+'&review_id='+encodeURIComponent(reviewId));const value=await check.json();if(value.job_status==='restored'){restored=true;break;}}
      if(!restored){message.textContent='Decision recorded, but restoration is still pending. Check the study client before coding.';return;}
    }
  }
  message.textContent=response.ok?'Recorded. You may now continue coding.':result.error;
  message.className=response.ok?'':'error';
  if(response.ok) document.getElementById('review-form').hidden=true;
});</script>`;
  return page('Review proposal', content, script);
}

async function bodyJson(req, limit = 128000) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > limit) throw new Error('Request too large');
  }
  return JSON.parse(text || '{}');
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname.startsWith('/admin')) {
      if (!process.env.STUDY_ADMIN_PASSWORD) return respond(res, 404, { error: 'Not found' });
      if (!adminAuthorized(req)) {
        res.writeHead(401, { 'www-authenticate': 'Basic realm="Study researcher console"',
          'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        return res.end('Researcher authentication required');
      }
      if (req.method === 'GET' && url.pathname === '/admin') return respond(res, 200, adminPage(), 'text/html; charset=utf-8');
      if (req.method === 'GET' && url.pathname === '/admin/audit') return respond(res, 200,
        adminAuditPage(), 'text/html; charset=utf-8');
      if (req.method === 'GET' && url.pathname === '/admin/audit.json') return respond(res, 200,
        measurementAudit(store));
      if (req.method === 'POST' && url.pathname === '/admin/create') {
        if (req.headers.origin && req.headers.origin !== publicOrigin.origin) throw new Error('Invalid researcher form origin');
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 2000) throw new Error('Form too large'); }
        const id = new URLSearchParams(raw).get('participant_id');
        const result = createSession(store, id);
        res.writeHead(303, { location: `/session?token=${encodeURIComponent(result.token)}`,
          'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        return res.end();
      }
    }
    if (req.method === 'GET' && url.pathname === '/health') return respond(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/practice') return respond(res, 200,
      practicePage(), 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/') return respond(res, 200,
      page('Study local app', '<h1>Study local app</h1><p>Use the private session link supplied by the researcher.</p>'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/session') {
      const token = url.searchParams.get('token');
      return respond(res, 200, sessionPage(tokenSession(token), token), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/task') {
      const token = url.searchParams.get('token');
      const session = tokenSession(token);
      const task = ownedTask(session, url.searchParams.get('task_id'));
      taskAvailable(session, task);
      return respond(res, 200, taskPage(session, token, task), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/package') {
      const token = url.searchParams.get('token');
      const session = tokenSession(token);
      const task = ownedTask(session, url.searchParams.get('task_id'));
      taskAvailable(session, task);
      const bytes = participantPackage(task, token, publicUrl);
      logEvent(store, task.task_id, 'package_downloaded', {
        source: 'participant-portal', actor: 'participant', data: { package_kind: 'participant-only-zip' }
      });
      res.writeHead(200, { 'content-type': 'application/zip', 'content-length': bytes.length,
        'content-disposition': `attachment; filename="${task.task_id}-codebase.zip"`,
        'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' });
      return res.end(bytes);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/form/')) {
      const kind = { pre: 'pre_task', 'after-task': 'after_task', 'after-both': 'after_both' }[url.pathname.split('/')[2]];
      const token = url.searchParams.get('token');
      const session = tokenSession(token);
      if (!forms[kind] || kind === 'checkpoint') throw new Error('Unknown form');
      if (JSON.parse(session.assignment_json).source === 'research-portal-assignment') {
        throw new Error('Complete questionnaires in the login portal');
      }
      const taskId = url.searchParams.get('task_id');
      if (kind === 'after_task') ownedTask(session, taskId);
      return respond(res, 200, formPage(kind, token, taskId), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/review') {
      const token = url.searchParams.get('token');
      const session = tokenSession(token);
      const review = reviewFor(store, url.searchParams.get('review'));
      if (!review) throw new Error('Unknown review');
      const skipped = Boolean(store.db.prepare('SELECT 1 FROM skips WHERE task_id = ? AND checkpoint_id = ?')
        .get(review.task_id, review.checkpoint_id));
      return respond(res, 200, reviewPage(session, review, token, skipped), 'text/html; charset=utf-8');
    }

    if (req.method === 'GET' && url.pathname === '/api/client/job') {
      const session = tokenSession(url.searchParams.get('token'));
      const task = ownedTask(session, url.searchParams.get('task_id'));
      return respond(res, 200, currentJob(store, task));
    }
    if (req.method === 'GET' && url.pathname === '/api/client/status') {
      const token = url.searchParams.get('token');
      const session = tokenSession(token);
      const task = ownedTask(session, url.searchParams.get('task_id'));
      const status = store.db.prepare('SELECT * FROM client_status WHERE task_id = ?').get(task.task_id);
      const agentSeen = Boolean(store.db.prepare('SELECT 1 FROM events WHERE task_id = ? AND event_json LIKE ? LIMIT 1')
        .get(task.task_id, '%"source":"antigravity-hook"%'));
      const checkpoint = url.searchParams.get('checkpoint');
      const job = checkpoint ? store.db.prepare("SELECT * FROM client_jobs WHERE task_id = ? AND checkpoint_id = ? AND kind = 'review'")
        .get(task.task_id, checkpoint) : currentJob(store, task);
      const reviewUrl = job?.review_id && ['prepared', 'reveal_requested', 'applied', 'decided', 'restore_requested', 'restored'].includes(job.status)
        ? `/review?token=${encodeURIComponent(token)}&review=${encodeURIComponent(job.review_id)}` : null;
      return respond(res, 200, { client_connected: Boolean(status && Date.now() - Date.parse(status.last_seen_at) < 15000),
        agent_capture_seen: agentSeen, job_status: job?.status || 'idle', review_url: reviewUrl,
        finalized: Boolean(task.final_sha256) });
    }
    if (req.method === 'GET' && url.pathname === '/api/client/review-status') {
      const session = tokenSession(url.searchParams.get('token'));
      const review = reviewFor(store, url.searchParams.get('review_id'));
      if (!review) throw new Error('Unknown review');
      ownedTask(session, review.task_id);
      const job = reviewJob(store, review.review_id);
      return respond(res, 200, { exposed: Boolean(review.exposed_at),
        ...(review.exposed_at ? { patch: review.patch_text } : {}),
        decision_saved: Boolean(review.decision_at), job_status: job?.status || null });
    }
    if (req.method === 'POST' && url.pathname.startsWith('/api/client/')) {
      const body = await bodyJson(req, url.pathname === '/api/client/transcript' ? 21_000_000
        : ['/api/client/prepare', '/api/client/finalize'].includes(url.pathname) ? 3_000_000 : 128000);
      const session = tokenSession(body.token);
      const task = ownedTask(session, body.task_id);
      if (url.pathname === '/api/client/transcript') {
        if (typeof body.content_base64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.content_base64) ||
            body.content_base64.length > 20_000_000 || !/^sha256:[a-f0-9]{64}$/.test(body.sha256 || '')) {
          throw new Error('Invalid transcript upload');
        }
        const bytes = Buffer.from(body.content_base64, 'base64');
        if (!bytes.length || bytes.length > 15_000_000) throw new Error('Transcript is too large');
        const sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
        if (sha256 !== body.sha256) throw new Error('Transcript hash mismatch');
        const existing = store.db.prepare("SELECT evidence_id FROM evidence WHERE task_id = ? AND kind = 'agent-transcript' AND sha256 = ?")
          .get(task.task_id, sha256);
        if (existing) return respond(res, 200, { evidence_id: existing.evidence_id, sha256, already_saved: true });
        const id = randomUUID();
        const folder = join(store.dir, 'raw', 'evidence');
        mkdirSync(folder, { recursive: true, mode: 0o700 });
        const path = join(folder, `${id}-agent-transcript.jsonl`);
        writeFileSync(path, bytes, { mode: 0o600 });
        store.db.prepare('INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          id, task.task_id, 'agent-transcript', path, sha256, 'explicit participant upload', new Date().toISOString());
        return respond(res, 200, { evidence_id: id, sha256, already_saved: false });
      }
      if (['/api/client/request-review', '/api/client/request-final'].includes(url.pathname)) taskAvailable(session, task);
      if (url.pathname === '/api/client/heartbeat') return respond(res, 200, heartbeat(store, task, body.workspace_sha256));
      if (url.pathname === '/api/client/ingest-telemetry') return respond(res, 200,
        ingestTelemetryRows(store, task.task_id, body.rows));
      if (url.pathname === '/api/client/request-review') return respond(res, 200, requestReview(store, task, body.checkpoint_id));
      if (url.pathname === '/api/client/prepare') return respond(res, 200, prepareReview(store, task, body));
      if (url.pathname === '/api/client/applied') return respond(res, 200, markApplied(store, task, body));
      if (url.pathname === '/api/client/verify-decision') return respond(res, 200, verifyDecision(store, task, body));
      if (url.pathname === '/api/client/restored') return respond(res, 200, markRestored(store, task, body));
      if (url.pathname === '/api/client/request-final') return respond(res, 200, requestFinal(store, task));
      if (url.pathname === '/api/client/finalize') return respond(res, 200, submitFinal(store, task, body));
      throw new Error('Unknown client operation');
    }

    if (req.method === 'POST' && url.pathname === '/api/form') {
      const body = await bodyJson(req);
      const session = tokenSession(body.token);
      if (!['pre_task', 'after_task', 'after_both'].includes(body.kind)) throw new Error('Invalid form kind');
      if (JSON.parse(session.assignment_json).source === 'research-portal-assignment') {
        throw new Error('Complete questionnaires in the login portal');
      }
      const task = body.task_id ? ownedTask(session, body.task_id) : null;
      if (body.kind === 'after_task' && (!task || !task.final_sha256)) throw new Error('Finalize this task first');
      if (body.kind !== 'after_task' && task) throw new Error('Task ID not needed for this form');
      if (hasForm(session.participant_id, body.kind, task?.task_id || null)) throw new Error('This form has already been completed');
      if (body.kind === 'after_both') {
        const tasks = store.db.prepare('SELECT task_id, final_sha256 FROM tasks WHERE participant_id = ?').all(session.participant_id);
        if (!tasks.every((item) => item.final_sha256 && hasForm(session.participant_id, 'after_task', item.task_id))) {
          throw new Error('Finish both tasks and their after-task questions first');
        }
      }
      const answers = validateAnswers(body.kind, body.answers);
      const formId = randomUUID();
      store.db.prepare('INSERT INTO forms VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        formId, session.participant_id, task?.task_id || null, body.kind, formVersion,
        JSON.stringify(answers), new Date().toISOString());
      return respond(res, 200, { saved: true, form_id: formId });
    }
    if (req.method === 'POST' && url.pathname === '/api/expose') {
      const body = await bodyJson(req);
      const session = tokenSession(body.token);
      const review = reviewFor(store, body.review_id);
      if (!review) throw new Error('Unknown review');
      ownedTask(session, review.task_id);
      if (store.db.prepare('SELECT 1 FROM skips WHERE task_id = ? AND checkpoint_id = ?')
        .get(review.task_id, review.checkpoint_id)) throw new Error('Checkpoint was skipped');
      if (review.workspace_path === 'remote') {
        const job = reviewJob(store, review.review_id);
        if (!job || !['prepared', 'reveal_requested', 'applied', 'decided', 'restore_requested', 'restored'].includes(job.status)) {
          throw new Error('Remote review is not ready');
        }
        if (job.status === 'prepared') store.db.prepare('UPDATE client_jobs SET status = ?, updated_at = ? WHERE job_id = ?')
          .run('reveal_requested', new Date().toISOString(), job.job_id);
        return respond(res, 200, review.exposed_at ? { exposed: true, patch: review.patch_text } : { pending: true });
      }
      if (!review.exposed_at) {
        if (!review.baseline_sha256 || hashTree(review.workspace_path) !== review.baseline_sha256) {
          throw new Error('Workspace changed before exposure; ask researcher to reset');
        }
        const applied = spawnSync('git', ['apply', '-'], {
          cwd: review.workspace_path, input: review.patch_text, encoding: 'utf8'
        });
        if (applied.status !== 0) throw new Error(`Proposal could not be applied: ${applied.stderr}`);
        if (hashTree(review.workspace_path) !== review.proposal_sha256) {
          copyFileSync(review.before_file_path, resolve(review.workspace_path, review.relative_file));
          throw new Error('Applied proposal differs from frozen snapshot; ask researcher to reset');
        }
        store.db.prepare('UPDATE reviews SET exposed_at = ? WHERE review_id = ?').run(new Date().toISOString(), review.review_id);
        logEvent(store, review.task_id, 'candidate_exposed', {
          source: 'checkpoint-ui', actor: 'participant', checkpoint_id: review.checkpoint_id,
          candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
          evidence_ref: `snapshots/${review.review_id}/proposal`, data: { display_kind: 'patch', review_id: review.review_id }
        });
      }
      if (hashTree(review.workspace_path) !== review.proposal_sha256) throw new Error('Workspace changed during review; ask researcher to reset');
      return respond(res, 200, { exposed: true, patch: review.patch_text });
    }
    if (req.method === 'POST' && url.pathname === '/api/decision') {
      const body = await bodyJson(req);
      const session = tokenSession(body.token);
      const review = reviewFor(store, body.review_id);
      if (!review) throw new Error('Unknown review');
      ownedTask(session, review.task_id);
      if (store.db.prepare('SELECT 1 FROM skips WHERE task_id = ? AND checkpoint_id = ?')
        .get(review.task_id, review.checkpoint_id)) throw new Error('Checkpoint was skipped');
      if (!review.exposed_at || review.decision_at) throw new Error('Review is not open');
      if (!['keep', 'reject'].includes(body.decision) || !Number.isInteger(body.security_probability_pct) ||
          body.security_probability_pct < 0 || body.security_probability_pct > 100 ||
          String(body.confidence_reason || '').length > 500 || String(body.planned_check || '').length > 500) {
        throw new Error('Invalid decision or confidence');
      }
      if (review.workspace_path === 'remote') {
        const job = reviewJob(store, review.review_id);
        if (job?.status !== 'applied') throw new Error('Study client is not ready for a decision');
        return respond(res, 200, requestDecisionCheck(store, review, body));
      } else if (hashTree(review.workspace_path) !== review.proposal_sha256) {
        throw new Error('Workspace changed during review; ask researcher to reset');
      }
      const now = new Date().toISOString();
      store.db.prepare('UPDATE reviews SET decision = ?, confidence = ?, confidence_reason = ?, planned_check = ?, decision_at = ? WHERE review_id = ?')
        .run(body.decision, body.security_probability_pct, body.confidence_reason || '', body.planned_check || '', now, review.review_id);
      logEvent(store, review.task_id, 'provisional_decision', {
        source: 'checkpoint-ui', actor: 'participant', checkpoint_id: review.checkpoint_id,
        candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
        evidence_ref: `reviews/${review.review_id}`, data: { decision: body.decision }
      });
      logEvent(store, review.task_id, 'confidence_recorded', {
        source: 'checkpoint-ui', actor: 'participant', checkpoint_id: review.checkpoint_id,
        candidate_id: review.candidate_id, proposal_sha256: review.proposal_sha256,
        evidence_ref: `reviews/${review.review_id}`,
        data: { security_probability_pct: body.security_probability_pct, reason: body.confidence_reason || '' }
      });
      if (body.decision === 'reject') copyFileSync(review.before_file_path, resolve(review.workspace_path, review.relative_file));
      return respond(res, 200, { saved: true, proposal_sha256: review.proposal_sha256 });
    }
    if (req.method === 'POST' && url.pathname === '/api/event') {
      const body = await bodyJson(req);
      const session = tokenSession(body.token);
      const task = ownedTask(session, body.task_id);
      const allowed = new Set(['prompt_sent', 'response_visible', 'diff_opened', 'file_viewed', 'file_saved', 'test_run', 'scanner_run', 'repair_performed', 'logging_gap', 'agent_invocation_started', 'agent_invocation_ended']);
      if (!allowed.has(body.event_type) || !['companion-extension', 'antigravity-hook', 'transcript-import', 'researcher-video-code'].includes(body.source)) {
        throw new Error('Unsupported event source or type');
      }
      if (JSON.stringify(body.data || {}).length > 2000) throw new Error('Event details too large');
      const event = logEvent(store, task.task_id, body.event_type, {
        source: body.source, actor: body.actor || 'unknown', checkpoint_id: body.checkpoint_id,
        candidate_id: body.candidate_id, proposal_sha256: body.proposal_sha256,
        evidence_ref: body.evidence_ref, data: body.data || {}
      });
      return respond(res, 200, { event_id: event.event_id });
    }
    respond(res, 404, { error: 'Not found' });
  } catch (error) {
    respond(res, 400, { error: error.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Study app listening at http://127.0.0.1:${port}`);
});
