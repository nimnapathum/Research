'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Questionnaire } from '@/lib/types';

export function QuestionnaireForm({ form, taskId }: { form: Questionnaire; taskId?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const answered = form.responses?.some((response) => response.task_id === (taskId || null));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = new FormData(event.currentTarget);
    const answers: Record<string, unknown> = {};
    for (const item of form.schema_json.items) {
      const value = fields.get(item.id);
      if (value === null || value === '') continue;
      answers[item.id] = ['number','scale'].includes(item.type) ? Number(value) : String(value);
    }
    try {
      const response = await fetch('/api/backend/participant/responses', { method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionnaireId: form.id, taskId: taskId || undefined, answers }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not save response');
      router.push('/dashboard'); router.refresh();
    } catch (failure) { setError((failure as Error).message); setBusy(false); }
  }
  if (answered) return <div className="alert success">This questionnaire was already submitted for this task or session.</div>;
  return <form onSubmit={submit} className="card">
    {form.schema_json.items.map((item) => <div className="form-field" key={item.id}>
      <label htmlFor={item.id}>{item.label}{item.required ? ' *' : ''}</label>
      {item.type === 'choice' ? <select id={item.id} name={item.id} required={item.required} defaultValue="">
        <option value="">Select an answer</option>{item.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select>
        : item.type === 'text' ? <textarea id={item.id} name={item.id} maxLength={item.maxLength} required={item.required} />
        : <input id={item.id} name={item.id} type="number" min={item.min} max={item.max}
          step={item.type === 'scale' ? 1 : 'any'} required={item.required} />}
      {item.anchors && <small>{item.min}: {item.anchors[String(item.min)]} · {item.max}: {item.anchors[String(item.max)]}</small>}
    </div>)}
    {error && <div className="alert error" role="alert">{error}</div>}
    <button className="button" disabled={busy}>{busy ? 'Saving…' : 'Submit answers'}</button>
    <p className="small muted">Your response is saved once. Contact the researcher if a correction is needed.</p>
  </form>;
}
