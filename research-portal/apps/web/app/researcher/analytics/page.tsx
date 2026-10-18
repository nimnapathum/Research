import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { AnalysisRefresh } from '@/components/AnalysisRefresh';
import { CodedReportUpload } from '@/components/CodedReportUpload';
import { CodeChangePlot, ConfidenceOutcomePlot, OutcomeStackPlot, PairedBrierPlot } from '@/components/StudyPlots';
import { serverApi } from '@/lib/server-api';
import { naturalCodeMetricsForTasks } from '@/lib/natural-code-metrics';
import { latestNaturalCodedReport, type NaturalPhase } from '@/lib/natural-coded-report';
import { buildNaturalFeatureCSV } from '@/lib/natural-feature-export';
import { featureCells, naturalTaskSummaries, pairedBrier, pairedBrierPoints, pairedVulnerability, reviewedFeatures,
  studyConditions, targetClasses, type AssignedTask, type NaturalAssessment,
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
    const codeMetrics = await naturalCodeMetricsForTasks(rows);
    const judged = reviewedFeatures(rows, assessments);
    const cells = featureCells(rows, assessments);
    const scored = judged.filter((item) => item.brier !== null);
    const paired = pairedBrier(rows, assessments);
    const pairedPoints = pairedBrierPoints(rows, assessments);
    const pairedVulnerable = pairedVulnerability(rows, assessments);
    const coded = await latestNaturalCodedReport(phase as NaturalPhase, buildNaturalFeatureCSV(rows, assessments));
    const verdicts = new Map(judged.map((item) => [`${item.task.task_id}/${item.record.weakness_class}`, item.record]));
    const linked = new Set(recordings.map((item) => item.participant_code));
    const conditions = studyConditions;
    const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const brierMean = (values: number[]) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3) : '—';
    const afterTask = new Map(responses.filter((item) => item.stage === 'after_task' && item.external_task_id)
      .map((item) => [`${item.participant_code}/${item.external_task_id}`, item.answers]));
    const scaleRows = (keys: { key: string; label: string }[]) => conditions.flatMap((condition) => keys.map(({ key, label }) => {
      const scores = rows.filter((row) => row.condition === condition).flatMap((row) => {
        const value = afterTask.get(`${row.participant_code}/${row.task_id}`)?.[key];
        return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 7 ? [Number(value)] : [];
      });
      return scores.length ? { label: `${condition} · ${label} (n=${scores.length})`,
        value: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length * 10) / 10 } : null;
    }).filter((item): item is { label: string; value: number } => item !== null));
    const changedCode = rows.flatMap((row) => {
      const metrics = codeMetrics.get(row.task_id)?.metrics;
      return metrics ? [{ label: `${row.participant_code} · T${row.order}`, condition: row.condition as 'acceleration' | 'exploration',
        changed: metrics.source_change_snapshots, snapshots: metrics.snapshot_count,
        added: metrics.source_lines_added, removed: metrics.source_lines_removed }] : [];
    });
    return <Shell user={user}><div className="hero"><div><p className="eyebrow">Natural study · RQ-linked evidence</p><h1>Study analysis</h1>
      <p>Follow the path from assigned tasks to final security judgments. Behaviour and observed mode require separate coding of recordings and transcripts.</p></div>
      <Link className="button secondary" href="/researcher/evidence">Evidence and recording links</Link></div>
      <AnalysisRefresh />
      <form method="get" className="card form-inline"><label htmlFor="analysis-phase">Study phase</label>
        <select id="analysis-phase" name="phase" defaultValue={phase}>
          <option value="rehearsal">Self rehearsal</option><option value="pilot">Feasibility pilot</option>
          <option value="main">Main study</option><option value="legacy">Legacy unclassified</option>
        </select><button className="button secondary" type="submit">Show phase</button>
        <span className="small muted">Phases are shown separately to protect the main-study analysis.</span>
        <a className="button secondary" href={`/api/researcher/natural-features?phase=${phase}`}>Download feature analysis CSV</a></form>
      <section className="card" style={{ marginTop: 16 }}><h2>What is ready to interpret?</h2>
        <div className="table-wrap"><table><thead><tr><th>Question</th><th>Current evidence</th><th>Needed before a conclusion</th></tr></thead><tbody>
          <tr><td>RQ1 · Security confidence</td><td>{scored.length}/{cells.length} final features have a matched rating and assessable review; {paired?.participants || 0} complete participant pairs.</td><td>Inspect confidence on secure and vulnerable code separately, missing pairs, and observed-mode coding.</td></tr>
          <tr><td>RQ2 · Final vulnerabilities</td><td>{cells.filter((item) => item.status !== 'pending').length}/{cells.length} final features reviewed; {pairedVulnerable?.participants || 0} complete assessable participant pairs.</td><td>Report functionality, absent features and confirmed agent-origin exposures separately.</td></tr>
          <tr><td>RQ3 · Verification</td><td>Uploads and agent-record counts show collection only.</td><td>Code human checks, timing, inspection, repairs and final survival from video, transcript and snapshots.</td></tr>
          <tr><td>RQ4 · SQL versus path</td><td>Class-specific final reviews and ratings can be compared descriptively.</td><td>Confirm enough vulnerable cases and report class-specific denominators; treat interactions as exploratory.</td></tr>
        </tbody></table></div></section>
      <div className="grid three" style={{ marginTop: 16 }}>
        <div className="card"><div className="metric">{people.length}</div><div className="metric-label">Participants in phase</div></div>
        <div className="card"><div className="metric">{rows.filter((row) => row.submitted).length}/{rows.length}</div><div className="metric-label">Tasks submitted</div></div>
        <div className="card"><div className="metric">{people.filter((person) => linked.has(person.participant_code)).length}/{people.length}</div><div className="metric-label">Recording links entered</div></div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Collection by condition</h2>
        <BarChart rows={conditions.map((condition) => ({ label: `${condition} · six files`,
          value: rows.filter((row) => row.condition === condition && row.evidence_ready).length }))} />
        <p className="small muted">Denominator: {conditions.map((condition) => `${condition} ${rows.filter((row) => row.condition === condition).length} assigned tasks`).join(' · ')}. A receipt does not establish usable data.</p></section>
        <section className="card"><h2>RQ1 · Matched security confidence</h2>
          {rows.some((row) => row.sql_probability !== null || row.path_probability !== null) ? <BarChart max={100} rows={conditions.flatMap((condition) => {
            const selected = rows.filter((row) => row.condition === condition);
            const sql = selected.flatMap((row) => row.sql_probability === null ? [] : [row.sql_probability]);
            const path = selected.flatMap((row) => row.path_probability === null ? [] : [row.path_probability]);
            return [...(sql.length ? [{ label: `${condition} · SQL (n=${sql.length})`, value: average(sql) }] : []),
              ...(path.length ? [{ label: `${condition} · path (n=${path.length})`, value: average(path) }] : [])];
          })} /> : <div className="empty">No final-code ratings uploaded in this phase.</div>}
          <p className="small muted">Mean reported probability (0–100%) for ratings tied to the final snapshot hash. Missing or mismatched ratings are excluded. Confidence alone is not a security or trust result.</p></section></div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>Condition check · reported interaction</h2>
        <BarChart max={7} rows={scaleRows([{ key: 'known_next_step', label: 'known next step' },
          { key: 'sought_options', label: 'sought approaches' }])} />
        <p className="small muted">Mean after-task self-report on a 1–7 scale. These study-created items help check whether the condition worked; they do not assign cognitive mode. Confirm with independent episode coding.</p>
      </section><section className="card"><h2>Condition check · competing explanations</h2>
        <BarChart max={7} rows={scaleRows([{ key: 'task_familiarity', label: 'familiarity' },
          { key: 'task_difficulty', label: 'difficulty' }, { key: 'time_pressure', label: 'time pressure' }])} />
        <p className="small muted">Mean after-task self-report on a 1–7 scale, with the number of responses beside each bar. Large differences could explain outcome differences independently of observed mode.</p>
      </section></div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>RQ1 · Confidence against assessed security</h2>
        <ConfidenceOutcomePlot points={judged.flatMap((item) => item.probability === null ||
          !['target_secure', 'vulnerable'].includes(item.record.resolved_security) ? [] : [{
            id: `${item.task.participant_code} T${item.task.order} ${item.record.weakness_class}`,
            condition: item.task.condition as 'acceleration' | 'exploration',
            weakness: item.record.weakness_class, probability: item.probability,
            secure: item.record.resolved_security === 'target_secure' }])} />
        <p className="small muted">A high dot over vulnerable code is misplaced confidence. Each dot needs a linked final hash and independent review; these observations are not an individual calibration curve.</p>
      </section><section className="card"><h2>RQ1 · Paired participant scores</h2>
        <PairedBrierPlot pairs={pairedPoints} />
        <p className="small muted">Each task score averages its SQL and path Brier scores. A line appears only when all four feature ratings and security labels are assessable.</p>
      </section></div>
      <div className="grid two" style={{ marginTop: 16 }}><section className="card"><h2>RQ2 · Reviewed final security</h2>
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
        <p className="small muted">{judged.length} reviewed feature records linked to uploaded final hashes, out of {cells.length} assigned features. “Functional + secure” is a subset of secure. Missing and unassessable features are never counted as secure.</p></section>
        <section className="card"><h2>RQ1 · Confidence accuracy after review</h2>
          {scored.length ? <div className="table-wrap"><table><thead><tr><th>Condition</th><th>SQL mean Brier</th><th>Path mean Brier</th></tr></thead><tbody>
            {conditions.map((condition) => <tr key={condition}><td>{condition}</td>{(['sql', 'path'] as const).map((weakness) => {
              const subset = scored.filter((item) => item.task.condition === condition && item.record.weakness_class === weakness);
              return <td key={weakness}>{brierMean(subset.map((item) => item.brier!))} <span className="small muted">(n={subset.length})</span></td>;
            })}</tr>)}</tbody></table></div> : <div className="empty">No assessable reviewed feature has both a final rating and a functional security verdict.</div>}
          <p className="small muted">Lower Brier scores mean more accurate probabilities. These are descriptive feature means, not the paired participant estimate or a pure calibration measure.</p>
        </section></div>
      <section className="card" style={{ marginTop: 16 }}><h2>RQ1 · Paired confidence-accuracy estimate</h2>
        {paired ? <p><strong>{paired.mean_difference.toFixed(3)}</strong> mean Brier difference, acceleration minus exploration;
          {paired.lower_95 === null ? ' interval withheld until at least three complete pairs;' :
            <> 95% participant-bootstrap interval <strong>{paired.lower_95.toFixed(3)} to {paired.upper_95!.toFixed(3)}</strong>;</>}
          {paired.participants} complete paired participants.</p>
          : <div className="empty">No participant yet has reviewed, assessable SQL and path outcomes with ratings in both conditions.</div>}
        <p className="small muted">Positive values mean less accurate security probabilities in acceleration. This estimate uses only complete assessable pairs and 10,000 fixed-seed participant resamples. Inspect missing and nonfunctional features before drawing a study conclusion; pilot estimates are feasibility information.</p></section>
      <section className="card" style={{ marginTop: 16 }}><h2>RQ1 · Confidence by assessed outcome</h2>
        <div className="table-wrap"><table><thead><tr><th>Condition</th><th>Final security</th><th>Rated features</th><th>Mean belief secure</th></tr></thead><tbody>
          {conditions.flatMap((condition) => (['target_secure', 'vulnerable'] as const).map((status) => {
            const subset = judged.filter((item) => item.task.condition === condition &&
              item.record.resolved_security === status && item.probability !== null);
            return <tr key={`${condition}/${status}`}><td>{condition}</td><td>{status}</td><td>{subset.length}</td>
              <td>{subset.length ? `${average(subset.map((item) => item.probability!))}%` : '—'}</td></tr>;
          }))}</tbody></table></div>
        <p className="small muted">High confidence on vulnerable code is especially relevant to misplaced security confidence. Sparse or one-class outcomes cannot establish general calibration or discrimination.</p></section>
      <section className="card" style={{ marginTop: 16 }}><h2>RQ2 · All assigned final features</h2>
        <OutcomeStackPlot rows={conditions.map((condition) => { const subset = cells.filter((item) => item.task.condition === condition);
          return { condition, secure: subset.filter((item) => item.status === 'target_secure').length,
            vulnerable: subset.filter((item) => item.status === 'vulnerable').length,
            other: subset.filter((item) => ['not_implemented', 'unassessable'].includes(item.status)).length,
            pending: subset.filter((item) => item.status === 'pending').length }; })} />
        <div className="table-wrap"><table><thead><tr><th>Condition</th><th>Assigned</th><th>Secure</th><th>Vulnerable</th><th>Not implemented</th><th>Unassessable</th><th>Pending</th><th>Functional + secure</th></tr></thead><tbody>
          {conditions.map((condition) => { const subset = cells.filter((item) => item.task.condition === condition);
            const count = (status: string) => subset.filter((item) => item.status === status).length;
            return <tr key={condition}><td>{condition}</td><td>{subset.length}</td><td>{count('target_secure')}</td>
              <td>{count('vulnerable')}</td><td>{count('not_implemented')}</td><td>{count('unassessable')}</td>
              <td>{count('pending')}</td><td>{subset.filter((item) => item.functional_secure).length}</td></tr>; })}
        </tbody></table></div>
        <p className="small muted">These are final-code outcomes across every assigned SQL/path feature. A removed or unfinished feature is not a secure success. No claim about agent causation follows from this table.</p>
        {pairedVulnerable ? <p>Complete assessable pairs: <strong>{pairedVulnerable.participants}</strong>. Mean acceleration minus exploration vulnerable-feature count: <strong>{pairedVulnerable.mean_difference.toFixed(2)}</strong>
          {pairedVulnerable.lower_95 === null ? ' (interval withheld until at least three pairs).' :
            <> (95% participant-bootstrap interval {pairedVulnerable.lower_95.toFixed(2)} to {pairedVulnerable.upper_95!.toFixed(2)}).</>}</p>
          : <p>No participant has four assessable final-feature outcomes yet; a paired vulnerability difference is unavailable.</p>}</section>
      <section className="card" style={{ marginTop: 16 }}><h2>RQ3 · Coded behaviour and verification</h2>
        <p>The portal cannot infer intent, inspection, security checks or conscious acceptance from ZIPs. Reconcile these from video, transcript, snapshots and replay, then import the completed coding tables. Agent-only actions stay separate from human-reviewed checks.</p>
        <CodedReportUpload phase={phase} />
        {coded && !coded.current && <p className="alert">The latest coding report is out of date: task or final-review data changed after it was calculated. Import updated coding tables to refresh these plots.</p>}
        {coded?.current && <><p className="small muted">Current coded report: {coded.report.coverage.participants} participants, {coded.report.coverage.tasks} tasks. Source hashes and all five submitted coding tables are retained with run {coded.run}.</p>
          <div className="grid two"><div><h3>Observed mode by assigned condition</h3><BarChart max={100} rows={coded.report.rq1.observed_mode_by_condition.flatMap((item) => [
            ...(item.mean_task_acceleration_share === null ? [] : [{ label: `${item.condition} · acceleration share (n=${item.complete_tasks})`, value: Math.round(item.mean_task_acceleration_share * 100) }]),
            ...(item.mean_task_exploration_share === null ? [] : [{ label: `${item.condition} · exploration share (n=${item.complete_tasks})`, value: Math.round(item.mean_task_exploration_share * 100) }])
          ])} /><p className="small muted">Mean task share of coded active time; mixed/unclear episodes remain outside these two bars.</p></div>
          <div><h3>Human-reviewed security checks</h3><BarChart rows={coded.report.rq3.checks_by_condition.flatMap((item) => [
            { label: `${item.condition} · before agent application`, value: item.before_application },
            { label: `${item.condition} · after application, before continuation`, value: item.after_application_before_continuation },
            { label: `${item.condition} · after continuation`, value: item.after_continuation }
          ])} /><p className="small muted">Events, not participants. Complete check-coded tasks: {coded.report.rq3.checks_by_condition.map((item) => `${item.condition} ${item.coded_tasks}`).join(' · ')}.</p></div></div>
          <div className="grid two" style={{ marginTop: 18 }}><div><h3>Confirmed insecure agent exposures</h3>
            <BarChart rows={coded.report.rq2.confirmed_exposure_flow.flatMap((item) => [
              { label: `${item.condition} · survived`, value: item.final_survival_yes },
              { label: `${item.condition} · removed`, value: item.final_survival_no },
              { label: `${item.condition} · unresolved`, value: item.final_survival_unclear }
            ])} /><p className="small muted">Conditional on confirmed visible agent-origin insecure changes; zero exposures provide no retention estimate.</p></div>
            <div><h3>Reviewed check and final vulnerability</h3><div className="table-wrap"><table><thead><tr><th>Condition</th><th>Class</th><th>Check?</th><th>Security</th><th>Features</th></tr></thead><tbody>
              {coded.report.rq3.reviewed_security_check_vs_final_security.map((item, index) => <tr key={index}><td>{item.condition}</td><td>{item.class}</td>
                <td>{item.reviewed_check ? 'Yes' : 'No'}</td><td>{item.final_security}</td><td>{item.features}</td></tr>)}</tbody></table></div>
              <p className="small muted">Descriptive association; skill and suspicion may influence both checking and outcome.</p></div></div>
          {coded.report.warnings.length > 0 && <details><summary>{coded.report.warnings.length} analysis warnings</summary><ul>{coded.report.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
        </>}
        {!coded && <p className="small muted">No completed coding report for this phase yet. Use the <Link href="/researcher/research?doc=NATURAL_ANALYSIS_PLAN.md">analysis plan</Link> and coding templates; an empty check table is not a zero-check observation until coding status is complete.</p>}
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>Code change activity from submitted ZIPs</h2>
        <CodeChangePlot rows={changedCode} />
        <p className="small muted">{changedCode.length}/{rows.filter((row) => row.submitted).length} submitted tasks have a verified code summary. Counts come from the uploaded initial snapshot, intermediate snapshot manifests and final ZIP. They are descriptive activity measures, not RQ3 security checks or agent acceptance.</p>
        {rows.filter((row) => codeMetrics.get(row.task_id)?.error).length > 0 &&
          <p className="alert">Some submitted tasks lack usable ZIP summaries. Open their task evidence pages for the reason.</p>}
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>RQ4 · SQL and path traversal</h2>
        <div className="table-wrap"><table><thead><tr><th>Condition</th><th>Class</th><th>Assigned</th><th>Secure</th><th>Vulnerable</th><th>Other or pending</th><th>Scored</th><th>Mean Brier</th></tr></thead><tbody>
          {conditions.flatMap((condition) => targetClasses.map((weakness) => {
            const subset = cells.filter((item) => item.task.condition === condition && item.weakness === weakness);
            const scores = subset.flatMap((item) => item.item?.brier === null || item.item?.brier === undefined
              ? [] : [item.item.brier]);
            const secure = subset.filter((item) => item.status === 'target_secure').length;
            const vulnerable = subset.filter((item) => item.status === 'vulnerable').length;
            return <tr key={`${condition}/${weakness}`}><td>{condition}</td><td>{weakness === 'sql' ? 'SQL injection' : 'Path traversal'}</td>
              <td>{subset.length}</td><td>{secure}</td><td>{vulnerable}</td>
              <td>{subset.length - secure - vulnerable}</td><td>{scores.length}</td><td>{brierMean(scores)}</td></tr>;
          }))}</tbody></table></div>
        {coded?.current && <><h3>Class-specific coded process</h3><div className="table-wrap"><table><thead><tr><th>Condition</th><th>Class</th><th>Check-coded tasks</th><th>Reviewed security checks</th><th>Agent exposures</th><th>Exposures surviving</th></tr></thead><tbody>
          {coded.report.rq4.by_condition_and_class.map((item) => <tr key={`${item.condition}/${item.class}`}><td>{item.condition}</td><td>{item.class}</td>
            <td>{item.check_coded_tasks}</td><td>{item.reviewed_security_checks}</td>
            <td>{item.confirmed_agent_origin_exposures}</td><td>{item.exposures_surviving}</td></tr>)}
        </tbody></table></div></>}
        <p className="small muted">The class comparison is exploratory. Different case counts or task difficulty can explain an apparent contrast; use the coded exposure and check records to interpret it.</p></section>
      <section className="card" style={{ marginTop: 16 }}><h2>Task-level audit trail</h2>
        {rows.length ? <div className="table-wrap"><table><thead><tr><th>Participant</th><th>Task</th><th>Condition</th><th>Status</th><th>Files</th><th>Snapshots</th><th>Changed source files</th><th>Source lines +/−</th><th>Agent records</th><th>Rating hash</th><th>SQL belief</th><th>Path belief</th><th>SQL review</th><th>Path review</th><th>Code</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.task_id}><td><Link href={`/researcher/analytics/${row.participant_code}`}>{row.participant_code}</Link></td>
            <td>T{row.order} · {row.project}</td><td>{row.condition}</td><td>{row.submitted ? 'Submitted' : 'In progress'}</td>
            <td>{row.uploaded}/6{row.issues.length || row.warnings.length ? ' · check' : ''}</td>
            <td>{row.snapshot_count ?? '—'}</td>
            <td>{codeMetrics.get(row.task_id)?.metrics?.source_files_changed ?? '—'}</td>
            <td>{codeMetrics.get(row.task_id)?.metrics ?
              `+${codeMetrics.get(row.task_id)!.metrics!.source_lines_added} / −${codeMetrics.get(row.task_id)!.metrics!.source_lines_removed}` : '—'}</td>
            <td>{row.agent_records ?? '—'}</td>
            <td>{row.rating_linked ? 'Matched' : 'Missing/mismatch'}</td>
            <td>{row.sql_probability === null ? '—' : `${row.sql_probability}%`}</td>
            <td>{row.path_probability === null ? '—' : `${row.path_probability}%`}</td>
            <td>{verdicts.get(`${row.task_id}/sql`)?.resolved_security || 'Pending'}</td>
            <td>{verdicts.get(`${row.task_id}/path`)?.resolved_security || 'Pending'}</td>
            <td><Link href={`/researcher/evidence/${row.participant_code}/${row.task_id}`}>Timeline</Link></td></tr>)}</tbody></table></div>
          : <div className="empty">No assigned tasks in this phase.</div>}
      </section>
      <section className="card" style={{ marginTop: 16 }}><h2>Interpretation boundary</h2>
        <p>Reviewed security outcomes come from researcher-entered records of two independent assessments, never from upload presence. The conditions change both task guidance and interface familiarity; this page cannot attribute differences to a pure mental-state effect. Rehearsal and pilot phases support feasibility checks. Use the <Link href="/researcher/research?doc=NATURAL_ANALYSIS_PLAN.md">analysis plan</Link> for the main participant-paired estimates and missing-data rules.</p>
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
