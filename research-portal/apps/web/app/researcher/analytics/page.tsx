import { Shell } from '@/components/Shell';
import { BarChart } from '@/components/BarChart';
import { serverApi } from '@/lib/server-api';
import type { StudyUser } from '@/lib/types';

type Analytics = {
  latestSummary: { summary: Record<string, unknown>; created_at: string } | null;
  byCondition: { condition: string; exposed: number; scored: number; mean_brier: string | null; vulnerable_exposed: number; target_retained: number }[];
  byClass: { weakness_class: string; exposed: number; mean_brier: string | null }[];
  eventsByDay: { day: string; count: number }[];
  participantCoverage: { participant_code: string; tasks: number; responses: number; events: number }[];
};
export default async function AnalyticsPage() {
  const user = await serverApi<StudyUser>('auth/me');
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
