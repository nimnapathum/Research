'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { NaturalAssessment } from '@/lib/natural-analysis';

const security = [
  ['target_secure', 'Target secure'], ['vulnerable', 'Vulnerable'],
  ['not_implemented', 'Not implemented'], ['unassessable', 'Unassessable']
] as const;
const functionality = [
  ['pass', 'Pass'], ['fail', 'Fail'], ['not_implemented', 'Not implemented'], ['unassessable', 'Unassessable']
] as const;
type Review = { reviewerCode: string; security: string; functionality: string; inferredCondition: boolean };
const blank = (): Review => ({ reviewerCode: '', security: '', functionality: '', inferredCondition: false });

export function AssessmentEntry({ taskDbId, finalHash, current }: {
  taskDbId: string; finalHash: string; current: NaturalAssessment[] }) {
  const router = useRouter();
  const [weaknessClass, setClass] = useState<'sql' | 'path'>('sql');
  const [reviews, setReviews] = useState<Review[]>([blank(), blank()]);
  const [resolvedSecurity, setResolvedSecurity] = useState('');
  const [resolvedFunctionality, setResolvedFunctionality] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const update = (index: number, change: Partial<Review>) => setReviews((rows) => rows.map((row, at) =>
    at === index ? { ...row, ...change } : row));
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/backend/researcher/natural-assessments', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId: taskDbId, weaknessClass, finalHash, reviews,
          resolvedSecurity, resolvedFunctionality, resolutionNote })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not save assessment');
      setSuccess(`Saved the ${weaknessClass.toUpperCase()} assessment. Earlier versions remain in the researcher JSON export.`);
      router.refresh();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="card" style={{ marginTop: 16 }}><h2>Independent review record</h2>
    <p>Record two completed, separate code reviews after the reviewers have assessed the final hash without participant ratings or condition labels. Use coded reviewer IDs. This form records their judgments and the resolved label; it does not perform the reviews.</p>
    {current.length > 0 && <div className="table-wrap"><table><thead><tr><th>Class</th><th>Security</th><th>Functionality</th><th>Recorded</th><th>Two reviews</th></tr></thead><tbody>
      {current.map((row) => <tr key={row.id}><td>{row.weakness_class.toUpperCase()}</td>
        <td>{row.resolved_security}</td><td>{row.resolved_functionality}</td><td>{new Date(row.created_at).toLocaleString()}</td>
        <td><details><summary>View provenance</summary>{row.review_data.map((item) => <p className="small" key={item.reviewerCode}>
          {item.reviewerCode}: {item.security}, {item.functionality}{item.inferredCondition ? ' · inferred condition' : ''}</p>)}
          {row.resolution_note && <p className="small">Resolution: {row.resolution_note}</p>}</details></td></tr>)}</tbody></table></div>}
    <details style={{ marginTop: 14 }}><summary>Record or correct a reviewed outcome</summary>
      <form onSubmit={(event) => void save(event)} className="assessment-form">
        <p className="small muted">Final code hash: <code>{finalHash}</code>. A correction creates a new version; the earlier review is retained.</p>
        <label>Vulnerability class<select value={weaknessClass} onChange={(event) => setClass(event.target.value as 'sql' | 'path')}>
          <option value="sql">SQL injection</option><option value="path">Path traversal</option></select></label>
        <div className="grid two">{reviews.map((review, index) => <fieldset key={index}><legend>Reviewer {index + 1}</legend>
          <label>Reviewer code<input required maxLength={50} pattern="[A-Za-z0-9_-]{2,50}" value={review.reviewerCode}
            onChange={(event) => update(index, { reviewerCode: event.target.value })} /></label>
          <label>Security<select required value={review.security} onChange={(event) => update(index, { security: event.target.value })}>
            <option value="">Choose</option>{security.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Functionality<select required value={review.functionality} onChange={(event) => update(index, { functionality: event.target.value })}>
            <option value="">Choose</option>{functionality.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="assessment-check"><input type="checkbox" checked={review.inferredCondition}
            onChange={(event) => update(index, { inferredCondition: event.target.checked })} /> Reviewer inferred the assigned condition</label>
        </fieldset>)}</div>
        <div className="grid two"><label>Resolved security<select required value={resolvedSecurity} onChange={(event) => setResolvedSecurity(event.target.value)}>
          <option value="">Choose</option>{security.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Resolved functionality<select required value={resolvedFunctionality} onChange={(event) => setResolvedFunctionality(event.target.value)}>
            <option value="">Choose</option>{functionality.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
        <label>Resolution evidence or disagreement note<textarea required minLength={10} maxLength={2000} value={resolutionNote}
          onChange={(event) => setResolutionNote(event.target.value)} placeholder="Record the probe report, review evidence, and how any disagreement was resolved." /></label>
        <button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save reviewed outcome'}</button>
        {error && <p className="alert error" role="alert">{error}</p>}{success && <p className="alert success" role="status">{success}</p>}
      </form>
    </details>
  </section>;
}
