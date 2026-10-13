'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import type { StudyTask } from '@/lib/types';

export function TaskCards({ tasks, access, natural = false }: { tasks: StudyTask[];
  access: Record<string, { allowed: boolean; reason?: string }>; natural?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  async function change(id: string, status: string) {
    setError('');
    const response = await fetch(`/api/backend/participant/tasks/${id}/status`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status })
    });
    if (!response.ok) { const data = await response.json(); setError(data.message || 'Could not update task'); return; }
    router.refresh();
  }
  return <div className="task-list">{error && <div className="alert error">{error}</div>}{tasks.map((task) =>
    <div className="task-card" key={task.id}><div className="row">
      <div><h3>Task {task.task_order}{!natural || access[task.id]?.allowed ? ` · ${task.project_id === 'A' ? 'Resource catalogue' : 'Support archive'}` : ''}</h3>
        <div className="meta"><span className="code">{task.external_task_id}</span> · {natural
          ? (access[task.id]?.allowed ? 'Read your work guidance on the task page' : 'Task details open when the previous steps are complete')
          : `${task.condition} orientation · checkpoints ${task.checkpoint_order.join(' → ')}`}</div>
      </div><span className={`pill ${task.status === 'submitted' ? 'good' : task.status === 'paused' ? 'warn' : 'gray'}`}>{task.status.replace('_', ' ')}</span>
    </div>{access[task.id]?.allowed ? <p><Link className="button" href={`/participant/tasks/${task.id}`}>Open task sheet and codebase</Link></p>
      : <p className="small muted">{access[task.id]?.reason}</p>}
      <div className="form-inline"><div className="form-field"><label htmlFor={`status-${task.id}`}>My progress</label>
      <select id={`status-${task.id}`} value={task.status} disabled={!access[task.id]?.allowed || task.status === 'submitted'} onChange={(event) => void change(task.id, event.target.value)}>
        <option value="not_started" disabled>Not started</option><option value="in_progress">In progress</option>
        <option value="paused">Paused</option><option value="submitted">Submitted</option>
      </select></div><p className="small muted">{natural ? 'Submit after all seven evidence receipts on the task page are complete.' : 'This marker helps you resume. The checkpoint app records the actual code submission.'}</p></div>
    </div>)}</div>;
}
