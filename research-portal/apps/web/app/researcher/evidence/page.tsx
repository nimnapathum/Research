import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { EvidenceBoard } from '@/components/EvidenceBoard';
import { naturalEvidenceStatus } from '@/lib/natural-evidence';
import { serverApi } from '@/lib/server-api';
import type { StudyTask, StudyUser } from '@/lib/types';

type Participant = { id: string; participant_code: string };
type AssignedTask = StudyTask & { participant_id: string };
type Recording = { id: string; participant_code: string; drive_url: string; label: string; notes: string; created_at: string };

export default async function ResearcherEvidencePage() {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') redirect('/dashboard');
  if (process.env.STUDY_PROTOCOL !== 'natural') redirect('/researcher/imports');
  const [data, recordings] = await Promise.all([
    serverApi<{ participants: Participant[]; tasks: AssignedTask[] }>('researcher/participants'),
    serverApi<Recording[]>('researcher/recordings')
  ]);
  const rows = await Promise.all(data.participants.map(async (person) => ({
    code: person.participant_code,
    recordings: recordings.filter((recording) => recording.participant_code === person.participant_code),
    tasks: await Promise.all(data.tasks.filter((task) => task.participant_id === person.id)
      .sort((a, b) => a.task_order - b.task_order).map(async (task) => {
        const status = /^P\d{8}$/.test(person.participant_code) &&
          task.external_task_id === `${person.participant_code}-T${task.task_order}`
          ? await naturalEvidenceStatus(person.participant_code, task.external_task_id) : null;
        return { id: task.external_task_id, order: task.task_order, project: task.project_id,
          submitted: task.status === 'submitted', status: status ? {
            missing: status.missing, issues: status.issues, ready: status.ready
          } : null };
      }))
  })));
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Natural-task evidence</p>
    <h1>Evidence and recordings</h1><p>Find a participant, link the Meet recording, and open one task at a time for detailed review.</p></div></div>
    <EvidenceBoard rows={rows} />
  </Shell>;
}
