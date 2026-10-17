import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shell } from '@/components/Shell';
import { CaptureStatus } from '@/components/CaptureStatus';
import { checkpointAvailable, checkpointInput, checkpointJson, portalPreAnswers, type CheckpointStatus } from '@/lib/checkpoint-bridge';
import { serverApi } from '@/lib/server-api';
import { taskAccess } from '@/lib/task-access';
import { taskSheets } from '@/lib/starter-package';
import { naturalTaskMaterials } from '@/lib/natural-package';
import { naturalEvidenceStatus } from '@/lib/natural-evidence';
import { NaturalEvidenceUpload } from '@/components/NaturalEvidenceUpload';
import type { ParticipantDashboard, StudyUser } from '@/lib/types';

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

  if (process.env.STUDY_PROTOCOL === 'natural') {
    const natural = naturalTaskMaterials(task, data.tasks);
    const hasAgentObserver = natural.protocolVersion.endsWith('-r3');
    const evidence = await naturalEvidenceStatus(user.participant_code!, task.external_task_id);
    return <Shell user={user}>
      <Link className="session-back" href="/dashboard">← Your study session</Link>
      <div className="hero session-hero"><div><p className="eyebrow">Natural coding · Task {task.task_order} of 2 · {task.external_task_id}</p>
        <h1>{task.project_id === 'A' ? 'Resource catalogue' : 'Support archive'}</h1>
        <p>Work with the coding agent in your assigned orientation. You may ask it to edit, inspect, test, or repair from the first prompt.</p></div>
        <span className="pill gray">{natural.protocolVersion}</span></div>
      <div className="notice"><strong>Code naturally with the agent</strong><p>This task has no proposal reveal, keep/reject gate, or checkpoint client. The portal receives the files listed below and gives a hash receipt for each. The researcher still checks recording playback, transcript readability, and code coverage before using the data.</p></div>
      {!hasAgentObserver && <div className="notice"><strong>Previously issued package</strong><p>This frozen package predates the agent transcript observer. Save its conversation separately. Ask the researcher for a fresh participant assignment to rehearse automatic transcript capture; repeated downloads keep the original package.</p></div>}
      <nav className="session-nav" aria-label="On this page"><a href="#download">Download</a><a href="#brief">Task and work guidance</a><a href="#capture">Capture setup and finishing</a><a href="#evidence">Upload evidence</a></nav>
      <section className="card" id="download"><h2>1. Download your project</h2>
        <p>Extract the ZIP, open only its project folder in Antigravity, and read <code>study/START_HERE.md</code>. You need Node.js 24 or newer. This natural task does not use <code>study/setup.mjs</code>, <code>study/client.mjs</code>, or a checkpoint page.</p>
        <a className="button" href={`/api/participant/tasks/${task.id}/package`}>Download natural-task ZIP</a>
      </section>
      <div className="grid two" id="brief" style={{ marginTop: 16 }}><section className="card markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{natural.taskSheet}</ReactMarkdown></section>
        <section className="card markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{natural.orientation}</ReactMarkdown>
          <p className="small">This guidance is for how you approach the task. Read it yourself; do not attach this card to the agent as an instruction file. Write your own prompts.</p></section></div>
      <section className="card" id="capture" style={{ marginTop: 16 }}><h2>2. Set up capture, then code</h2>
        <p>Run these commands in the terminal <strong>inside the extracted project folder</strong>. The study scripts are already in the ZIP; no separate study extension is needed for this task. These Node.js commands work on Windows, macOS, and Linux. Keep the portal page open for the final upload.</p>
        <ol>
          {hasAgentObserver && <li><strong>Set up conversation capture:</strong> in a project terminal run:<pre><code>{`node study/agent-observer.mjs setup ../${task.external_task_id}-agent`}</code></pre>
            In Antigravity&apos;s agent panel, open Customizations → Hooks and confirm <code>study-natural-observer</code> is enabled. Then run this in the same terminal and leave it open:<pre><code>node study/agent-observer.mjs watch</code></pre>
            After both watchers are running and the researcher confirms Google Meet recording, start a fresh task conversation for this project. The observer must see its SessionStart; it does not collect older or unrelated conversations.</li>}
          <li><strong>Before your first agent prompt:</strong> finish the practice and confirm with the researcher that Google Meet recording is running. In a separate project terminal, start the code watcher and leave it running:<pre><code>{`node study/capture.mjs watch . ../${task.external_task_id}-capture`}</code></pre>
            Check that <code>../{task.external_task_id}-capture</code> contains an initial snapshot. Tell the researcher if the watcher reports an error.</li>
          <li><strong>During the task:</strong> {!hasAgentObserver && <>Start a fresh agent conversation for this project. </>} work with the agent normally; it may edit immediately. The code watcher saves source snapshots. {hasAgentObserver
            ? <>The agent observer separately saves registered conversation records and hook timestamps. After the first prompt and response, run <code>node study/agent-observer.mjs status</code> in another terminal and confirm <code>transcript_records</code> is above zero. Ask the researcher to confirm that the captured sample includes your actual prompt and response; a nonzero count alone does not prove coverage. If records are missing or errors appear, tell the researcher and preserve the conversation separately.</>
            : <>Save a readable Antigravity conversation export separately.</>} The researcher handles the session recording.</li>
          <li><strong>When you would submit:</strong> stop editing and wait for the agent to finish. In another project terminal, save the exact final code and then answer the two security questions <em>before</em> the researcher shows hidden assessment results or debriefs you. You may run your own security checks throughout coding.<pre><code>{`node study/capture.mjs snapshot . ../${task.external_task_id}-final\nnode study/rate.mjs ../${task.external_task_id}-final`}</code></pre>
            The rating file is saved beside the final folder as <code>../{task.external_task_id}-rating.json</code>.</li>
          <li><strong>After rating:</strong> wait until the agent has finished and stop {hasAgentObserver ? 'both watchers' : 'the watcher'} with Ctrl+C. Check <code>../{task.external_task_id}-capture/CAPTURE_HEALTH.json</code> for errors. {hasAgentObserver && <>Also check <code>../{task.external_task_id}-agent/AGENT_CAPTURE_HEALTH.json</code>; it should show <code>stopped</code> and captured records. Upload <code>AGENT_TRANSCRIPT.jsonl</code> from that agent folder as the agent transcript, and keep the entire folder until the researcher checks it. </>}Tell the researcher the task is finished so they can mark the recording. Upload the final manifest and rating below, then complete the short after-task form. Compress the entire capture folder and entire final folder as separate ZIPs, then upload the remaining files.</li>
        </ol>
        <p className="small">The observers save files locally; upload them when the task ends. Conversation capture timestamps indicate when a record was observed, while original timestamps remain in the raw transcript. Neither watcher determines cognitive mode or human acceptance automatically.</p>
        <p className="small">After uploading all six files and answering the after-task form, return to the overview and set “My progress” to “Submitted”. Task 2 opens after both steps are complete. After Task 2, complete the final session form and the interview with the researcher.</p>
        <Link className="button secondary" href="/dashboard">Return to your study session</Link></section>
      <div style={{ marginTop: 16 }}><NaturalEvidenceUpload taskId={task.id} externalTaskId={task.external_task_id}
        afterTaskFormId={data.questionnaires.find((form) => form.stage === 'after_task')?.id}
        afterTaskCompleted={data.questionnaires.some((form) => form.stage === 'after_task' && form.response_task_id === task.id)} initial={evidence} /></div>
    </Shell>;
  }

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
  const completedCheckpoints = new Set(checkpoint?.completed_checkpoints ?? []);
  const skippedCheckpoints = new Set(checkpoint?.skipped_checkpoints ?? []);
  const recordedSteps = task.checkpoint_order.filter((step) => completedCheckpoints.has(step)).length + Number(Boolean(checkpoint?.final_submitted));
  return <Shell user={user}>
    <Link className="session-back" href="/dashboard">← Your study session</Link>
    <div className="hero session-hero"><div><p className="eyebrow">Task {task.task_order} of 2 · {task.external_task_id}</p>
      <h1>{name}</h1><p>Use your assigned work orientation and complete the four checkpoint sheets in order.</p></div>
      <span className={`pill ${task.status === 'submitted' ? 'good' : task.status === 'paused' ? 'warn' : 'gray'}`}>{task.status.replace('_', ' ')}</span></div>

    <nav className="session-nav" aria-label="On this page">
      <a href="#progress">Progress</a><a href="#orientation">Work orientation</a><a href="#prepare">Prepare your workspace</a>
      <a href="#task-sheets">Task sheets</a><a href="#finish">When finished</a>
    </nav>

    {checkpoint && <section className="card session-progress" id="progress" aria-labelledby="progress-title">
      <div className="session-progress-heading"><div><p className="eyebrow">Recorded study progress</p><h2 id="progress-title">Your checkpoint timeline</h2></div>
        <strong>{recordedSteps} of {task.checkpoint_order.length + 1} steps recorded</strong></div>
      <progress value={recordedSteps} max={task.checkpoint_order.length + 1} aria-label={`${recordedSteps} of ${task.checkpoint_order.length + 1} steps recorded`} />
      <ol className="session-timeline">{task.checkpoint_order.map((step, index) => {
        const state = skippedCheckpoints.has(step) ? 'skipped' : completedCheckpoints.has(step) ? 'done'
          : checkpoint.next_checkpoint === step ? 'current' : 'pending';
        const status = state === 'skipped' ? 'Skipped' : state === 'done' ? 'Completed' : state === 'current' ? 'Current' : 'Pending';
        return <li key={step} className={`session-timeline-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="session-timeline-marker" aria-hidden="true">{state === 'done' ? '✓' : state === 'skipped' ? '–' : index + 1}</span>
          <span className="session-timeline-label"><strong>Checkpoint {step}</strong><small>{status}</small></span></li>;
      })}<li className={`session-timeline-step ${checkpoint.final_submitted ? 'done' : checkpoint.next_checkpoint ? 'pending' : 'current'}`}
        aria-current={!checkpoint.final_submitted && !checkpoint.next_checkpoint ? 'step' : undefined}>
        <span className="session-timeline-marker" aria-hidden="true">{checkpoint.final_submitted ? '✓' : task.checkpoint_order.length + 1}</span>
        <span className="session-timeline-label"><strong>Final code</strong><small>{checkpoint.final_submitted ? 'Submitted' : checkpoint.next_checkpoint ? 'Pending' : 'Current'}</small></span></li></ol>
      <p className="small muted session-progress-refresh">Returned from the checkpoint page? <a href={`/participant/tasks/${task.id}`}>Refresh this page</a> to see your latest progress.</p>
    </section>}

    {checkpoint ? <div className="session-start-grid"><section className="card session-primary" aria-labelledby="session-start-title">
      {checkpoint.final_submitted ? <><p className="eyebrow">Recorded code received</p><h2 id="session-start-title">Finish the portal steps</h2>
        <p>Your final code reached the checkpoint study page. Return to your study session, mark this task submitted, and complete its after-task questionnaire.</p>
        <Link className="button" href="/dashboard">Continue in your study session</Link></>
        : <><p className="eyebrow">Start here</p><h2 id="session-start-title">Prepare the recorded task</h2>
          <p>Download the recorded-task ZIP, open its project folder in Antigravity, and complete the setup steps below before coding.</p>
          <div className="session-actions"><a className="button" href={`/api/participant/tasks/${task.id}/package`}>Download recorded-task ZIP</a>
            <a className="button secondary" href={checkpoint.task_url} target="_blank" rel="noopener noreferrer">Open checkpoint study page ↗</a></div>
          <p className="small">This ZIP includes the study setup and private capture configuration. Keep it private.</p></>}
    </section><section className="card" aria-labelledby="connection-title"><h2 id="connection-title">Check your connection</h2>
      <CaptureStatus taskId={task.id} initial={checkpoint} />
    </section></div> : <div className="alert error" role="alert"><strong>Recorded task unavailable.</strong> {checkpointError || 'The researcher must enable the checkpoint service.'} Contact the researcher before coding. The inspection-only starter ZIP does not collect the study measurements.</div>}

    <section className="session-section" id="orientation" aria-labelledby="orientation-title">
      <div className="session-section-heading"><div><p className="eyebrow">Before coding</p><h2 id="orientation-title">Read your task guidance</h2></div>
        <p>Follow this orientation for the whole task. The checkpoint page controls when a proposal is shown.</p></div>
      <div className="grid two"><div className="card markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: ({ children }) => <h3>{children}</h3> }}>{materials.orientation}</ReactMarkdown></div>
        <div className="card markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: ({ children }) => <h3>{children}</h3> }}>{materials.workflow}</ReactMarkdown></div></div>
    </section>

    <section className="session-section" id="prepare" aria-labelledby="prepare-title">
      <div className="session-section-heading"><div><p className="eyebrow">Workspace setup</p><h2 id="prepare-title">Prepare Antigravity capture</h2></div>
        <p>Use the recorded-task ZIP above. The inspection-only starter ZIP cannot record this task.</p></div>
      <div className="card"><ol className="session-steps">
        <li><strong>Open the recorded project.</strong><span>Install and sign in to <a href="https://antigravity.google/download" target="_blank" rel="noopener noreferrer">Antigravity</a> if needed. Make sure Node.js 24 is available. Extract the recorded-task ZIP and open only that project folder.</span></li>
        <li><strong>Enable the study hook.</strong><span>In the project terminal, run <code>node study/setup.mjs</code>. Confirm <code>study-observer</code> is enabled in Antigravity’s Hooks view.</span></li>
        <li><strong>Keep the study client running.</strong><span>In a second project terminal, run <code>node study/client.mjs</code>. Leave that terminal open while coding.</span></li>
        <li><strong>Confirm capture before starting.</strong><span>Look for <strong>Study client connected</strong> above. Ask the agent to inspect a source file or run a test, then check for <strong>Agent hook observed</strong>.</span></li>
      </ol>
      <div className="notice"><strong>First-decision rule</strong><p>Before each checkpoint, you may inspect and discuss the code, but ask the agent not to edit the target feature yet. When the proposal appears, record your first keep/reject decision and security-confidence rating before editing that proposal. You can then repair, replace, or reject it.</p></div>
      <details className="session-extra"><summary>Optional pointer recording, if your researcher enabled it</summary>
        <p>Install the pinned package with <code>python -m pip install -r study/POINTER_REQUIREMENTS.txt</code>, check support with <code>python study/pointer_recorder.py --probe</code>, and run <code>python study/pointer_recorder.py --run</code> in another project terminal during the task. On Windows, <code>py -3</code> may replace <code>python</code>. Stop it with Ctrl+C during breaks. It collects aggregate mouse/trackpad activity across applications while running. Linux Wayland is unsupported; tell the researcher if the probe fails. You can continue the coding task without pointer recording.</p>
      </details>
      <details className="session-extra"><summary>Having trouble connecting?</summary>
        <p>The connection panel refreshes every five seconds. If the client is disconnected, keep <code>node study/client.mjs</code> open and check that terminal for an error. If setup files are missing, check that you extracted the recorded-task ZIP rather than the inspection-only starter ZIP. Ask the researcher for help before coding if the checkpoint service is unavailable.</p>
      </details></div>
    </section>

    <section className="session-section" id="task-sheets" aria-labelledby="sheets-title">
      <div className="session-section-heading"><div><p className="eyebrow">Your assigned order</p><h2 id="sheets-title">Task sheets</h2></div>
        <p>Open each sheet when you reach that checkpoint: {task.checkpoint_order.join(' → ')}.</p></div>
      <div className="stack">{materials.sheets.map((sheet, index) => <details className="card task-sheet session-sheet" key={sheet.id} open={checkpoint ? checkpoint.next_checkpoint === sheet.id : index === 0}>
        <summary><span className="session-sheet-number">{index + 1}</span><span><strong>Checkpoint {sheet.id}</strong><small>Step {index + 1} of {materials.sheets.length}</small></span>
          {checkpoint && <span className="session-sheet-status">{skippedCheckpoints.has(sheet.id) ? 'Skipped' : completedCheckpoints.has(sheet.id) ? 'Completed' : checkpoint.next_checkpoint === sheet.id ? 'Current' : 'Pending'}</span>}
          <span className="session-sheet-toggle">Read sheet</span></summary>
        <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: ({ children }) => <h3>{children}</h3> }}>{sheet.source}</ReactMarkdown></div>
      </details>)}</div>
    </section>

    <section className="session-section" id="finish" aria-labelledby="finish-title">
      <div className="card session-finish"><div><p className="eyebrow">After the final checkpoint</p><h2 id="finish-title">Finish your portal steps</h2>
        <p>When the checkpoint study page confirms your final code was received, return to your study session, mark this task submitted, and complete its after-task questionnaire. That response must be saved before Task 2 can open.</p>
        <p className="small">If the researcher asks for the approved official agent transcript, run <code>node study/upload-transcript.mjs PATH_TO_TRANSCRIPT</code> in the project terminal. It uploads only the file you name and checks its SHA-256 hash. Screen video is collected through the researcher’s approved recording procedure.</p></div>
        <Link className="button secondary" href="/dashboard">Return to your study session</Link></div>
      {checkpoint && <p className="small muted session-starter">Need to inspect the project before a recorded session? Use the <a href={`/api/participant/tasks/${task.id}/starter`}>inspection-only starter ZIP</a> only if the researcher asks.</p>}
    </section>
  </Shell>;
}
