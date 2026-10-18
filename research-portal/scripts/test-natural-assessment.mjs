import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { ResearcherController } = require('../apps/api/dist/researcher.js');
const root = mkdtempSync(join(tmpdir(), 'natural-review-api-'));
const code = 'P12345678';
const task = `${code}-T1`;
const finalHash = `sha256:${'a'.repeat(64)}`;
const folder = join(root, code, task);
mkdirSync(folder, { recursive: true });
const manifest = Buffer.from(JSON.stringify({ workspace: task, snapshot_sha256: finalHash }));
writeFileSync(join(folder, 'final_manifest.data'), manifest);
writeFileSync(join(folder, 'final_manifest.receipt.json'), JSON.stringify({ task_id: task, kind: 'final_manifest',
  size_bytes: manifest.length, sha256: createHash('sha256').update(manifest).digest('hex') }));
const previousProtocol = process.env.STUDY_PROTOCOL;
const previousRoot = process.env.STUDY_EVIDENCE_ROOT;
process.env.STUDY_PROTOCOL = 'natural';
process.env.STUDY_EVIDENCE_ROOT = root;
let inserts = 0;
let taskStatus = 'submitted';
const db = {
  query: async () => ({ rows: [{ external_task_id: task, participant_code: code, status: taskStatus }] }),
  transaction: async (action) => action({ query: async (sql) => {
    if (sql.includes('INSERT INTO natural_assessments')) { inserts++; return { rows: [{ id: 'assessment-1' }] }; }
    return { rows: [] };
  } })
};
const controller = new ResearcherController(db, {});
const request = { studyUser: { id: 'researcher-1', role: 'researcher' } };
const good = { taskId: '12345678-1234-1234-1234-123456789abc', weaknessClass: 'sql', finalHash,
  reviews: [{ reviewerCode: 'R1', security: 'target_secure', functionality: 'pass', inferredCondition: false },
    { reviewerCode: 'R2', security: 'target_secure', functionality: 'pass', inferredCondition: false }],
  resolvedSecurity: 'target_secure', resolvedFunctionality: 'pass', resolutionNote: 'Probe and source review agree' };
try {
  taskStatus = 'in_progress';
  let prematureRejected = false;
  try { await controller.recordNaturalAssessment(request, good); }
  catch { prematureRejected = true; }
  if (!prematureRejected || inserts !== 0) throw new Error('Pre-submission assessment was accepted');
  taskStatus = 'submitted';
  const saved = await controller.recordNaturalAssessment(request, good);
  if (saved.id !== 'assessment-1' || inserts !== 1) throw new Error('Valid assessment was not saved');
  for (const changed of [
    { reviews: [good.reviews[0], { ...good.reviews[1], reviewerCode: 'R1' }] },
    { finalHash: `sha256:${'b'.repeat(64)}` },
    { resolvedFunctionality: 'not_implemented' },
    { reviews: [good.reviews[0], { ...good.reviews[1], security: 'vulnerable' }], resolutionNote: '' }
  ]) {
    let rejected = false;
    try { await controller.recordNaturalAssessment(request, { ...good, ...changed }); }
    catch { rejected = true; }
    if (!rejected) throw new Error('Invalid assessment was accepted');
  }
  if (inserts !== 1) throw new Error('Rejected assessment reached storage');
  console.log('PASS: natural assessment requires submitted task, two reviewer identities, evidence note and matching manifest hash');
} finally {
  if (previousProtocol === undefined) delete process.env.STUDY_PROTOCOL;
  else process.env.STUDY_PROTOCOL = previousProtocol;
  if (previousRoot === undefined) delete process.env.STUDY_EVIDENCE_ROOT;
  else process.env.STUDY_EVIDENCE_ROOT = previousRoot;
  rmSync(root, { recursive: true, force: true });
}
