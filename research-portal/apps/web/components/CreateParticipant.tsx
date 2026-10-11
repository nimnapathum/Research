'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Assignment = { task_id: string; project_id: 'A' | 'B'; condition: 'acceleration' | 'exploration';
  task_order: number; checkpoint_order: string[] };
type Created = { username: string; participant_code: string; temporary_password: string; tasks: Assignment[] };

export function CreateParticipant() {
  const router = useRouter();
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setCreated(null);
    try {
      const response = await fetch('/api/backend/researcher/participants', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create participant');
      setCreated(data); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create participant'); }
    finally { setBusy(false); }
  }
  return <section className="card creation-card">
    <div className="creation-intro"><div><p className="eyebrow">One step allocation</p><h2>Add participant</h2>
      <p>Create a pseudonymous username, password, and two balanced task assignments in one step.</p></div>
      <div className="creation-badge">2 tasks<br/><small>1 of each condition</small></div></div>
    <form className="creation-form" onSubmit={submit}>
      <button className="button" disabled={busy}>{busy ? 'Creating assignment…' : 'Create participant and tasks'}</button>
    </form>
    {error && <p className="alert error" role="alert">{error}</p>}
    {created && <div className="credential-panel" role="status">
      <div><p className="eyebrow">Give these details privately</p><h3>{created.participant_code} is ready</h3>
        <p>The password is shown once. Save it before leaving this page.</p></div>
      <div className="credential-grid"><div><span>Username</span><strong className="code">{created.username}</strong></div>
        <div><span>Temporary password</span><strong className="code">{created.temporary_password}</strong></div></div>
      <div className="assignment-preview">{created.tasks.map((task) => <div key={task.task_id}>
        <strong>Task {task.task_order}</strong><span>Project {task.project_id} · {task.condition}</span>
        <small>Checkpoint order: {task.checkpoint_order.join(' → ')}</small></div>)}</div>
    </div>}
  </section>;
}
