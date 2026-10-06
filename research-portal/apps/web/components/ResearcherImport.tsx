'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ResearcherImport({ participants }: { participants: { id: string; participant_code: string }[] }) {
  const router = useRouter();
  const [kind, setKind] = useState('events_json');
  const [participantId, setParticipantId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError(''); setBusy(true);
    const file = new FormData(event.currentTarget).get('file') as File;
    if (!file || file.size > 5 * 1024 * 1024) { setError('Choose a file under 5 MB.'); setBusy(false); return; }
    try {
      const response = await fetch('/api/backend/researcher/imports', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, filename: file.name, content: await file.text(), participantId: participantId || undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Import failed');
      setMessage(`Imported ${data.imported_count} records. SHA-256: ${data.sha256}`);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Import failed'); }
    finally { setBusy(false); }
  }
  return <form className="card stack" onSubmit={submit}><h2>Import a study file</h2>
    <div className="grid two"><label>File type<select value={kind} onChange={(event) => setKind(event.target.value)}>
      <option value="events_json">IDE events JSON</option><option value="events_jsonl">IDE events JSONL</option>
      <option value="analysis_summary">Analysis summary.json</option><option value="opportunities_csv">Adjudicated opportunities.csv</option></select></label>
      {kind.startsWith('events_') && <label>Participant<select required value={participantId} onChange={(event) => setParticipantId(event.target.value)}>
        <option value="">Select participant</option>{participants.map((row) => <option key={row.id} value={row.id}>{row.participant_code}</option>)}</select></label>}</div>
    <label>File<input type="file" accept=".json,.jsonl,.csv" required name="file" /></label>
    <button className="button" disabled={busy}>{busy ? 'Importing…' : 'Import file'}</button>
    <p className="small muted">Event imports must match the participant code and assigned task IDs. Analysis files come from the existing adjudication pipeline.</p>
    {error && <p className="alert error" role="alert">{error}</p>}{message && <p className="alert success" role="status">{message}</p>}
  </form>;
}
