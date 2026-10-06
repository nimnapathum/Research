import { serverApi } from '@/lib/server-api';
import type { ParticipantDashboard, StudyUser } from '@/lib/types';
import { Shell } from '@/components/Shell';
import { EventUpload } from '@/components/EventUpload';

export default async function ParticipantUploadPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const dashboard = await serverApi<ParticipantDashboard>('participant/dashboard');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Participant evidence</p><h1>Upload IDE events</h1>
    <p>Import a JSON or JSONL event export from your coding session. The researcher can also import files for you.</p></div></div>
    <EventUpload tasks={dashboard.tasks} />
    <h2 className="section-title">Your imports</h2><section className="card"><div className="table-wrap"><table className="table">
      <thead><tr><th>File</th><th>Kind</th><th>Events</th><th>Imported</th></tr></thead><tbody>
      {dashboard.uploads.map((item) => <tr key={item.id}><td>{item.original_filename}</td><td>{item.kind}</td>
        <td>{item.imported_count}</td><td>{new Date(item.created_at).toLocaleString()}</td></tr>)}
      </tbody></table></div>{!dashboard.uploads.length && <p className="muted">No imports yet.</p>}</section>
  </Shell>;
}
