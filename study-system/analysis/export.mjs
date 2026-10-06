import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from '../app/lib.mjs';
import { readCsv, writeCsv } from './csv.mjs';

const reviewOutput = resolve(process.argv[2] || 'blinded-review-output');
const output = resolve(process.argv[3] || 'analysis-output');
if (existsSync(output)) throw new Error('Choose a new output directory; analysis exports are immutable');
mkdirSync(output, { recursive: true, mode: 0o700 });
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const store = openStore();

const mapping = JSON.parse(readFileSync(join(reviewOutput, 'RESEARCHER_MAP.json'), 'utf8'));
const resolved = new Map(readCsv(join(reviewOutput, 'RESOLVED_REVIEW.csv')).map((row) => [row.blind_id, row]));
const labels = new Map(mapping.map((item) => [`${item.review_id}:${item.snapshot_kind}`, resolved.get(item.blind_id) || {}]));
const modeRows = readCsv(join(reviewOutput, 'MODE_EPISODES.csv'));
const checkRows = readCsv(join(reviewOutput, 'VERIFICATION_EVENTS.csv'));
const pathRows = readCsv(join(reviewOutput, 'DECISION_PATHS.csv'));
const decisionPaths = new Map();
const allowedPaths = new Set(['kept_unchanged', 'edited', 'replaced', 'rejected_then_implemented', 'rejected_no_implementation', 'unclear']);
for (const row of pathRows) {
  if (!row.post_decision_path) continue;
  if (!allowedPaths.has(row.post_decision_path) || !['yes', 'no', 'unclear'].includes(row.target_detected) ||
      !['yes', 'no', 'unclear'].includes(row.security_repair)) throw new Error(`Invalid decision path code for ${row.review_id}`);
  if (decisionPaths.has(row.review_id)) throw new Error(`Duplicate decision path code for ${row.review_id}`);
  decisionPaths.set(row.review_id, row);
}
const modes = new Map();
for (const row of modeRows) {
  if (!row.mode) continue;
  if (!['acceleration', 'exploration', 'mixed', 'unclear'].includes(row.mode)) throw new Error(`Invalid mode: ${row.mode}`);
  const values = modes.get(row.review_id) || new Set();
  values.add(row.mode);
  modes.set(row.review_id, values);
}
function modeFor(reviewId) {
  const values = modes.get(reviewId);
  if (!values) return 'uncoded';
  return values.size === 1 ? [...values][0] : 'mixed';
}
const checks = new Map();
for (const row of checkRows) {
  if (!row.code) continue;
  if (!['none', 'S1', 'S2', 'S3', 'S4', 'S5', 'G1', 'G2'].includes(row.code)) throw new Error(`Invalid verification code: ${row.code}`);
  if (row.code !== 'none' && !['before_decision', 'after_keep', 'after_reject'].includes(row.phase)) throw new Error(`Invalid phase: ${row.phase}`);
  const list = checks.get(row.review_id) || [];
  list.push(row);
  checks.set(row.review_id, list);
}
const skipRows = store.db.prepare(`SELECT s.*, t.participant_id, t.project_id, t.condition, t.task_order,
  r.review_id, r.exposed_at, r.decision_at
  FROM skips s JOIN tasks t ON s.task_id = t.task_id
  LEFT JOIN reviews r ON r.task_id = s.task_id AND r.checkpoint_id = s.checkpoint_id
  ORDER BY t.participant_id, t.task_order, s.created_at`).all();
const skipsByCheckpoint = new Map(skipRows.map((row) => [`${row.task_id}:${row.checkpoint_id}`, row]));
writeCsv(join(output, 'skipped_checkpoints.csv'), [
  'participant_id', 'task_id', 'task_order', 'project_id', 'condition', 'checkpoint_id',
  'reason_code', 'notes', 'workspace_sha256', 'created_at', 'review_id', 'exposed_at', 'decision_at'
], skipRows);

const records = store.db.prepare(`SELECT r.*, t.project_id, t.condition, t.task_order, t.participant_id,
  t.final_sha256 FROM reviews r JOIN tasks t ON r.task_id = t.task_id ORDER BY t.participant_id, t.task_order, r.created_at`).all();
const opportunities = records.map((review) => {
  const projectName = review.project_id === 'A' ? 'resource-catalogue' : 'support-archive';
  const manifestPath = resolve(root, 'stimuli', projectName, `${review.project_id}-${review.checkpoint_id}`, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const candidate = manifest.candidates.find((item) => item.candidate_id === review.candidate_id);
  const proposal = labels.get(`${review.review_id}:proposal`) || {};
  const final = labels.get(`${review.review_id}:final`) || {};
  const reviewChecks = checks.get(review.review_id) || [];
  const securityChecks = reviewChecks.filter((item) => /^S[1-5]$/.test(item.code));
  const pathCode = decisionPaths.get(review.review_id);
  const skip = skipsByCheckpoint.get(`${review.task_id}:${review.checkpoint_id}`);
  const p = review.confidence === null ? null : review.confidence / 100;
  const y = proposal.target_status === 'secure' ? 1 : proposal.target_status === 'vulnerable' ? 0 : null;
  const exposedVulnerable = Boolean(review.exposed_at && y === 0);
  const finalAssessable = ['secure', 'vulnerable'].includes(final.target_status);
  const finalSuccessCoded = ['secure', 'vulnerable', 'missing'].includes(final.target_status) &&
    ['pass', 'partial', 'fail', 'missing'].includes(final.functionality);
  return {
    participant_id: review.participant_id, task_id: review.task_id, task_order: review.task_order,
    project_id: review.project_id, condition: review.condition, checkpoint_id: review.checkpoint_id,
    class: review.checkpoint_id.startsWith('Q') ? 'SQL injection' : 'path traversal',
    review_id: review.review_id, candidate_id: review.candidate_id,
    expected_candidate_status: candidate?.expected_target_status || 'unknown',
    proposal_sha256: review.proposal_sha256, eligible_exposure: Boolean(review.exposed_at),
    skip_reason: skip?.reason_code || '',
    provisional_decision: review.decision || '', security_probability_pct: review.confidence,
    proposal_security: proposal.target_status || 'unadjudicated',
    proposal_functionality: proposal.functionality || 'unadjudicated',
    final_security: final.target_status || (review.final_sha256 ? 'unadjudicated' : 'no_final_snapshot'),
    final_functionality: final.functionality || (review.final_sha256 ? 'unadjudicated' : 'no_final_snapshot'),
    brier: p === null || y === null ? null : (p - y) ** 2,
    observed_mode: modeFor(review.review_id), verification_coded: reviewChecks.length > 0,
    checks_before: reviewChecks.length ? securityChecks.filter((item) => item.phase === 'before_decision').length : null,
    checks_after_keep: reviewChecks.length ? securityChecks.filter((item) => item.phase === 'after_keep').length : null,
    checks_after_reject: reviewChecks.length ? securityChecks.filter((item) => item.phase === 'after_reject').length : null,
    post_decision_path: pathCode?.post_decision_path || 'uncoded',
    target_detected: pathCode?.target_detected || 'uncoded',
    security_repair: pathCode?.security_repair || 'uncoded',
    exposed_vulnerable: exposedVulnerable,
    final_target_retained: exposedVulnerable && finalAssessable ? final.target_status === 'vulnerable' : null,
    functional_target_secure_success: exposedVulnerable && review.final_sha256 && finalSuccessCoded
      ? final.target_status === 'secure' && final.functionality === 'pass' : null
  };
});

const opportunityHeader = [
  'participant_id', 'task_id', 'task_order', 'project_id', 'condition', 'checkpoint_id', 'class',
  'review_id', 'candidate_id', 'expected_candidate_status', 'proposal_sha256', 'eligible_exposure',
  'skip_reason',
  'provisional_decision', 'security_probability_pct', 'proposal_security', 'proposal_functionality',
  'final_security', 'final_functionality', 'brier', 'observed_mode', 'verification_coded',
  'checks_before', 'checks_after_keep', 'checks_after_reject', 'post_decision_path',
  'target_detected', 'security_repair', 'exposed_vulnerable',
  'final_target_retained', 'functional_target_secure_success'
];
writeCsv(join(output, 'opportunities.csv'), opportunityHeader, opportunities);

const tasks = store.db.prepare('SELECT * FROM tasks ORDER BY participant_id, task_order').all();
const taskSummary = tasks.map((task) => {
  const rows = opportunities.filter((item) => item.task_id === task.task_id);
  const scored = rows.filter((item) => item.eligible_exposure && item.brier !== null);
  const vulnerable = rows.filter((item) => item.exposed_vulnerable);
  const successKnown = vulnerable.filter((item) => item.functional_target_secure_success !== null);
  return {
    participant_id: task.participant_id, task_id: task.task_id, project_id: task.project_id,
    condition: task.condition, task_order: task.task_order,
    skipped_count: skipRows.filter((item) => item.task_id === task.task_id).length,
    exposed_count: rows.filter((item) => item.eligible_exposure).length,
    scored_count: scored.length,
    complete_rq1: scored.length === 4,
    mean_brier: scored.length ? scored.reduce((sum, item) => sum + item.brier, 0) / scored.length : null,
    exposed_vulnerable_count: vulnerable.length,
    security_success_count: successKnown.filter((item) => item.functional_target_secure_success).length,
    security_success_rate: vulnerable.length === 2 && successKnown.length === 2
      ? successKnown.filter((item) => item.functional_target_secure_success).length / 2 : null,
    final_snapshot_available: Boolean(task.final_sha256)
  };
});
writeCsv(join(output, 'task_summary.csv'), Object.keys(taskSummary[0] || {
  participant_id: '', task_id: '', project_id: '', condition: '', task_order: '', exposed_count: '',
  skipped_count: '',
  scored_count: '', complete_rq1: '', mean_brier: '', exposed_vulnerable_count: '',
  security_success_count: '', security_success_rate: '', final_snapshot_available: ''
}), taskSummary);

const formRows = store.db.prepare('SELECT * FROM forms ORDER BY created_at').all().map((row) => ({
  form_id: row.form_id, participant_id: row.participant_id, task_id: row.task_id,
  kind: row.kind, version: row.version, created_at: row.created_at, answers_json: row.answers_json
}));
writeCsv(join(output, 'forms.csv'), ['form_id', 'participant_id', 'task_id', 'kind', 'version', 'created_at', 'answers_json'], formRows);

function mean(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; }
function summarizeDiffs(diffs) {
  if (!diffs.length) return { n_pairs: 0, mean_difference_acceleration_minus_exploration: null, bootstrap_95_ci: null };
  const observed = mean(diffs);
  if (diffs.length < 3) return { n_pairs: diffs.length, mean_difference_acceleration_minus_exploration: observed, bootstrap_95_ci: null };
  let state = 246813579;
  const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  const draws = [];
  for (let i = 0; i < 2000; i++) {
    const sample = Array.from({ length: diffs.length }, () => diffs[Math.floor(random() * diffs.length)]);
    draws.push(mean(sample));
  }
  draws.sort((a, b) => a - b);
  return { n_pairs: diffs.length, mean_difference_acceleration_minus_exploration: observed,
    bootstrap_95_ci: [draws[49], draws[1949]] };
}
function paired(metric, gate, sourceRows = taskSummary) {
  const byPerson = new Map();
  for (const row of sourceRows.filter(gate)) {
    const value = byPerson.get(row.participant_id) || {};
    value[row.condition] = row[metric];
    byPerson.set(row.participant_id, value);
  }
  const diffs = [...byPerson.values()].filter((item) => item.acceleration !== undefined && item.exploration !== undefined)
    .map((item) => item.acceleration - item.exploration);
  return summarizeDiffs(diffs);
}

const classRows = [];
for (const task of tasks) {
  for (const weaknessClass of ['SQL injection', 'path traversal']) {
    const rows = opportunities.filter((item) => item.task_id === task.task_id && item.class === weaknessClass && item.eligible_exposure);
    const scored = rows.filter((item) => item.brier !== null);
    const vulnerable = rows.filter((item) => item.exposed_vulnerable);
    classRows.push({ participant_id: task.participant_id, condition: task.condition, class: weaknessClass,
      mean_brier: scored.length === 2 ? mean(scored.map((item) => item.brier)) : null,
      security_success: vulnerable.length === 1 ? vulnerable[0].functional_target_secure_success : null });
  }
}
function classInteraction(metric) {
  const byPerson = new Map();
  for (const row of classRows) {
    if (row[metric] === null) continue;
    const item = byPerson.get(row.participant_id) || {};
    item[`${row.class}:${row.condition}`] = Number(row[metric]);
    byPerson.set(row.participant_id, item);
  }
  const diffs = [];
  for (const item of byPerson.values()) {
    const keys = ['SQL injection:acceleration', 'SQL injection:exploration', 'path traversal:acceleration', 'path traversal:exploration'];
    if (keys.every((key) => item[key] !== undefined)) {
      diffs.push((item[keys[0]] - item[keys[1]]) - (item[keys[2]] - item[keys[3]]));
    }
  }
  const result = summarizeDiffs(diffs);
  return { n_complete_participants: result.n_pairs, mean_sql_condition_difference_minus_path_condition_difference:
    result.mean_difference_acceleration_minus_exploration, bootstrap_95_ci: result.bootstrap_95_ci };
}

const summary = {
  generated_at_utc: new Date().toISOString(),
  status: 'No inference unless adjudications and behavioural coding are complete',
  participants: new Set(tasks.map((item) => item.participant_id)).size,
  tasks: tasks.length, assigned_checkpoints: tasks.length * 4,
  skipped_checkpoints: skipRows.length,
  skipped_before_exposure: skipRows.filter((item) => !item.exposed_at).length,
  skipped_after_exposure: skipRows.filter((item) => item.exposed_at).length,
  skips_by_reason: Object.fromEntries([...new Set(skipRows.map((item) => item.reason_code))]
    .map((reason) => [reason, skipRows.filter((item) => item.reason_code === reason).length])),
  exposed_opportunities: opportunities.filter((item) => item.eligible_exposure).length,
  missing_proposal_adjudication: opportunities.filter((item) => item.eligible_exposure && item.proposal_security === 'unadjudicated').length,
  missing_final_adjudication: opportunities.filter((item) => item.eligible_exposure && item.final_security === 'unadjudicated').length,
  missing_final_snapshot: opportunities.filter((item) => item.eligible_exposure && item.final_security === 'no_final_snapshot').length,
  uncoded_mode: opportunities.filter((item) => item.eligible_exposure && item.observed_mode === 'uncoded').length,
  uncoded_verification: opportunities.filter((item) => item.eligible_exposure && !item.verification_coded).length,
  uncoded_decision_path: opportunities.filter((item) => item.eligible_exposure && item.post_decision_path === 'uncoded').length,
  rq1_paired_brier_complete_tasks: paired('mean_brier', (row) => row.complete_rq1 && row.mean_brier !== null),
  rq2_paired_all_exposed_success: paired('security_success_rate', (row) => row.security_success_rate !== null),
  rq1_by_condition: [],
  rq2_flow_by_condition: [],
  by_condition_and_class: [],
  by_observed_mode: [],
  vulnerable_verification_association: [],
  rq4_by_class: [],
  rq4_difference_of_class_effects: {
    brier: classInteraction('mean_brier'),
    functional_security_success: classInteraction('security_success')
  }
};
for (const condition of ['acceleration', 'exploration']) {
  const rows = opportunities.filter((item) => item.condition === condition && item.eligible_exposure);
  const secure = rows.filter((item) => item.proposal_security === 'secure' && item.security_probability_pct !== null);
  const vulnerable = rows.filter((item) => item.proposal_security === 'vulnerable' && item.security_probability_pct !== null);
  const judged = rows.filter((item) => item.brier !== null);
  const meanSecure = mean(secure.map((item) => item.security_probability_pct));
  const meanVulnerable = mean(vulnerable.map((item) => item.security_probability_pct));
  summary.rq1_by_condition.push({ condition, scored_proposals: judged.length,
    mean_brier: mean(judged.map((item) => item.brier)),
    secure_proposals: secure.length, vulnerable_proposals: vulnerable.length,
    mean_confidence_secure_pct: meanSecure, mean_confidence_vulnerable_pct: meanVulnerable,
    confidence_separation_pct: meanSecure === null || meanVulnerable === null ? null : meanSecure - meanVulnerable,
    mean_signed_probability_gap: mean(judged.map((item) => item.security_probability_pct / 100 - (item.proposal_security === 'secure' ? 1 : 0))) });
  const vulnerableExposed = rows.filter((item) => item.exposed_vulnerable);
  const finalCount = (status) => vulnerableExposed.filter((item) => item.final_security === status).length;
  summary.rq2_flow_by_condition.push({ condition, exposed_vulnerable: vulnerableExposed.length,
    provisional_keep: vulnerableExposed.filter((item) => item.provisional_decision === 'keep').length,
    provisional_reject: vulnerableExposed.filter((item) => item.provisional_decision === 'reject').length,
    coded_security_repair: vulnerableExposed.filter((item) => item.security_repair === 'yes').length,
    uncoded_decision_path: vulnerableExposed.filter((item) => item.post_decision_path === 'uncoded').length,
    final_vulnerable: finalCount('vulnerable'), final_secure: finalCount('secure'),
    final_feature_missing: finalCount('missing'), no_final_snapshot: finalCount('no_final_snapshot'),
    final_indeterminate_or_unadjudicated: vulnerableExposed.length - finalCount('vulnerable') - finalCount('secure') -
      finalCount('missing') - finalCount('no_final_snapshot'),
    functional_target_secure_success: vulnerableExposed.filter((item) => item.functional_target_secure_success === true).length });
}
for (const condition of ['acceleration', 'exploration']) {
  for (const weaknessClass of ['SQL injection', 'path traversal']) {
    const rows = opportunities.filter((item) => item.condition === condition && item.class === weaknessClass && item.eligible_exposure);
    const secure = rows.filter((item) => item.proposal_security === 'secure');
    const vulnerable = rows.filter((item) => item.proposal_security === 'vulnerable');
    const retained = vulnerable.filter((item) => item.final_target_retained !== null);
    summary.by_condition_and_class.push({ condition, class: weaknessClass, exposed: rows.length,
      secure_judgments: secure.length, vulnerable_judgments: vulnerable.length,
      mean_confidence_secure: mean(secure.map((item) => item.security_probability_pct).filter((value) => value !== null)),
      mean_confidence_vulnerable: mean(vulnerable.map((item) => item.security_probability_pct).filter((value) => value !== null)),
      assessable_vulnerable_final: retained.length,
      target_retained: retained.filter((item) => item.final_target_retained).length,
      target_retention_rate: retained.length
        ? retained.filter((item) => item.final_target_retained).length / retained.length : null,
      verification_coded: rows.filter((item) => item.verification_coded).length,
      any_before_security_check: rows.filter((item) => item.checks_before > 0).length,
      mean_before_security_checks_if_coded: mean(rows.filter((item) => item.verification_coded).map((item) => item.checks_before)),
      mean_after_keep_security_checks_if_coded: mean(rows.filter((item) => item.verification_coded && item.provisional_decision === 'keep').map((item) => item.checks_after_keep)),
      mean_after_reject_security_checks_if_coded: mean(rows.filter((item) => item.verification_coded && item.provisional_decision === 'reject').map((item) => item.checks_after_reject)) });
  }
}
for (const weaknessClass of ['SQL injection', 'path traversal']) {
  const rows = classRows.filter((item) => item.class === weaknessClass);
  summary.rq4_by_class.push({ class: weaknessClass,
    paired_brier: paired('mean_brier', (item) => item.mean_brier !== null, rows),
    paired_functional_security_success: paired('security_success', (item) => item.security_success !== null, rows) });
}
for (const mode of ['acceleration', 'exploration', 'mixed', 'unclear']) {
  const rows = opportunities.filter((item) => item.eligible_exposure && item.observed_mode === mode && item.brier !== null);
  summary.by_observed_mode.push({ mode, scored_opportunities: rows.length,
    mean_brier: mean(rows.map((item) => item.brier)),
    secure_proposals: rows.filter((item) => item.proposal_security === 'secure').length,
    vulnerable_proposals: rows.filter((item) => item.proposal_security === 'vulnerable').length });
}
for (const phase of ['before_decision', 'after_keep', 'after_reject']) {
  const eligible = opportunities.filter((item) => item.exposed_vulnerable && item.verification_coded &&
    item.functional_target_secure_success !== null && (phase === 'before_decision' || item.provisional_decision === (phase === 'after_keep' ? 'keep' : 'reject')));
  const field = phase === 'before_decision' ? 'checks_before' : phase === 'after_keep' ? 'checks_after_keep' : 'checks_after_reject';
  for (const checked of [true, false]) {
    const rows = eligible.filter((item) => (item[field] > 0) === checked);
    const assessable = rows.filter((item) => item.final_target_retained !== null);
    summary.vulnerable_verification_association.push({ phase, checked, coded_final_opportunities: rows.length,
      functional_security_success: rows.filter((item) => item.functional_target_secure_success).length,
      functional_security_success_rate: rows.length
        ? rows.filter((item) => item.functional_target_secure_success).length / rows.length : null,
      assessable_final_features: assessable.length,
      target_retained: assessable.filter((item) => item.final_target_retained).length,
      retention_rate_among_assessable: assessable.length
        ? assessable.filter((item) => item.final_target_retained).length / assessable.length : null });
  }
}
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
store.db.close();
console.log(`Exported ${opportunities.length} opportunities to ${output}`);
