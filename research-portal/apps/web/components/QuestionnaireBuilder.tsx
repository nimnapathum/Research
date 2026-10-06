'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormItem, Questionnaire } from '@/lib/types';

type Row = Questionnaire & { slug: string; response_count: number };
export function QuestionnaireBuilder({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [stage, setStage] = useState('pre_task');
  const [items, setItems] = useState<FormItem[]>([{ id: 'q1', label: '', type: 'text', required: true, maxLength: 1000 }]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  function update(index: number, patch: Partial<FormItem>) {
    setItems((current) => current.map((item, position) => position === index ? { ...item, ...patch } : item));
  }
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/backend/researcher/questionnaires', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, stage, schema: { items } })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not save draft');
      setMessage('Draft saved. Review it below, then publish when ready.');
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save draft'); }
    finally { setBusy(false); }
  }
  async function publish(id: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/backend/researcher/questionnaires/${id}/publish`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not publish');
      setMessage('Questionnaire published. The prior published form for this stage is archived.');
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not publish'); }
    finally { setBusy(false); }
  }
  return <div className="stack"><form className="card stack" onSubmit={create}><h2>Create a questionnaire draft</h2>
    <div className="grid two"><label>Title<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Slug (reuse to create a new version)<input value={slug} placeholder="auto from title" onChange={(event) => setSlug(event.target.value)} /></label></div>
    <label>When shown<select value={stage} onChange={(event) => setStage(event.target.value)}>
      <option value="pre_task">Before tasks</option><option value="after_task">After each task</option>
      <option value="after_both">After both tasks</option><option value="interview">Interview</option></select></label>
    {items.map((item, index) => <div className="subcard stack" key={index}><div className="row"><strong>Question {index + 1}</strong>
      <button className="button secondary" type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, position) => position !== index))}>Remove</button></div>
      <div className="grid two"><label>Question ID<input required value={item.id} onChange={(event) => update(index, { id: event.target.value })} /></label>
        <label>Response type<select value={item.type} onChange={(event) => update(index, { type: event.target.value as FormItem['type'], maxLength: 1000, min: 1, max: 7, options: ['Yes', 'No'] })}>
          <option value="text">Text</option><option value="choice">Choice</option><option value="number">Number</option><option value="scale">Scale</option></select></label></div>
      <label>Question text<input required value={item.label} onChange={(event) => update(index, { label: event.target.value })} /></label>
      {item.type === 'choice' && <label>Options (one per line)<textarea value={(item.options || []).join('\n')}
        onChange={(event) => update(index, { options: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })} /></label>}
      {item.type === 'text' && <label>Maximum characters<input type="number" min="1" max="5000" value={item.maxLength ?? 1000}
        onChange={(event) => update(index, { maxLength: Number(event.target.value) })} /></label>}
      {(item.type === 'scale' || item.type === 'number') && <div className="grid two">
        <label>Minimum<input type="number" value={item.min ?? ''} onChange={(event) => update(index, { min: Number(event.target.value) })} /></label>
        <label>Maximum<input type="number" value={item.max ?? ''} onChange={(event) => update(index, { max: Number(event.target.value) })} /></label></div>}
      <label className="check"><input type="checkbox" checked={item.required !== false} onChange={(event) => update(index, { required: event.target.checked })} /> Required</label>
    </div>)}
    <div className="row"><button className="button secondary" type="button" onClick={() => setItems([...items, { id: `q${items.length + 1}`, label: '', type: 'text', required: true, maxLength: 1000 }])}>Add question</button>
      <button className="button" disabled={busy}>Save draft</button></div>
    <p className="small muted">Published forms are immutable. Reusing a slug creates a new version; publishing replaces the prior form for the same stage.</p>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
  </form>
  <section className="card"><h2>Existing questionnaires</h2>{rows.length ? <div className="table-wrap"><table><thead><tr>
    <th>Title</th><th>Stage</th><th>Version</th><th>Status</th><th>Responses</th><th>Action</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.id}><td>{row.title}<div className="small muted">{row.slug}</div></td><td>{row.stage}</td><td>{row.version}</td>
        <td>{row.status}</td><td>{row.response_count}</td><td>{row.status === 'draft' && <button className="button secondary" disabled={busy} onClick={() => publish(row.id)}>Publish</button>}</td></tr>)}
    </tbody></table></div> : <div className="empty">No questionnaires.</div>}</section></div>;
}
