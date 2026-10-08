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
  return <div className="subcard" aria-live="polite">
    <strong>Live study connection</strong>
    <p><span className={`pill ${status.connected ? 'good' : 'warn'}`}>
      {status.connected ? 'Study client connected' : 'Study client disconnected'}</span>{' '}
      <span className={`pill ${status.agent_capture_seen ? 'good' : 'gray'}`}>
        {status.agent_capture_seen ? 'Agent hook observed' : 'Waiting for agent activity'}</span>{' '}
      <span className={`pill ${status.pointer_capture_seen ? 'good' : 'gray'}`}>
        {status.pointer_capture_seen ? 'Optional pointer summaries received' : 'Optional pointer capture inactive'}</span></p>
    {status.next_checkpoint && <p className="small">Next checkpoint: <strong>{status.next_checkpoint}</strong></p>}
    {status.final_submitted && <p className="small">Final recorded code received.</p>}
    {error && <p className="small error" role="alert">Status could not refresh: {error}</p>}
  </div>;
}
