import { Shell } from '@/components/Shell';
import { ResearcherImport } from '@/components/ResearcherImport';
import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';

type ImportRow = { id: string; kind: string; original_filename: string; imported_count: number;
  participant_code: string | null; external_task_id: string | null; created_at: string };
export default async function ImportsPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const [imports, data] = await Promise.all([
    serverApi<ImportRow[]>('researcher/imports'),
    serverApi<{ participants: { id: string; participant_code: string }[] }>('researcher/participants')
  ]);
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Evidence intake</p><h1>Imports</h1>
    <p>Bring IDE exports and adjudicated study results into the portal.</p></div></div>
    <ResearcherImport participants={data.participants} />
    <section className="card" style={{ marginTop: 16 }}><h2>Import history</h2>{imports.length ? <div className="table-wrap"><table>
      <thead><tr><th>Date</th><th>File</th><th>Type</th><th>Participant</th><th>Records</th></tr></thead>
      <tbody>{imports.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString()}</td>
        <td>{row.original_filename}</td><td>{row.kind}</td><td>{row.participant_code || 'Study-wide'}</td><td>{row.imported_count}</td></tr>)}</tbody>
    </table></div> : <div className="empty">No imports yet.</div>}</section></Shell>;
}
