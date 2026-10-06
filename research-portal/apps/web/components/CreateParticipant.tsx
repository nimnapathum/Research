'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateParticipant() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [firstProject, setFirstProject] = useState<'A' | 'B'>('A');
  const [firstCondition, setFirstCondition] = useState<'acceleration' | 'exploration'>('acceleration');
  const [firstOrder, setFirstOrder] = useState('Q1,Q2,F1,F2');
  const [secondOrder, setSecondOrder] = useState('Q1,Q2,F1,F2');
  const [credential, setCredential] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setCredential('');
    const participantCode = code.trim().toUpperCase();
    const orders = [firstOrder, secondOrder].map((value) => value.toUpperCase().split(',').map((item) => item.trim()));
    const tasks = [1, 2].map((taskOrder) => ({
      projectId: taskOrder === 1 ? firstProject : firstProject === 'A' ? 'B' : 'A',
      condition: taskOrder === 1 ? firstCondition : firstCondition === 'acceleration' ? 'exploration' : 'acceleration',
      taskOrder, externalTaskId: `${participantCode}-T${taskOrder}`, checkpointOrder: orders[taskOrder - 1]
    }));
    try {
      const response = await fetch('/api/backend/researcher/participants', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, participantCode, tasks })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create participant');
      setCredential(data.temporary_password);
      setEmail(''); setCode(''); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create participant'); }
    finally { setBusy(false); }
  }
  return <form className="card stack" onSubmit={submit}>
    <h2>Add participant</h2><p className="small">Create one acceleration and one exploration assignment. Match the task ID and checkpoint order in the checkpoint app.</p>
    <div className="grid two"><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Participant code<input required pattern="P[0-9]{3,}" placeholder="P001" value={code} onChange={(event) => setCode(event.target.value)} /></label></div>
    <div className="grid two"><label>First task project<select value={firstProject} onChange={(event) => setFirstProject(event.target.value as 'A' | 'B')}>
      <option value="A">A · SQL injection</option><option value="B">B · Path traversal</option></select></label>
      <label>First task condition<select value={firstCondition} onChange={(event) => setFirstCondition(event.target.value as 'acceleration' | 'exploration')}>
        <option value="acceleration">Acceleration</option><option value="exploration">Exploration</option></select></label></div>
    <div className="grid two"><label>First task checkpoint order<input required value={firstOrder} onChange={(event) => setFirstOrder(event.target.value)} /></label>
      <label>Second task checkpoint order<input required value={secondOrder} onChange={(event) => setSecondOrder(event.target.value)} /></label></div>
    <p className="small muted">Second task receives the other project and condition. Orders must each contain Q1, Q2, F1, F2 once.</p>
    <button className="button" disabled={busy}>{busy ? 'Creating…' : 'Create account and tasks'}</button>
    {error && <p className="error" role="alert">{error}</p>}
    {credential && <div className="notice" role="status"><strong>Temporary password (shown once):</strong> <span className="code">{credential}</span>
      <p>Give this to the participant securely and ask them to change it in Account.</p></div>}
  </form>;
}
