import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';

type ResponseRow = { id: string; participant_code: string; title: string; stage: string; version: number;
  external_task_id: string | null; answers: Record<string, unknown>; submitted_at: string };
export default async function ResponsesPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const rows = await serverApi<ResponseRow[]>('researcher/responses');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Study instruments</p><h1>Responses</h1>
    <p>Review submitted questionnaires and interview notes by participant and task.</p></div>
    <Link className="button secondary" href="/api/backend/researcher/export">Export JSON</Link></div>
    <section className="card">{rows.length ? <div className="table-wrap"><table><thead><tr>
      <th>Participant</th><th>Form</th><th>Task</th><th>Submitted</th><th>Answers</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.id}><td>{row.participant_code}</td><td>{row.title}<div className="small muted">{row.stage} · v{row.version}</div></td>
        <td>{row.external_task_id || '—'}</td><td>{new Date(row.submitted_at).toLocaleString()}</td>
        <td><details><summary>View</summary><pre className="json-box">{JSON.stringify(row.answers, null, 2)}</pre></details></td></tr>)}
    </tbody></table></div> : <div className="empty">No responses submitted.</div>}</section></Shell>;
}
