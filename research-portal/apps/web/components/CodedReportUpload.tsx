'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const names = [
  ['session_log', 'Session log'], ['coding_status', 'Coding status'],
  ['episodes', 'Mode episodes'], ['checks', 'Verification checks'],
  ['exposures', 'Agent-origin exposures']
] as const;

export function CodedReportUpload({ phase }: { phase: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    form.set('phase', phase);
    try {
      const response = await fetch('/api/researcher/natural-coded-report', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Coding tables could not be analysed');
      setMessage(`Calculated ${data.tasks} coded tasks for ${data.participants} participants. ${data.warnings} analysis warnings.`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Analysis failed'); }
    finally { setBusy(false); }
  }
  return <details className="coded-report-upload"><summary>Import completed coding tables</summary>
    <p className="small muted">The portal generates features.csv from the current phase, runs the existing read-only analysis script on these five reconciled CSVs, and keeps the inputs and report together. Keep each coder’s original sheets separately.</p>
    <form onSubmit={submit} className="coded-report-form">{names.map(([name, label]) =>
      <label key={name}>{label} CSV<input type="file" name={name} accept=".csv,text/csv" required /></label>)}
      <button className="button" type="submit" disabled={busy}>{busy ? 'Calculating…' : 'Calculate coded results'}</button>
    </form>{message && <p role="status" className="small">{message}</p>}
  </details>;
}
