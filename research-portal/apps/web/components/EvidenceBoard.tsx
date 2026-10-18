'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type Status = { missing: string[]; issues: string[]; ready: boolean };
type Recording = { id: string; drive_url: string; label: string; notes: string; created_at: string };
type Row = { code: string; phase: string; recordings: Recording[]; tasks: { id: string; order: number; project: string;
  submitted: boolean; status: Status | null }[] };

export function EvidenceBoard({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'attention' | 'complete'>('all');
  const [phase, setPhase] = useState('all');
  const [open, setOpen] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const complete = (row: Row) => row.tasks.length === 2 && row.tasks.every((task) => task.status?.ready) && row.recordings.length > 0;
  const shown = useMemo(() => rows.filter((row) => (phase === 'all' || row.phase === phase) &&
    row.code.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filter === 'all' || (filter === 'complete' ? complete(row) : !complete(row)))), [rows, query, filter, phase]);
  async function addRecording(event: React.FormEvent, code: string) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch(`/api/backend/researcher/recordings/${code}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ driveUrl: url, label, notes })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not save recording link');
      setUrl(''); setLabel(''); setNotes(''); router.refresh();
    } catch (cause) { setError((cause as Error).message); }
    finally { setSaving(false); }
  }
  async function removeRecording(id: string) {
    if (!window.confirm('Remove this recording link from the portal?')) return;
    setError('');
    const response = await fetch(`/api/backend/researcher/recordings/${id}`, { method: 'DELETE' });
    if (response.ok) router.refresh(); else setError('Could not remove the link');
  }
  return <section className="card" style={{ marginTop: 16 }}>
    <div className="row"><div><h2>Participants</h2><p className="small muted">{rows.length} participants · {rows.filter(complete).length} with both evidence sets and a recording link</p></div>
      <span className="pill gray">{shown.length} shown</span></div>
    <div className="evidence-filters"><input aria-label="Search participant code" placeholder="Search participant code" value={query} onChange={(event) => setQuery(event.target.value)} />
      <select aria-label="Filter study phase" value={phase} onChange={(event) => setPhase(event.target.value)}>
        <option value="all">All phases</option><option value="rehearsal">Self rehearsal</option>
        <option value="pilot">Feasibility pilot</option><option value="main">Main study</option>
        <option value="legacy">Legacy unclassified</option>
      </select>
      <select aria-label="Filter evidence" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
        <option value="all">All</option><option value="attention">Needs attention</option><option value="complete">Files and link present</option>
      </select></div>
    {shown.length ? <div className="evidence-list">{shown.map((row) => <div className="evidence-item" key={row.code}>
      <button className="evidence-toggle" type="button" aria-expanded={open === row.code} onClick={() => { setOpen(open === row.code ? null : row.code); setError(''); }}>
        <span><strong>{row.code}</strong><small>{row.phase} · {row.tasks.map((task) => `T${task.order} ${task.status ? `${6 - task.status.missing.length}/6` : '—'}`).join(' · ')} · {row.recordings.length} recording link{row.recordings.length === 1 ? '' : 's'}</small></span>
        <span className={`pill ${complete(row) ? 'good' : 'gray'}`}>{complete(row) ? 'Files linked' : 'Review needed'}</span>
      </button>
      {open === row.code && <div className="evidence-expanded">
        <p><Link className="button secondary" href={`/researcher/analytics/${row.code}`}>Open participant analysis</Link></p>
        <div className="evidence-task-grid">{row.tasks.map((task) => <div className="evidence-task" key={task.id}>
          <strong>Task {task.order} · {task.project === 'A' ? 'Resource catalogue' : 'Support archive'}</strong>
          <span className="small muted">{task.submitted ? 'submitted' : 'in progress'}</span>
          <p className="small">{task.status ? `${6 - task.status.missing.length}/6 files · ${task.status.issues.length} integrity issue(s)` : 'Earlier assignment'}</p>
          {task.status && <Link className="button secondary" href={`/researcher/evidence/${row.code}/${task.id}`}>Open evidence and code review</Link>}
        </div>)}</div>
        <h3>Google Meet recording</h3><p className="small muted">Researcher-managed links are separate from participant uploads. Verify access and note task time ranges below.</p>
        {row.recordings.map((recording) => <div className="row evidence-recording" key={recording.id}>
          <div><a href={recording.drive_url} target="_blank" rel="noopener noreferrer">{recording.label || 'Open Drive recording'}</a>
            {recording.notes && <p className="small">{recording.notes}</p>}</div>
          <button className="button secondary" type="button" onClick={() => void removeRecording(recording.id)}>Remove link</button>
        </div>)}
        <form className="evidence-recording-form" onSubmit={(event) => void addRecording(event, row.code)}>
          <label>Drive URL<input required type="url" placeholder="https://drive.google.com/file/d/…" value={url} onChange={(event) => setUrl(event.target.value)} /></label>
          <label>Label<input placeholder="Session recording" value={label} onChange={(event) => setLabel(event.target.value)} /></label>
          <label>Time notes<textarea placeholder="Task 1 starts at 00:00; Task 2 starts at …" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="button" disabled={saving}>{saving ? 'Saving…' : 'Add recording link'}</button>
        </form>
        {error && <p className="alert error" role="alert">{error}</p>}
      </div>}
    </div>)}</div> : <div className="empty">No participants match this search or filter.</div>}
  </section>;
}
