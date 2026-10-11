import { Shell } from '@/components/Shell';
import { CreateParticipant } from '@/components/CreateParticipant';
import { serverApi } from '@/lib/server-api';
import type { StudyUser, StudyTask } from '@/lib/types';

type Row = { id: string; username: string; participant_code: string; task_count: number; submitted_tasks: number; created_at: string };
export default async function ParticipantsPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const data = await serverApi<{ participants: Row[]; tasks: (StudyTask & { participant_id: string })[] }>('researcher/participants');
  const firstTasks = data.tasks.filter((task) => task.task_order === 1);
  const cells = [
    { project: 'A', condition: 'acceleration', label: 'A → Acceleration' },
    { project: 'A', condition: 'exploration', label: 'A → Exploration' },
    { project: 'B', condition: 'acceleration', label: 'B → Acceleration' },
    { project: 'B', condition: 'exploration', label: 'B → Exploration' }
  ];
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Recruitment and assignment</p><h1>Participants</h1>
    <p>Create a participant once. The portal generates their ID, login, and balanced two-task sequence.</p></div></div>
    <div className="workflow-strip" aria-label="Participant workflow"><div><strong>1</strong><span>Create participant</span></div>
      <div><strong>2</strong><span>Share one-time credentials</span></div><div><strong>3</strong><span>Participant completes both tasks</span></div></div>
    <CreateParticipant />
    <section className="card" style={{ marginTop: 16 }}><div className="row"><div><h2>Allocation overview</h2>
      <p className="small muted">First-task project and condition. Each participant receives the other project and condition in Task 2.</p></div>
      <span className="pill gray">{data.participants.length} participants</span></div>
      <div className="allocation-grid">{cells.map((cell) => <div key={cell.label}><strong>{firstTasks.filter((task) =>
        task.project_id === cell.project && task.condition === cell.condition).length}</strong><span>{cell.label}</span></div>)}</div>
    </section>
    <section className="card" style={{ marginTop: 16 }}><h2>Accounts and assignments</h2>
      {data.participants.length ? <div className="table-wrap"><table><thead><tr><th>Code</th><th>Username</th><th>Tasks</th><th>Progress</th></tr></thead>
        <tbody>{data.participants.map((row) => <tr key={row.id}><td><strong>{row.participant_code}</strong></td><td>{row.username}</td>
          <td>{data.tasks.filter((task) => task.participant_id === row.id).map((task) => `T${task.task_order}: ${task.project_id} / ${task.condition}`).join(' · ')}</td>
          <td>{row.submitted_tasks}/{row.task_count} submitted</td></tr>)}</tbody></table></div> : <div className="empty">No participants yet.</div>}
    </section></Shell>;
}
