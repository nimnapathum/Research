import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { AssessmentEntry } from '@/components/AssessmentEntry';
import { naturalEvidenceFile, naturalEvidenceStatus, requiredEvidence } from '@/lib/natural-evidence';
import type { NaturalAssessment } from '@/lib/natural-analysis';
import { serverApi } from '@/lib/server-api';
import type { StudyTask, StudyUser } from '@/lib/types';

export const runtime = 'nodejs';
const labels: Record<string, string> = { capture_zip: 'Code history', capture_health: 'Capture health',
  final_zip: 'Final code', final_manifest: 'Final manifest', rating_json: 'Security rating',
  agent_transcript: 'Agent transcript' };
type Review = { error?: string; initial_snapshot_sha256?: string; final_snapshot_sha256?: string;
  timeline?: { id: string; captured_at: string | null; snapshot_sha256: string; file_count: number; changed_files: string[] }[];
  comparison_label?: string; selected_snapshot?: string | null;
  changed?: { path: string; status: string; diff: string; truncated: boolean }[];
  final_source?: { path: string; code: string; truncated: boolean }[] };
const inspectionCache = new Map<string, Review>();

function inspect(capture: string, final: string, taskId: string, cacheKey: string, snapshot?: string): Review {
  const cached = inspectionCache.get(cacheKey);
  if (cached) return cached;
  const candidates = [process.cwd(), resolve(/* turbopackIgnore: true */ process.cwd(), '..'),
    resolve(/* turbopackIgnore: true */ process.cwd(), '../../..')];
  const script = candidates.map((root) => resolve(/* turbopackIgnore: true */ root, 'study-system/analysis/inspect_natural_code.py'))
    .find((path) => existsSync(path));
  if (!script) return { error: 'Code inspector is unavailable on this deployment' };
  const result = spawnSync('python3', [script, capture, final, taskId, ...(snapshot ? [snapshot] : [])], {
    encoding: 'utf8', timeout: 20000, maxBuffer: 2 * 1024 * 1024
  });
  if (result.error) return { error: `Code inspector failed: ${result.error.message}` };
  try {
    const reviewed = JSON.parse(result.stdout) as Review;
    if (!reviewed.error) {
      inspectionCache.set(cacheKey, reviewed);
      if (inspectionCache.size > 12) inspectionCache.delete(inspectionCache.keys().next().value!);
    }
    return reviewed;
  }
  catch { return { error: 'Code inspector returned no readable report' }; }
}

export default async function TaskEvidencePage({ params, searchParams }: {
  params: Promise<{ participant: string; task: string }>; searchParams: Promise<{ snapshot?: string }> }) {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') redirect('/dashboard');
  if (process.env.STUDY_PROTOCOL !== 'natural') notFound();
  const { participant, task } = await params;
  if (!/^P\d{8}$/.test(participant) || !/^P\d{8}-T[12]$/.test(task) || !task.startsWith(`${participant}-`)) notFound();
  const requested = (await searchParams).snapshot;
  const selectedSnapshot = requested && /^S\d{4}$/.test(requested) ? requested : undefined;
  const [data, allAssessments] = await Promise.all([
    serverApi<{ participants: { id: string; participant_code: string }[];
      tasks: (StudyTask & { participant_id: string })[] }>('researcher/participants'),
    serverApi<NaturalAssessment[]>('researcher/natural-assessments')
  ]);
  const person = data.participants.find((item) => item.participant_code === participant);
  const assigned = data.tasks.find((item) => item.participant_id === person?.id && item.external_task_id === task);
  if (!assigned) notFound();
  const [status, capture, final] = await Promise.all([
    naturalEvidenceStatus(participant, task), naturalEvidenceFile(participant, task, 'capture_zip'),
    naturalEvidenceFile(participant, task, 'final_zip')
  ]);
  const review = capture && final ? inspect(capture.path, final.path,
    task, `${task}:${capture.receipt.sha256}:${final.receipt.sha256}:${selectedSnapshot || 'final'}`, selectedSnapshot) : null;
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Task evidence</p><h1>{participant} · Task {assigned.task_order}</h1>
    <p><Link href={`/researcher/analytics/${participant}`}>← Participant analysis</Link> · <Link href="/researcher/evidence">Evidence list</Link></p></div>
    <span className={`pill ${status.ready ? 'good' : 'gray'}`}>{requiredEvidence.length - status.missing.length}/{requiredEvidence.length} files</span></div>
    <div className="notice"><strong>Inspection support</strong><p>The timeline comes from ZIP manifests; opening a comparison verifies those source bytes and hashes. Run the separate full archive audit before adjudication. This page does not execute participant code or decide whether it is secure. Use independent probes and two separate, metadata-masked reviews. The visible code interface may reveal the assigned condition.</p></div>
    <section className="card" style={{ marginTop: 16 }}><h2>Received evidence</h2>
      <div className="table-wrap"><table><thead><tr><th>Item</th><th>Status</th><th>Size</th><th>Download</th></tr></thead><tbody>
        {requiredEvidence.map((kind) => { const saved = status.items[kind]; return <tr key={kind}>
          <td>{labels[kind]}</td><td>{saved ? 'Received' : 'Missing'}</td>
          <td>{saved ? `${(saved.size_bytes / 1024 / 1024).toFixed(2)} MiB` : '—'}</td>
          <td>{saved ? <a href={`/api/researcher/evidence/${participant}/${task}/${kind}`}>Download</a> : '—'}</td>
        </tr>; })}</tbody></table></div>
      {status.issues.map((issue) => <p className="alert error" key={issue}>{issue}</p>)}
      {status.warnings.map((warning) => <p className="alert" key={warning}>{warning}</p>)}
    </section>
    <section className="card" style={{ marginTop: 16 }}><h2>Code snapshot timeline</h2>
      {!review && <p>Upload both the code history ZIP and final code ZIP to view changes.</p>}
      {review?.error && <p className="alert error">{review.error}</p>}
      {review && !review.error && <><p className="small muted">{review.timeline?.length || 0} snapshots. Initial hash: <code>{review.initial_snapshot_sha256}</code><br />Final hash: <code>{review.final_snapshot_sha256}</code></p>
        <p className="small">A snapshot records source files at one point in time. Choose a snapshot to see its changes from the previous one. The default view compares the first snapshot with submitted code.</p>
        <BarChart rows={(review.timeline || []).slice(-12).map((item) => ({ label: item.id, value: item.changed_files.length }))} />
        <details className="code-review-file"><summary>Show all snapshots and changed file names</summary><div className="table-wrap"><table><thead><tr><th>Snapshot</th><th>Captured</th><th>Files changed</th><th>Changed paths</th></tr></thead><tbody>
          {review.timeline?.map((item) => <tr key={item.id}><td><Link href={`?snapshot=${item.id}#comparison`}>{item.id}</Link></td>
            <td>{item.captured_at ? new Date(item.captured_at).toLocaleString() : '—'}</td><td>{item.changed_files.length}</td>
            <td className="small">{item.changed_files.join(', ') || 'No source change'}</td></tr>)}</tbody></table></div></details>
        <div id="comparison" className="row" style={{ marginTop: 20 }}><h3>{review.comparison_label || 'Initial → final'} code comparison</h3>
          {review.selected_snapshot && <Link className="button secondary" href={`/researcher/evidence/${participant}/${task}#comparison`}>Show initial → final</Link>}</div>
        <p>{review.changed?.length || 0} changed files. Open a file to inspect its diff.</p>
        {review.changed?.map((file) => <details className="code-review-file" key={file.path}><summary>{file.path} · {file.status}</summary>
          <pre><code>{file.diff || 'Binary file changed'}</code></pre>{file.truncated && <p className="small">Diff shortened; download the final ZIP for the full file.</p>}</details>)}
        <h3>{review.selected_snapshot ? 'Selected snapshot source' : 'Final source'}</h3><p className="small muted">Review the complete target code as well as the diff; a vulnerable pattern may have existed before the task.</p>
        {review.final_source?.map((file) => <details className="code-review-file" key={file.path}><summary>{file.path}</summary>
          <pre><code>{file.code}</code></pre>{file.truncated && <p className="small">Source shortened; download the final ZIP for the full file.</p>}</details>)}
      </>}
    </section>
    {review && !review.error && review.final_snapshot_sha256 && <AssessmentEntry taskDbId={assigned.id}
      finalHash={review.final_snapshot_sha256} current={allAssessments.filter((item) =>
        item.task_id === task && item.final_snapshot_sha256 === review.final_snapshot_sha256)} />}
    <section className="card" style={{ marginTop: 16 }}><h2>Researcher evaluation steps</h2>
      <ol><li>Confirm the code history begins before the first agent prompt and the final hash matches the rating.</li>
        <li>Review each exposed SQL injection and path traversal opportunity in the transcript and snapshots.</li>
        <li>Download the final ZIP and run the functional and attack probes inside a throwaway VM or container with no network, credentials or personal files. From the repository root inside that environment, use:<pre><code>{`python3 study-system/analysis/evaluate_natural_final.py FINAL_ZIP ${assigned.project_id} ${task} --isolated`}</code></pre>Record the JSON report with this task ID and final hash. The probe executes submitted code; a temporary folder alone does not isolate it.</li>
        <li>Have independent reviewers judge target security without condition labels, participant confidence, or interviews. Record whether a reviewer inferred the condition from the visible source.</li></ol>
    </section>
  </Shell>;
}
