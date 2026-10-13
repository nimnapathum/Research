import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { naturalEvidenceStatus, requiredEvidence } from '@/lib/natural-evidence';
import { serverApi } from '@/lib/server-api';
import type { StudyTask, StudyUser } from '@/lib/types';

type Participant = { id: string; participant_code: string };
type AssignedTask = StudyTask & { participant_id: string };
const labels: Record<string, string> = {
  capture_zip: 'Code history', capture_health: 'Capture health', final_zip: 'Final code',
  final_manifest: 'Final manifest', rating_json: 'Security rating',
  agent_transcript: 'Agent transcript', screen_recording: 'Screen recording'
};

export default async function ResearcherEvidencePage() {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') redirect('/dashboard');
  if (process.env.STUDY_PROTOCOL !== 'natural') redirect('/researcher/imports');
  const data = await serverApi<{ participants: Participant[]; tasks: AssignedTask[] }>('researcher/participants');
  const codes = new Map(data.participants.map((person) => [person.id, person.participant_code]));
  const rows = await Promise.all(data.tasks.map(async (task) => {
    const code = codes.get(task.participant_id);
    const naturalIdentity = Boolean(code && /^P\d{8}$/.test(code) &&
      /^P\d{8}-T[12]$/.test(task.external_task_id) && task.external_task_id.startsWith(`${code}-`));
    return { task, code, status: naturalIdentity ? await naturalEvidenceStatus(code!, task.external_task_id) : null };
  }));
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Natural-task evidence</p><h1>Received files</h1>
    <p>Check each task&apos;s receipts and download the original files for the approved quality review and analysis.</p></div></div>
    <div className="notice"><strong>A receipt is a transfer check.</strong><p>Replay recordings, inspect transcript coverage and code history, and run the independent security assessment before using these files as study evidence. Keep local copies in approved restricted storage.</p></div>
    {rows.length ? <div className="stack" style={{ marginTop: 16 }}>{rows.map(({ task, code, status }) => <section className="card" key={task.id}>
      <div className="row"><div><h2>{code || 'Unknown participant'} · Task {task.task_order}</h2>
        <p className="small muted">{task.external_task_id} · {task.project_id === 'A' ? 'Resource catalogue' : 'Support archive'} · {task.condition}</p></div>
        <span className={`pill ${status?.ready ? 'good' : 'gray'}`}>{status ? `${requiredEvidence.length - status.missing.length}/${requiredEvidence.length} received` : 'Earlier assignment'}</span></div>
      {status && <><div className="table-wrap"><table><thead><tr><th>Evidence</th><th>Status</th><th>Size</th><th>SHA-256</th><th>File</th></tr></thead>
        <tbody>{requiredEvidence.map((kind) => {
          const saved = status.items[kind];
          return <tr key={kind}><td>{labels[kind]}</td><td>{saved ? 'Received' : 'Missing'}</td>
            <td>{saved ? `${(saved.size_bytes / 1024 / 1024).toFixed(2)} MiB` : '—'}</td>
            <td>{saved ? <code>{saved.sha256}</code> : '—'}</td>
            <td>{saved && code ? <a href={`/api/researcher/evidence/${code}/${task.external_task_id}/${kind}`}>Download</a> : '—'}</td></tr>;
        })}</tbody></table></div>
        {status.issues.map((issue) => <p className="small error" key={issue}>{issue}</p>)}
        {status.warnings.map((warning) => <p className="small" key={warning}>{warning}</p>)}</>}
    </section>)}</div> : <div className="empty">No assigned tasks yet. <Link href="/researcher/participants">Create a participant</Link> when the study is ready.</div>}
  </Shell>;
}
