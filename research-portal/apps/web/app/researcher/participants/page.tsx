import { Shell } from '@/components/Shell';
import { CreateParticipant } from '@/components/CreateParticipant';
import { serverApi } from '@/lib/server-api';
import type { StudyUser, StudyTask } from '@/lib/types';

type Row = { id: string; email: string; participant_code: string; task_count: number; submitted_tasks: number; created_at: string };
export default async function ParticipantsPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const data = await serverApi<{ participants: Row[]; tasks: (StudyTask & { participant_id: string })[] }>('researcher/participants');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Recruitment and assignment</p><h1>Participants</h1>
    <p>Each participant has two counterbalanced tasks linked by participant code to the checkpoint app.</p></div></div>
    <CreateParticipant /><section className="card" style={{ marginTop: 16 }}><h2>Accounts and assignments</h2>
      {data.participants.length ? <div className="table-wrap"><table><thead><tr><th>Code</th><th>Email</th><th>Tasks</th><th>Progress</th></tr></thead>
        <tbody>{data.participants.map((row) => <tr key={row.id}><td>{row.participant_code}</td><td>{row.email}</td>
          <td>{data.tasks.filter((task) => task.participant_id === row.id).map((task) => `T${task.task_order}: ${task.project_id} / ${task.condition}`).join(' · ')}</td>
          <td>{row.submitted_tasks}/{row.task_count} submitted</td></tr>)}</tbody></table></div> : <div className="empty">No participants yet.</div>}
    </section></Shell>;
}
