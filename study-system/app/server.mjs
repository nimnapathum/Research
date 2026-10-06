import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml, forms, hashTree, logEvent, openStore, reviewFor, sessionForToken, taskFor, validateAnswers } from './lib.mjs';

const store = openStore();
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const formVersion = JSON.parse(readFileSync(resolve(root, 'instruments/forms.json'), 'utf8')).version;
const port = Number(process.env.STUDY_PORT || 4175);

function respond(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function page(title, content, script = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>
body{font:16px/1.5 system-ui,sans-serif;max-width:850px;margin:2rem auto;padding:0 1rem;color:#111;background:#fff}
main{border:1px solid #aaa;padding:1.5rem}pre{white-space:pre-wrap;overflow:auto;border:1px solid #aaa;padding:1rem;background:#f7f7f7}
label{display:block;margin:1.2rem 0 .3rem}input,select,textarea,button{font:inherit;padding:.45rem}input[type=number]{width:8rem}textarea{width:95%;min-height:4rem}
button{margin-top:1rem}small{display:block;color:#444}.error{color:#900}hr{border:0;border-top:1px solid #aaa;margin:1.5rem 0}
</style></head><body><main>${content}</main>${script}</body></html>`;
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
function formPage(kind, token, taskId) {
  const form = forms[kind];
  const fields = form.items.map(formItem).join('');
  const content = `<h1>${escapeHtml(form.title)}</h1><p>${escapeHtml(form.timing)}. Your participant code is used; do not enter a name or email address.</p>
  <form id="study-form">${fields}<button type="submit">Save answers</button></form><p id="message" role="status"></p>`;
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
  message.textContent=response.ok?'Saved. Please return to the researcher.':result.error;
  message.className=response.ok?'':'error';
  if(response.ok) document.querySelector('button[type=submit]').disabled=true;
});</script>`;
  return page(form.title, content, script);
}

function practicePage() {
  const example = `-export function label(name) { return name; }\n+export function label(name) { return name.trim(); }`;
  return page('Practice review', `<h1>Practice review</h1>
  <p>This short example teaches the review controls. It does not save an answer or change an IDE file.</p>
  <p>Requirement: remove spaces at the beginning and end of a name before displaying it.</p>
  <button id="practice-reveal">Show proposed change</button>
  <section id="practice-proposal" hidden><pre id="practice-patch"></pre>
  <label for="practice-decision">Would you provisionally keep or reject this change?</label>
  <select id="practice-decision"><option value="">Select one</option><option>Keep</option><option>Reject</option></select>
  <label for="practice-confidence">What is the chance (0–100%) that it meets the requirement?</label>
  <input id="practice-confidence" type="number" min="0" max="100" step="1">
  <button id="practice-record">Record practice answer</button></section>
  <p id="practice-message" role="status"></p>`, `<script>
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

function reviewPage(session, review, token, skipped) {
  const task = ownedTask(session, review.task_id);
  const project = task.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  const sheet = readFileSync(resolve(root, 'instruments', project, `${review.checkpoint_id}_TASK.md`), 'utf8');
  const locked = skipped ? '<p>This checkpoint was stopped by the researcher. Return to the task workspace.</p>' :
    review.decision_at ? '<p>This review has already been recorded.</p>' : '';
  const content = `<h1>Review proposed change</h1><p>Task ${escapeHtml(task.task_id)}, checkpoint ${escapeHtml(review.checkpoint_id)}</p>
  <h2>Requirement</h2><pre>${escapeHtml(sheet)}</pre><p>The proposal below is a frozen code snapshot. You may inspect it, ask the agent questions, and run checks. Do not edit it until you submit your first decision and confidence rating.</p>
  ${skipped ? locked : ''}<button id="reveal"${review.exposed_at || skipped ? ' hidden' : ''}>Show proposed change</button>
  <section id="proposal"${review.exposed_at ? '' : ' hidden'}><h2>Proposed change</h2><pre id="patch">${review.exposed_at ? escapeHtml(review.patch_text) : ''}</pre>
  <small>Snapshot: ${escapeHtml(review.proposal_sha256)}</small>
  ${skipped ? '' : locked}<form id="review-form"${review.decision_at || skipped ? ' hidden' : ''}>
  <label for="decision">Will you provisionally keep or reject this exact proposed change?</label><select id="decision" required><option value="">Select one</option><option value="keep">Keep</option><option value="reject">Reject</option></select>
  <label for="confidence">What is the chance (0–100%) that this exact proposed code meets the security requirement above?</label><input id="confidence" type="number" min="0" max="100" step="1" required>
  <label for="reason">What evidence led to that estimate? (optional)</label><textarea id="reason" maxlength="500"></textarea>
  <label for="planned">What, if anything, will you check before final submission? (optional)</label><textarea id="planned" maxlength="500"></textarea>
  <button type="submit">Record decision and confidence</button></form></section><p id="message" role="status"></p>`;
  const script = `<script>
const token=${JSON.stringify(token)},reviewId=${JSON.stringify(review.review_id)};
document.getElementById('reveal').addEventListener('click',async()=>{
  const response=await fetch('/api/expose',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,review_id:reviewId})});
  const result=await response.json();
  if(!response.ok){document.getElementById('message').textContent=result.error;return;}
  document.getElementById('patch').textContent=result.patch;
  document.getElementById('proposal').hidden=false;document.getElementById('reveal').hidden=true;
});
document.getElementById('review-form').addEventListener('submit',async(event)=>{
  event.preventDefault();
  const body={token,review_id:reviewId,decision:document.getElementById('decision').value,
    security_probability_pct:Number(document.getElementById('confidence').value),
    confidence_reason:document.getElementById('reason').value,planned_check:document.getElementById('planned').value};
  const response=await fetch('/api/decision',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const result=await response.json();
  const message=document.getElementById('message');message.textContent=response.ok?'Recorded. You may now continue coding.':result.error;
  message.className=response.ok?'':'error';
  if(response.ok) document.getElementById('review-form').hidden=true;
});</script>`;
  return page('Review proposal', content, script);
}

async function bodyJson(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 128000) throw new Error('Request too large');
  }
  return JSON.parse(text || '{}');
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (req.method === 'GET' && url.pathname === '/health') return respond(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/practice') return respond(res, 200,
      practicePage(), 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/') return respond(res, 200,
      page('Study local app', '<h1>Study local app</h1><p>Use the private session link supplied by the researcher.</p>'), 'text/html; charset=utf-8');

    if (req.method === 'GET' && url.pathname.startsWith('/form/')) {
      const kind = { pre: 'pre_task', 'after-task': 'after_task', 'after-both': 'after_both' }[url.pathname.split('/')[2]];
      const token = url.searchParams.get('token');
      const session = tokenSession(token);
      if (!forms[kind] || kind === 'checkpoint') throw new Error('Unknown form');
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

    if (req.method === 'POST' && url.pathname === '/api/form') {
      const body = await bodyJson(req);
      const session = tokenSession(body.token);
      if (!['pre_task', 'after_task', 'after_both'].includes(body.kind)) throw new Error('Invalid form kind');
      const task = body.task_id ? ownedTask(session, body.task_id) : null;
      if (body.kind === 'after_task' && (!task || !task.final_sha256)) throw new Error('Finalize this task first');
      if (body.kind !== 'after_task' && task) throw new Error('Task ID not needed for this form');
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
      if (hashTree(review.workspace_path) !== review.proposal_sha256) throw new Error('Workspace changed during review; ask researcher to reset');
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
      const allowed = new Set(['prompt_sent', 'response_visible', 'diff_opened', 'file_viewed', 'file_saved', 'test_run', 'scanner_run', 'repair_performed', 'logging_gap']);
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
