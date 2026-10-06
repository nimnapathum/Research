'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudyTask } from '@/lib/types';

export function EventUpload({ tasks }: { tasks: StudyTask[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const file = form.get('file') as File;
    if (!file || file.size > 5 * 1024 * 1024) { setError('Choose a JSON or JSONL file smaller than 5 MB.'); setBusy(false); return; }
    const kind = file.name.toLowerCase().endsWith('.jsonl') ? 'events_jsonl' : 'events_json';
    try {
      const response = await fetch('/api/backend/participant/imports', { method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, filename: file.name, content: await file.text(),
          taskId: form.get('taskId') || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Import failed');
      setMessage(`Imported ${result.imported_count} new events. File hash: ${result.sha256}`);
      router.refresh();
    } catch (failure) { setError((failure as Error).message); }
    setBusy(false);
  }
  return <form onSubmit={submit} className="card" style={{ maxWidth: 700 }}>
    <div className="form-field"><label htmlFor="event-file">IDE event export (.json or .jsonl)</label>
      <input id="event-file" name="file" type="file" accept=".json,.jsonl,application/json" required /></div>
    <div className="form-field"><label htmlFor="taskId">Task</label><select id="taskId" name="taskId" defaultValue="">
      <option value="">Detect from event task IDs</option>{tasks.map((task) =>
        <option key={task.id} value={task.id}>{task.external_task_id} · {task.condition}</option>)}</select></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {message && <div className="alert success" role="status">{message}</div>}
    <button className="button" disabled={busy}>{busy ? 'Importing…' : 'Import events'}</button>
    <p className="small muted">Only your participant code is accepted. Duplicate events are ignored. Uploads are stored in the restricted study database.</p>
  </form>;
}
