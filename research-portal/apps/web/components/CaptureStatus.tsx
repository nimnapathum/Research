'use client';

import { useEffect, useState } from 'react';
import type { CheckpointStatus } from '@/lib/checkpoint-bridge';

export function CaptureStatus({ taskId, initial }: { taskId: string; initial: CheckpointStatus }) {
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/api/participant/tasks/${taskId}/capture-status`, { cache: 'no-store' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Could not check capture status');
        if (active) { setStatus(body); setError(''); }
      } catch (cause) { if (active) setError((cause as Error).message); }
    }
    const timer = setInterval(() => void refresh(), 5000);
    return () => { active = false; clearInterval(timer); };
  }, [taskId]);
  const guidance = status.final_submitted ? 'Final recorded code received. Complete the portal steps below.'
    : !status.connected ? 'Run node study/client.mjs in the recorded project and leave it open.'
      : !status.agent_capture_seen ? 'Ask the agent to inspect a file or run a test, then check again.'
        : `Capture is ready. Continue in the checkpoint study page${status.next_checkpoint ? ` at ${status.next_checkpoint}` : ''}.`;
  return <div className="capture-status">
    <div className="capture-indicators"><div><span>Study client</span><strong className={status.connected ? 'good' : 'warn'}>
      {status.connected ? 'Connected' : 'Not connected'}</strong></div>
      <div><span>Agent hook</span><strong className={status.agent_capture_seen ? 'good' : 'muted'}>
        {status.agent_capture_seen ? 'Observed' : 'Waiting for activity'}</strong></div></div>
    <p className="small" role="status" aria-live="polite">{guidance}</p>
    {status.pointer_capture_seen && <p className="small muted">Optional pointer summaries received.</p>}
    <p className="small muted">Checks every five seconds.</p>
    {error && <p className="small error" role="alert">Status could not refresh: {error}</p>}
  </div>;
}
