import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readCsv, writeCsv } from './csv.mjs';

const output = resolve(process.argv[2] || 'blinded-review-output');
const bundle = join(output, 'give-to-reviewers');
const map = JSON.parse(readFileSync(join(output, 'RESEARCHER_MAP.json'), 'utf8'));
const allowedStatus = new Set(['secure', 'vulnerable', 'indeterminate', 'missing']);
const allowedFunction = new Set(['pass', 'partial', 'fail', 'missing']);
function ratings(name) {
  const path = join(bundle, `${name}-ratings.csv`);
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return new Map(readCsv(path).map((row) => [row.blind_id, row]));
}
const first = ratings('reviewer-1');
const second = ratings('reviewer-2');
const rows = [];
let paired = 0, statusAgreement = 0, functionAgreement = 0;
for (const item of map) {
  const a = first.get(item.blind_id) || {};
  const b = second.get(item.blind_id) || {};
  if (a.target_status && !allowedStatus.has(a.target_status)) throw new Error(`Invalid reviewer-1 status for ${item.blind_id}`);
  if (b.target_status && !allowedStatus.has(b.target_status)) throw new Error(`Invalid reviewer-2 status for ${item.blind_id}`);
  if (a.functionality && !allowedFunction.has(a.functionality)) throw new Error(`Invalid reviewer-1 functionality for ${item.blind_id}`);
  if (b.functionality && !allowedFunction.has(b.functionality)) throw new Error(`Invalid reviewer-2 functionality for ${item.blind_id}`);
  if (a.target_status && b.target_status) {
    paired++;
    if (a.target_status === b.target_status) statusAgreement++;
    if (a.functionality && a.functionality === b.functionality) functionAgreement++;
  }
  rows.push({ blind_id: item.blind_id, target_status: a.target_status && a.target_status === b.target_status ? a.target_status : '',
    functionality: a.functionality && a.functionality === b.functionality ? a.functionality : '',
    reviewer_1_status: a.target_status || '', reviewer_2_status: b.target_status || '',
    reviewer_1_functionality: a.functionality || '', reviewer_2_functionality: b.functionality || '',
    resolution_note: a.target_status && b.target_status && a.target_status !== b.target_status ? 'REQUIRES ADJUDICATION' : '' });
}
writeCsv(join(output, 'RESOLVED_REVIEW.csv'), [
  'blind_id', 'target_status', 'functionality', 'reviewer_1_status', 'reviewer_2_status',
  'reviewer_1_functionality', 'reviewer_2_functionality', 'resolution_note'
], rows);
console.log(JSON.stringify({ items: map.length, paired, status_agreement: statusAgreement,
  functionality_agreement: functionAgreement, unresolved: rows.filter((row) => !row.target_status || !row.functionality).length }, null, 2));
