import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import type { ParticipantDashboard, ResearcherOverview, StudyUser } from '@/lib/types';
import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { TaskCards } from '@/components/TaskCards';

export default async function DashboardPage() {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role === 'researcher') {
    const data = await serverApi<ResearcherOverview>('researcher/overview');
    const metrics = [['Participants', data.counts.participants], ['Assigned tasks', data.counts.tasks],
      ['Form responses', data.counts.responses], ['Import files', data.counts.imports], ['Captured events', data.counts.events]] as const;
    return <Shell user={user}><div className="hero"><div><p className="eyebrow">Researcher overview</p><h1>Study operations</h1>
      <p>Track recruitment, questionnaire completion, imported IDE events, and analysis readiness.</p></div>
      <Link className="button" href="/researcher/participants">Add participant</Link></div>
      <div className="grid five">{metrics.map(([label, value]) => <div className="card" key={label}><div className="metric">{value}</div><div className="metric-label">{label}</div></div>)}</div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Task progress</h2>
        <BarChart rows={data.progress.map((row) => ({ label: row.status.replace('_', ' '), value: row.count }))} /></section>
        <section className="card"><h2>Captured event types</h2>
          <BarChart rows={data.eventTypes.map((row) => ({ label: row.event_type, value: row.count }))} />
          <div className="chart-caption">Counts reflect imported event files; they do not infer cognitive mode.</div></section></div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Latest adjudicated analysis</h2>
        {data.latestAnalysis ? <><div className="metric">{String(data.latestAnalysis.summary.exposed_opportunities ?? '—')}</div>
          <div className="metric-label">Exposed opportunities in the imported summary</div>
          <p className="small">Imported {new Date(data.latestAnalysis.created_at).toLocaleString()}. <Link href="/researcher/analytics">View analysis</Link></p></>
          : <div className="empty">No study analysis summary imported yet. Upload the analysis pipeline’s <span className="code">summary.json</span> when adjudication is complete.</div>}</section>
        <section className="card"><h2>Recent imports</h2>{data.recentImports.length ? <div className="stack">
          {data.recentImports.map((item) => <div className="row small" key={item.id}><span>{item.original_filename}<br/><span className="muted">{item.kind} · {item.participant_code || 'study-wide'}</span></span><strong>{item.imported_count}</strong></div>)}
        </div> : <div className="empty">No files imported yet.</div>}</section></div>
    </Shell>;
  }
  const data = await serverApi<ParticipantDashboard>('participant/dashboard');
  const uniqueForms = [...new Map(data.questionnaires.map((form) => [form.id, form])).values()];
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Participant {user.participant_code}</p>
    <h1>Continue your study session</h1><p>Your task cards, questionnaires, and event uploads are collected here. Follow the researcher’s checkpoint instructions while coding.</p></div></div>
    <h2 className="section-title">Your two tasks</h2><TaskCards tasks={data.tasks} />
    <h2 className="section-title">Questionnaires</h2><div className="grid two">{uniqueForms.map((form) => {
      const taskForms = form.stage === 'after_task';
      const taskLinks = taskForms ? data.tasks.map((task) => ({ task, done: data.questionnaires.some((row) =>
        row.id === form.id && row.response_task_id === task.id) })) : [];
      const done = !taskForms && data.questionnaires.some((row) => row.id === form.id && row.response_id);
      return <section className="card" key={form.id}><div className="row"><h2>{form.title}</h2><span className={`pill ${done ? 'good' : 'gray'}`}>{done ? 'submitted' : form.stage.replace('_', ' ')}</span></div>
        {taskForms ? <div className="stack">{taskLinks.map(({ task, done: submitted }) => <div className="row" key={task.id}>
          <span className="small">Task {task.task_order} · {task.external_task_id}</span>{submitted ? <span className="pill good">Submitted</span>
            : <Link className="button secondary" href={`/forms/${form.id}?task=${task.id}`}>Open form</Link>}</div>)}</div>
          : done ? <p className="small">Your response is saved.</p> : <Link className="button secondary" href={`/forms/${form.id}`}>Open form</Link>}
      </section>})}</div>
    <h2 className="section-title">Evidence uploads</h2><div className="card"><p>You can import an IDE event export for your assigned tasks. Research staff will review the capture quality.</p>
      <Link className="button secondary" href="/participant/upload">Upload event file</Link>
      <p className="small muted">{data.uploads.length} file{data.uploads.length === 1 ? '' : 's'} imported so far.</p></div>
  </Shell>;
}
