import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shell } from '@/components/Shell';
import { CaptureStatus } from '@/components/CaptureStatus';
import { checkpointAvailable, checkpointInput, checkpointJson, portalPreAnswers, type CheckpointStatus } from '@/lib/checkpoint-bridge';
import { serverApi } from '@/lib/server-api';
import { taskAccess } from '@/lib/task-access';
import { taskSheets } from '@/lib/starter-package';
import type { ParticipantDashboard, StudyUser } from '@/lib/types';
import { cookies } from 'next/headers';

export default async function ParticipantTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'participant') redirect('/dashboard');
  const { id } = await params;
  const data = await serverApi<ParticipantDashboard>('participant/dashboard');
  const task = data.tasks.find((item) => item.id === id);
  if (!task) notFound();
  const access = taskAccess(data, task);
  if (!access.allowed) return <Shell user={user}><Link href="/dashboard">← Your study session</Link>
    <div className="alert" role="status">{access.reason}</div></Shell>;
  let materials: Awaited<ReturnType<typeof taskSheets>>;
  try { materials = await taskSheets(task); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return <Shell user={user}><Link href="/dashboard">← Your study session</Link>
      <div className="alert error" role="alert">Task materials are unavailable on this server. Please contact the researcher.</div></Shell>;
  }
  let checkpoint: CheckpointStatus | null = null;
  let checkpointError = '';
  if (checkpointAvailable()) {
    try {
      const token = (await cookies()).get('study_sid')?.value;
      if (!token) redirect('/login');
      const pre = await portalPreAnswers(data, token);
      checkpoint = checkpointJson<CheckpointStatus>({ command: 'status',
        ...checkpointInput(data, user.participant_code!, pre, task) });
    } catch (error) { checkpointError = (error as Error).message; }
  }
  const name = task.project_id === 'A' ? 'Resource catalogue' : 'Support archive';
  return <Shell user={user}>
    <Link href="/dashboard">← Your study session</Link>
    <div className="hero"><div><p className="eyebrow">Task {task.task_order} · {task.external_task_id}</p>
      <h1>{name}</h1><p>Work through the four checkpoint sheets in the assigned order: {task.checkpoint_order.join(' → ')}.</p></div>
      {checkpoint ? <a className="button" href={`/api/participant/tasks/${task.id}/package`}>Download recorded-task ZIP</a> : null}</div>
    {checkpoint ? <><div className="alert success"><strong>Recorded-task package ready.</strong> This ZIP includes <code>study/setup.mjs</code>, <code>study/client.mjs</code>, the workspace hook, and your private capture configuration. Keep the ZIP private.</div>
      <div className="grid two"><section className="card"><h2>Continue the recorded task</h2><p>Use the recorded-task ZIP above, then open the checkpoint page to review each proposed change and submit your final code.</p>
        <a className="button secondary" href={checkpoint.task_url} target="_blank" rel="noopener noreferrer">Open checkpoint study page</a></section>
        <section className="card"><h2>Connection check</h2><CaptureStatus taskId={task.id} initial={checkpoint} /></section></div>
      <p className="small"><a href={`/api/participant/tasks/${task.id}/starter`}>Download inspection-only starter ZIP</a> if the researcher asks you to examine the project before the recorded session.</p></>
      : <div className="alert error" role="alert">Recorded-task ZIP is unavailable. {checkpointError || 'The researcher must enable the checkpoint service.'} Contact the researcher before coding. The inspection-only starter ZIP does not collect the study measurements.</div>}
    <section className="card" aria-labelledby="capture-setup"><h2 id="capture-setup">Set up Antigravity capture for the recorded task</h2>
      <p>There is no separate study extension to install in the standalone Antigravity app. Download the <strong>recorded-task ZIP</strong> above; it contains the setup files. The researcher can also give you a private checkpoint study link.</p>
      <ol><li>Install and sign in to <a href="https://antigravity.google/download" target="_blank" rel="noopener noreferrer">Antigravity</a> if it is not already installed. Make sure Node.js 24 is available on the study computer.</li>
        <li>Extract the instrumented ZIP and open <strong>only that project folder</strong> in Antigravity.</li>
        <li>In the project terminal, run <code>node study/setup.mjs</code>. In Antigravity’s Hooks view, confirm <code>study-observer</code> is enabled.</li>
        <li>In a second project terminal, run <code>node study/client.mjs</code> and leave it open while coding.</li>
        <li>Return to this page or the private checkpoint task page. It should show <strong>Study client connected</strong>. Ask the agent to inspect a source file or run a test; after that, it should show <strong>Agent hook observed</strong>.</li></ol>
      <p className="small">If the researcher has enabled optional pointer recording for this pilot, install the pinned package with <code>python -m pip install -r study/POINTER_REQUIREMENTS.txt</code>, check support with <code>python study/pointer_recorder.py --probe</code>, and run <code>python study/pointer_recorder.py --run</code> in another project terminal during the task. On Windows, <code>py -3</code> may replace <code>python</code>. Stop it with Ctrl+C during breaks. It collects aggregate mouse/trackpad activity across applications while running. Linux Wayland is unsupported; tell the researcher if the probe fails. The coding task can continue without pointer recording.</p>
      <div className="subcard"><strong>How to check it worked</strong><p className="small">The live connection panel above refreshes every five seconds. Check that both the client and agent hook are observed. If it says the client is disconnected, keep the <code>node study/client.mjs</code> terminal open and check it for an error. If the setup files are missing, you downloaded the inspection-only starter ZIP.</p></div>
      <p className="small">After the checkpoint page confirms your final code was received, return to the portal dashboard, mark the task submitted, and complete its after-task questionnaire. Your answers are then saved to the recorded checkpoint session so Task 2 can open.</p>
      <p className="small">At the end, if the researcher asks for the approved official agent transcript, run <code>node study/upload-transcript.mjs PATH_TO_TRANSCRIPT</code> in the project terminal. This uploads only the file you name and checks its SHA-256 hash; screen video is collected through the researcher’s approved recording procedure.</p>
      <p className="small">The hook records selected agent tool events. The researcher also collects the consented screen recording and agent transcript separately.</p>
    </section>
    <div className="grid two"><section className="card markdown-body"><h2>Work orientation</h2>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{materials.orientation}</ReactMarkdown></section>
      <section className="card markdown-body"><h2>How checkpoints work</h2>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{materials.workflow}</ReactMarkdown></section></div>
    <h2 className="section-title">Task sheets</h2>
    <div className="stack">{materials.sheets.map((sheet, index) => <details className="card task-sheet" key={sheet.id} open={index === 0}>
      <summary>Step {index + 1}: {sheet.id}</summary>
      <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{sheet.source}</ReactMarkdown></div>
    </details>)}</div>
  </Shell>;
}
