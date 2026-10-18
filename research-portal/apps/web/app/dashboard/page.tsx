import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import type { ParticipantDashboard, ResearcherOverview, StudyUser } from '@/lib/types';
import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { TaskCards } from '@/components/TaskCards';
import { taskAccess } from '@/lib/task-access';

export default async function DashboardPage() {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role === 'researcher') {
    const data = await serverApi<ResearcherOverview>('researcher/overview');
    const natural = process.env.STUDY_PROTOCOL === 'natural';
    const metrics = natural
      ? [['Participants', data.counts.participants], ['Assigned tasks', data.counts.tasks],
        ['Form responses', data.counts.responses]] as const
      : [['Participants', data.counts.participants], ['Assigned tasks', data.counts.tasks],
        ['Form responses', data.counts.responses], ['Import files', data.counts.imports], ['Captured events', data.counts.events]] as const;
    return <Shell user={user}><div className="hero"><div><p className="eyebrow">Researcher overview</p><h1>Study operations</h1>
      <p>{natural ? 'Track study phase, task progress, questionnaires and evidence review.' : 'Track recruitment, questionnaire completion, imported IDE events, and analysis readiness.'}</p></div>
      <Link className="button" href="/researcher/participants">Add participant</Link></div>
      {natural && <div className="notice"><strong>Natural-task collection</strong>
        <p>Choose the study phase when creating an account. <Link href="/researcher/evidence">Review evidence and recording links</Link>, then use the documented independent security assessment and natural analysis tables. Counts here are operational; they do not measure cognitive mode or security outcomes.</p></div>}
      <div className={natural ? 'grid three' : 'grid five'}>{metrics.map(([label, value]) => <div className="card" key={label}><div className="metric">{value}</div><div className="metric-label">{label}</div></div>)}</div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Task progress</h2>
        <BarChart rows={data.progress.map((row) => ({ label: row.status.replace('_', ' '), value: row.count }))} /></section>
        {natural ? <section className="card"><h2>Review next</h2><p>Open the evidence list to check receipts, transcript health and recording links. Use Analytics for phase-specific collection, code timelines and entered review outcomes. Submitted does not mean security adjudication is complete.</p>
          <div className="row"><Link className="button secondary" href="/researcher/evidence">Open evidence</Link>
            <Link className="button secondary" href="/researcher/analytics">Open analytics</Link></div></section> :
        <section className="card"><h2>Captured event types</h2>
          <BarChart rows={data.eventTypes.map((row) => ({ label: row.event_type, value: row.count }))} />
          <div className="chart-caption">Counts reflect imported event files; they do not infer cognitive mode.</div></section>}</div>
      {!natural && <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Latest adjudicated analysis</h2>
        {data.latestAnalysis ? <><div className="metric">{String(data.latestAnalysis.summary.exposed_opportunities ?? '—')}</div>
          <div className="metric-label">Exposed opportunities in the imported summary</div>
          <p className="small">Imported {new Date(data.latestAnalysis.created_at).toLocaleString()}. <Link href="/researcher/analytics">View analysis</Link></p></>
          : <div className="empty">No study analysis summary imported yet. Upload the analysis pipeline’s <span className="code">summary.json</span> when adjudication is complete.</div>}</section>
        <section className="card"><h2>Recent imports</h2>{data.recentImports.length ? <div className="stack">
          {data.recentImports.map((item) => <div className="row small" key={item.id}><span>{item.original_filename}<br/><span className="muted">{item.kind} · {item.participant_code || 'study-wide'}</span></span><strong>{item.imported_count}</strong></div>)}
        </div> : <div className="empty">No files imported yet.</div>}</section></div>}
    </Shell>;
  }
  const data = await serverApi<ParticipantDashboard>('participant/dashboard');
  const natural = process.env.STUDY_PROTOCOL === 'natural';
  const uniqueForms = [...new Map(data.questionnaires.map((form) => [form.id, form])).values()];
  const access = Object.fromEntries(data.tasks.map((task) => [task.id, taskAccess(data, task)]));
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Participant {user.participant_code}</p>
    <h1>Continue your study session</h1><p>{natural ? 'Complete the pre-task form, then download each natural-coding project. The agent may edit from the first prompt.' : 'Complete the pre-task form, then open Task 1 for its sheets, recorded-task ZIP, and Antigravity capture setup.'}</p></div></div>
    {natural && <section className="card"><h2>Your session, step by step</h2><ol>
      <li>Complete the pre-task questionnaire below and finish the practice with the researcher.</li>
      <li>Open Task 1. Download and extract its project, read the task and work guidance, then follow its capture setup instructions before your first prompt.</li>
      <li>Code with the agent normally. When finished, save the final snapshot and answer its security rating before researcher feedback.</li>
      <li>Upload the final manifest and rating, answer the after-task form, then upload the remaining evidence. Return here and set “My progress” to “Submitted”.</li>
      <li>Repeat for Task 2, then complete the final session questionnaire and interview with the researcher.</li>
    </ol><p className="small">Each task page contains its code download, commands, file names, and upload controls. Tell the researcher if capture fails; keep your original files.</p></section>}
    <h2 className="section-title">Your two tasks</h2><TaskCards tasks={data.tasks} access={access} natural={natural} />
    <h2 className="section-title">Questionnaires</h2><div className="grid two">{uniqueForms.map((form) => {
      const taskForms = form.stage === 'after_task';
      const taskLinks = taskForms ? data.tasks.map((task) => ({ task, done: data.questionnaires.some((row) =>
        row.id === form.id && row.response_task_id === task.id) })) : [];
      const done = !taskForms && data.questionnaires.some((row) => row.id === form.id && row.response_id);
      const afterBothReady = form.stage !== 'after_both' || data.tasks.every((task) => task.status === 'submitted' &&
        data.questionnaires.some((row) => row.stage === 'after_task' && row.response_task_id === task.id));
      return <section className="card" key={form.id}><div className="row"><h2>{form.title}</h2><span className={`pill ${done ? 'good' : 'gray'}`}>{done ? 'submitted' : form.stage.replace('_', ' ')}</span></div>
        {taskForms ? <div className="stack">{taskLinks.map(({ task, done: submitted }) => <div className="row" key={task.id}>
          <span className="small">Task {task.task_order} · {task.external_task_id}</span>{submitted ? <span className="pill good">Submitted</span>
            : (natural ? task.final_rating_received : task.status === 'submitted') ? <Link className="button secondary" href={`/forms/${form.id}?task=${task.id}`}>Open form</Link>
            : <span className="small muted">{natural ? 'Available after uploading the final manifest and security rating' : 'Available after recorded final code'}</span>}</div>)}</div>
          : done ? <p className="small">Your response is saved.</p> : afterBothReady ? <Link className="button secondary" href={`/forms/${form.id}`}>Open form</Link>
          : <p className="small muted">Available after both tasks and after-task forms.</p>}
      </section>})}</div>
    <h2 className="section-title">Evidence uploads</h2><div className="card"><p>{natural ? 'Open each task page to upload the agent transcript, code history, final code, capture health, and security rating files. The researcher records Google Meet and links the video separately.' : 'You can import an IDE event export for your assigned tasks. Research staff will review the capture quality.'}</p>
      {!natural && <><Link className="button secondary" href="/participant/upload">Upload event file</Link>
        <p className="small muted">{data.uploads.length} file{data.uploads.length === 1 ? '' : 's'} imported so far.</p></>}</div>
  </Shell>;
}
