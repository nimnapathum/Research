'use client';
import { useState } from 'react';
import Link from 'next/link';

type Receipt = { filename: string; size_bytes: number; sha256: string; received_at: string };
type EvidenceStatus = { items: Record<string, Receipt | null>; missing: string[]; issues: string[]; ready: boolean; rating_ready: boolean;
  warnings?: string[]; agent_capture?: { format?: string; status?: string; transcript_records?: number; hook_events?: number } | null };
const kinds = [
  ['final_manifest', 'Final snapshot manifest', 'Select TASK-final/SNAPSHOT_MANIFEST.json.'],
  ['rating_json', 'Final security rating', 'Select TASK-rating.json, recorded before researcher assessment feedback.'],
  ['capture_zip', 'Code history ZIP', 'Compress the entire TASK-capture folder after stopping its watcher.'],
  ['capture_health', 'Capture health JSON', 'Select TASK-capture/CAPTURE_HEALTH.json.'],
  ['final_zip', 'Final code ZIP', 'Compress the entire TASK-final folder.'],
  ['agent_transcript', 'Agent transcript', 'For an observer-enabled task, select TASK-agent/AGENT_TRANSCRIPT.jsonl after stopping its watcher. Otherwise use the researcher-approved conversation export.']
] as const;
const labelFor = (kind: string) => kinds.find((item) => item[0] === kind)?.[1] || kind;

export function NaturalEvidenceUpload({ taskId, externalTaskId, afterTaskFormId, afterTaskCompleted = false, initial }: {
  taskId: string; externalTaskId: string; afterTaskFormId?: string; afterTaskCompleted?: boolean; initial: EvidenceStatus }) {
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function upload(kind: string, file: File | undefined) {
    if (!file) return;
    setBusy(kind); setError('');
    try {
      const response = await fetch(`/api/participant/tasks/${taskId}/evidence?kind=${kind}`, {
        method: 'PUT', headers: { 'x-filename': encodeURIComponent(file.name) }, body: file
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      const current = await fetch(`/api/participant/tasks/${taskId}/evidence`, { cache: 'no-store' });
      if (!current.ok) throw new Error('Upload saved, but receipt status could not be loaded');
      setStatus(await current.json());
    } catch (failure) { setError(`${labelFor(kind)}: ${(failure as Error).message}`); }
    finally { setBusy(''); }
  }
  return <section className="card" id="evidence"><h2>3. Upload evidence and finish the form</h2>
    <p>Upload the final manifest and rating first, then answer the short after-task form while the task is fresh in your memory. Upload the larger files afterward. Keep your originals until the researcher checks them.</p>
    {afterTaskCompleted && <p className="alert success">Your after-task answers are saved. Finish the remaining uploads, then mark the task submitted on the overview.</p>}
    {status.rating_ready && afterTaskFormId && !afterTaskCompleted && <p><Link className="button" href={`/forms/${afterTaskFormId}?task=${taskId}`}>Complete the after-task questions now</Link></p>}
    <p className="small">A receipt confirms storage, not capture quality. The researcher records the Google Meet session separately. Contact the researcher if you selected the wrong file; do not upload a substitute or empty placeholder.</p>
    <div className="stack">{kinds.map(([kind, label, help]) => {
      const saved = status.items[kind];
      return <div className="row" key={kind}><div><strong>{label}</strong><p className="small muted">{help.replaceAll('TASK', externalTaskId)}</p>
        {saved && <p className="small">Received: {saved.filename} · {(saved.size_bytes / 1024 / 1024).toFixed(2)} MiB<br/>
          <span className="code">SHA-256 {saved.sha256}</span></p>}</div>
        <div><input type="file" aria-label={`Upload ${label}`} disabled={Boolean(saved) || Boolean(busy)}
          accept={kind.endsWith('_zip') ? '.zip' : ['capture_health','final_manifest','rating_json'].includes(kind) ? '.json' : undefined}
          onChange={(event) => void upload(kind, event.currentTarget.files?.[0])} /></div></div>;
    })}</div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {busy && <p role="status">Uploading {labelFor(busy)}… Keep this page open.</p>}
    {status.agent_capture?.format === 'study_observer' && <p className="small">Agent observer: {status.agent_capture.status} · {status.agent_capture.transcript_records} transcript records · {status.agent_capture.hook_events} hook events. Record counts are not necessarily prompt counts.</p>}
    {status.warnings?.map((warning) => <div className="alert" role="status" key={warning}>{warning}</div>)}
    <div className={`alert ${status.ready ? 'success' : ''}`} role="status">
      {status.ready ? 'All six files were received. The rating matches the separately uploaded final manifest; the researcher must still verify the ZIP contents and evidence quality.'
        : `Evidence incomplete: ${status.missing.length ? status.missing.map(labelFor).join(', ') : 'check issues below'}.`}
      {status.issues.map((issue) => <p key={issue}>{issue}</p>)}
    </div>
  </section>;
}
