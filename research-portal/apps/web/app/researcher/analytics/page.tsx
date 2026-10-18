import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { AnalysisRefresh } from '@/components/AnalysisRefresh';
import { serverApi } from '@/lib/server-api';
import { naturalTaskSummaries, pairedBrier, reviewedFeatures, type AssignedTask, type NaturalAssessment,
  type Recording, type StudyParticipant, type StudyResponse } from '@/lib/natural-analysis';
import type { StudyUser } from '@/lib/types';

type Analytics = {
  latestSummary: { summary: Record<string, unknown>; created_at: string } | null;
  byCondition: { condition: string; exposed: number; scored: number; mean_brier: string | null; vulnerable_exposed: number; target_retained: number }[];
  byClass: { weakness_class: string; exposed: number; mean_brier: string | null }[];
  eventsByDay: { day: string; count: number }[];
  participantCoverage: { participant_code: string; tasks: number; responses: number; events: number }[];
};
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ phase?: string }> }) {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') redirect('/dashboard');
  const natural = process.env.STUDY_PROTOCOL === 'natural';
  if (natural) {
    const [data, responses, recordings, assessments] = await Promise.all([
      serverApi<{ participants: StudyParticipant[]; tasks: AssignedTask[] }>('researcher/participants'),
      serverApi<StudyResponse[]>('researcher/responses'), serverApi<Recording[]>('researcher/recordings'),
      serverApi<NaturalAssessment[]>('researcher/natural-assessments')
    ]);
    const phases = ['rehearsal', 'pilot', 'main', 'legacy'];
    const requested = (await searchParams).phase;
    const phase = requested && phases.includes(requested) ? requested :
      ['main', 'pilot', 'rehearsal', 'legacy'].find((item) => data.participants.some((person) =>
        (person.study_phase || 'legacy') === item)) || 'rehearsal';
    const people = data.participants.filter((person) => (person.study_phase || 'legacy') === phase);
    const selectedIds = new Set(people.map((person) => person.id));
    const rows = await naturalTaskSummaries(people, data.tasks.filter((task) => selectedIds.has(task.participant_id)), responses);
    const judged = reviewedFeatures(rows, assessments);
    const scored = judged.filter((item) => item.brier !== null);
    const paired = pairedBrier(rows, assessments);
    const verdicts = new Map(judged.map((item) => [`${item.task.task_id}/${item.record.weakness_class}`, item.record]));
    const linked = new Set(recordings.map((item) => item.participant_code));
    const conditions = ['acceleration', 'exploration'];
    const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const brierMean = (values: number[]) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3) : '—';
    return <Shell user={user}><div className="hero"><div><p className="eyebrow">Natural study · live collection</p><h1>Study analysis</h1>
      <p>Review one study phase at a time. Counts and confidence update when participants upload files and submit forms.</p></div>
      <Link className="button secondary" href="/researcher/evidence">Evidence and recording links</Link></div>
      <AnalysisRefresh />
      <form method="get" className="card form-inline"><label htmlFor="analysis-phase">Study phase</label>
        <select id="analysis-phase" name="phase" defaultValue={phase}>
          <option value="rehearsal">Self rehearsal</option><option value="pilot">Feasibility pilot</option>
          <option value="main">Main study</option><option value="legacy">Legacy unclassified</option>
        </select><button className="button secondary" type="submit">Show phase</button>
        <span className="small muted">Phases are shown separately to protect the main-study analysis.</span></form>
      <div className="grid three" style={{ marginTop: 16 }}>
        <div className="card"><div className="metric">{people.length}</div><div className="metric-label">Participants in phase</div></div>
        <div className="card"><div className="metric">{rows.filter((row) => row.submitted).length}/{rows.length}</div><div className="metric-label">Tasks submitted</div></div>
        <div className="card"><div className="metric">{people.filter((person) => linked.has(person.participant_code)).length}/{people.length}</div><div className="metric-label">Recording links entered</div></div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Collection by condition</h2>
        <BarChart rows={conditions.map((condition) => ({ label: `${condition} · six files`,
          value: rows.filter((row) => row.condition === condition && row.evidence_ready).length }))} />
        <p className="small muted">Denominator: {conditions.map((condition) => `${condition} ${rows.filter((row) => row.condition === condition).length} assigned tasks`).join(' · ')}. A receipt does not establish usable data.</p></section>
        <section className="card"><h2>Security confidence recorded</h2>
          {rows.some((row) => row.sql_probability !== null || row.path_probability !== null) ? <BarChart max={100} rows={conditions.flatMap((condition) => {
            const selected = rows.filter((row) => row.condition === condition);
            const sql = selected.flatMap((row) => row.sql_probability === null ? [] : [row.sql_probability]);
            const path = selected.flatMap((row) => row.path_probability === null ? [] : [row.path_probability]);
            return [...(sql.length ? [{ label: `${condition} · SQL (n=${sql.length})`, value: average(sql) }] : []),
              ...(path.length ? [{ label: `${condition} · path (n=${path.length})`, value: average(path) }] : [])];
          })} /> : <div className="empty">No final-code ratings uploaded in this phase.</div>}
          <p className="small muted">Mean reported probability (0–100%); missing ratings are excluded. This is not a calibration or security result. Inspect individual values below.</p></section></div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Reviewed target security</h2>
        {judged.length ? <BarChart rows={conditions.flatMap((condition) => {
          const inCondition = judged.filter((item) => item.task.condition === condition);
          return inCondition.length ? [
          { label: `${condition} · secure (n=${inCondition.length})`, value: judged.filter((item) => item.task.condition === condition &&
            item.record.resolved_security === 'target_secure').length },
          { label: `${condition} · vulnerable (n=${inCondition.length})`, value: judged.filter((item) => item.task.condition === condition &&
            item.record.resolved_security === 'vulnerable').length },
          { label: `${condition} · functional + secure (n=${inCondition.length})`, value: judged.filter((item) => item.task.condition === condition &&
            item.record.resolved_functionality === 'pass' && item.record.resolved_security === 'target_secure').length }
        ] : [];
        })} /> : <div className="empty">No independently reviewed feature outcomes have been entered for this phase.</div>}
        <p className="small muted">{judged.length} reviewed feature records linked to uploaded final hashes, out of {rows.length * 2} assigned features. “Functional + secure” is a subset of secure. Missing and unassessable features are never counted as secure.</p></section>
        <section className="card"><h2>Confidence accuracy after review</h2>
          {scored.length ? <div className="table-wrap"><table><thead><tr><th>Condition</th><th>SQL mean Brier</th><th>Path mean Brier</th></tr></thead><tbody>
            {conditions.map((condition) => <tr key={condition}><td>{condition}</td>{(['sql', 'path'] as const).map((weakness) => {
              const subset = scored.filter((item) => item.task.condition === condition && item.record.weakness_class === weakness);
              return <td key={weakness}>{brierMean(subset.map((item) => item.brier!))} <span className="small muted">(n={subset.length})</span></td>;
            })}</tr>)}</tbody></table></div> : <div className="empty">No assessable reviewed feature has both a final rating and a functional security verdict.</div>}
          <p className="small muted">Lower Brier scores mean more accurate probabilities. These are descriptive feature means, not the paired participant estimate or a pure calibration measure.</p>
        </section></div>
      <section className="card" style={{ marginTop: 16 }}><h2>Primary paired confidence-accuracy estimate</h2>
        {paired ? <p><strong>{paired.mean_difference.toFixed(3)}</strong> mean Brier difference, acceleration minus exploration;
          95% participant-bootstrap interval <strong>{paired.lower_95.toFixed(3)} to {paired.upper_95.toFixed(3)}</strong>;
          {paired.participants} complete paired participants.</p>
          : <div className="empty">No participant yet has reviewed, assessable SQL and path outcomes with ratings in both conditions.</div>}
        <p className="small muted">Positive values mean less accurate security probabilities in acceleration. This estimate uses only complete assessable pairs and 10,000 fixed-seed participant resamples. Inspect missing and nonfunctional features before drawing a study conclusion; pilot estimates are feasibility information.</p></section>
      <section className="card" style={{ marginTop: 16 }}><h2>Task-level collection and confidence</h2>
        {rows.length ? <div className="table-wrap"><table><thead><tr><th>Participant</th><th>Task</th><th>Condition</th><th>Status</th><th>Files</th><th>Snapshots</th><th>Agent records</th><th>SQL belief</th><th>Path belief</th><th>SQL review</th><th>Path review</th><th>Code</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.task_id}><td><Link href={`/researcher/analytics/${row.participant_code}`}>{row.participant_code}</Link></td>
            <td>T{row.order} · {row.project}</td><td>{row.condition}</td><td>{row.submitted ? 'Submitted' : 'In progress'}</td>
            <td>{row.uploaded}/6{row.issues.length || row.warnings.length ? ' · check' : ''}</td>
            <td>{row.snapshot_count ?? '—'}</td><td>{row.agent_records ?? '—'}</td>
            <td>{row.sql_probability === null ? '—' : `${row.sql_probability}%`}</td>
            <td>{row.path_probability === null ? '—' : `${row.path_probability}%`}</td>
            <td>{verdicts.get(`${row.task_id}/sql`)?.resolved_security || 'Pending'}</td>
            <td>{verdicts.get(`${row.task_id}/path`)?.resolved_security || 'Pending'}</td>
            <td><Link href={`/researcher/evidence/${row.participant_code}/${row.task_id}`}>Timeline</Link></td></tr>)}</tbody></table></div>
          : <div className="empty">No assigned tasks in this phase.</div>}
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>Interpretation and remaining coding</h2>
        <p>Reviewed security outcomes come from researcher-entered records of two independent assessments, never from upload presence. Agent-origin vulnerability exposure, developer verification and observed interaction mode still require coding of the synchronized transcript, snapshots and recording. Use the <Link href="/researcher/research?doc=NATURAL_ANALYSIS_PLAN.md">analysis plan</Link> for participant-paired estimates and missing-data rules.</p>
      </section>
    </Shell>;
  }
  const data = await serverApi<Analytics>('researcher/analytics');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Descriptive monitoring</p><h1>Analytics</h1>
    <p>Use these counts to spot missing data. Interpret condition effects with the preregistered analysis and blinded adjudication.</p></div></div>
    <div className="grid two"><section className="card"><h2>Eligible exposure by condition</h2>
      <BarChart rows={data.byCondition.map((row) => ({ label: row.condition, value: row.exposed }))} />
      {data.byCondition.length > 0 && <div className="table-wrap"><table><thead><tr><th>Condition</th><th>Scored</th><th>Mean Brier</th><th>Target retained</th></tr></thead>
        <tbody>{data.byCondition.map((row) => <tr key={row.condition}><td>{row.condition}</td><td>{row.scored}</td>
          <td>{row.mean_brier === null ? '—' : Number(row.mean_brier).toFixed(3)}</td><td>{row.target_retained}</td></tr>)}</tbody></table></div>}
    </section><section className="card"><h2>Eligible exposure by vulnerability class</h2>
      <BarChart rows={data.byClass.map((row) => ({ label: row.weakness_class, value: row.exposed }))} /></section></div>
    <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>IDE events by day</h2>
      <BarChart rows={data.eventsByDay.map((row) => ({ label: String(row.day).slice(0, 10), value: row.count }))} /></section>
      <section className="card"><h2>Latest study analysis</h2>{data.latestSummary ? <><p className="small">
        Imported {new Date(data.latestSummary.created_at).toLocaleString()}</p><pre className="json-box">{JSON.stringify(data.latestSummary.summary, null, 2)}</pre></>
        : <div className="empty">No adjudicated summary imported.</div>}</section></div>
    <section className="card" style={{ marginTop: 16 }}><h2>Participant data coverage</h2>
      {data.participantCoverage.length ? <div className="table-wrap"><table><thead><tr><th>Code</th><th>Tasks</th><th>Form responses</th><th>IDE events</th></tr></thead>
        <tbody>{data.participantCoverage.map((row) => <tr key={row.participant_code}><td>{row.participant_code}</td>
          <td>{row.tasks}</td><td>{row.responses}</td><td>{row.events}</td></tr>)}</tbody></table></div>
        : <div className="empty">No participant records.</div>}</section>
  </Shell>;
}
