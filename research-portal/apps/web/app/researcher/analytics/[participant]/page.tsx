import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { AnalysisRefresh } from '@/components/AnalysisRefresh';
import { naturalTaskSummaries, reviewedFeatures, type AssignedTask, type NaturalAssessment,
  type Recording, type StudyParticipant, type StudyResponse } from '@/lib/natural-analysis';
import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';

const answers = [
  ['known_next_step', 'Knew next step'], ['sought_options', 'Sought approaches'],
  ['task_familiarity', 'Task familiarity'], ['task_difficulty', 'Task difficulty'],
  ['time_pressure', 'Time pressure'], ['agent_reliance', 'Agent reliance']
] as const;

export default async function ParticipantAnalysisPage({ params }: { params: Promise<{ participant: string }> }) {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') redirect('/dashboard');
  if (process.env.STUDY_PROTOCOL !== 'natural') notFound();
  const { participant: code } = await params;
  if (!/^P\d{8}$/.test(code)) notFound();
  const [data, responses, recordings, assessments] = await Promise.all([
    serverApi<{ participants: StudyParticipant[]; tasks: AssignedTask[] }>('researcher/participants'),
    serverApi<StudyResponse[]>('researcher/responses'), serverApi<Recording[]>('researcher/recordings'),
    serverApi<NaturalAssessment[]>('researcher/natural-assessments')
  ]);
  const person = data.participants.find((item) => item.participant_code === code);
  if (!person) notFound();
  const tasks = await naturalTaskSummaries([person], data.tasks.filter((item) => item.participant_id === person.id), responses);
  const judged = reviewedFeatures(tasks, assessments);
  const video = recordings.filter((item) => item.participant_code === code);
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Participant analysis · {person.study_phase || 'legacy'}</p>
    <h1>{code}</h1><p>Compare the two assigned tasks, recorded confidence and collection quality before interpreting the coding evidence.</p></div>
    <Link className="button secondary" href={`/researcher/analytics?phase=${person.study_phase || 'legacy'}`}>← Phase overview</Link></div>
    <AnalysisRefresh />
    <div className="notice"><strong>Evidence boundary</strong><p>These numbers describe uploads and participant reports. They are not a security verdict or a measure of observed cognitive mode. Read the code timeline and video before coding developer checks or agent-origin changes.</p></div>
    <div className="grid two" style={{ marginTop: 16 }}>{tasks.map((task) => {
      const after = responses.find((row) => row.participant_code === code && row.stage === 'after_task' && row.external_task_id === task.task_id);
      const outcomes = judged.filter((item) => item.task.task_id === task.task_id);
      return <section className="card" key={task.task_id}><p className="eyebrow">Task {task.order} · {task.project === 'A' ? 'Resource catalogue' : 'Support archive'}</p>
        <h2>{task.condition} orientation</h2><p className="small muted">{task.submitted ? 'Submitted' : 'In progress'} · {task.uploaded}/6 files · {task.snapshot_count ?? '—'} code snapshots · {task.agent_records ?? '—'} agent records</p>
        {(task.sql_probability !== null || task.path_probability !== null) && <BarChart max={100} rows={[
          ...(task.sql_probability === null ? [] : [{ label: 'SQL secure (%)', value: task.sql_probability }]),
          ...(task.path_probability === null ? [] : [{ label: 'Path secure (%)', value: task.path_probability }])]} />}
        <p className="small muted">Participant probability for the final code: SQL {task.sql_probability === null ? 'missing' : `${task.sql_probability}%`}; path {task.path_probability === null ? 'missing' : `${task.path_probability}%`}. Bars show belief only.</p>
        <h3>Independent review outcome</h3>{outcomes.length ? <div className="table-wrap"><table><thead><tr><th>Feature</th><th>Security</th><th>Functionality</th><th>Brier</th></tr></thead><tbody>
          {outcomes.map((item) => <tr key={item.record.id}><td>{item.record.weakness_class.toUpperCase()}</td>
            <td>{item.record.resolved_security}</td><td>{item.record.resolved_functionality}</td>
            <td>{item.brier === null ? '—' : item.brier.toFixed(3)}</td></tr>)}</tbody></table></div>
          : <p className="small muted">No reviewed feature outcome linked to this final hash yet.</p>}
        <p><strong>After-task form:</strong> {task.after_task ? 'submitted' : 'missing'}</p>
        {after && <details><summary>Participant self-report</summary><div className="table-wrap"><table><tbody>
          {answers.map(([key, label]) => <tr key={key}><th>{label}</th><td>{String(after.answers[key] ?? '—')}</td></tr>)}
        </tbody></table></div><p className="small">These answers help interpret the replay interview; they do not assign a mode.</p></details>}
        {task.issues.map((issue) => <p className="alert error" key={issue}>{issue}</p>)}
        {task.warnings.map((warning) => <p className="alert" key={warning}>{warning}</p>)}
        <p><Link className="button secondary" href={`/researcher/evidence/${code}/${task.task_id}`}>Inspect snapshots and final code</Link></p>
      </section>;
    })}</div>
    <section className="card" style={{ marginTop: 16 }}><h2>Google Meet recording</h2>
      {video.length ? video.map((item) => <p key={item.id}><a href={item.drive_url} target="_blank" rel="noopener noreferrer">{item.label || 'Open recording in Google Drive'}</a>
        {item.notes && <span className="small muted"> · {item.notes}</span>}</p>)
        : <p className="small muted">No researcher recording link yet. Add one on the <Link href="/researcher/evidence">Evidence page</Link>.</p>}
      <p className="small muted">Check that the link opens under the approved account and note each task’s recording time range.</p>
    </section>
  </Shell>;
}
