import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import type { ParticipantDashboard, Questionnaire, StudyUser } from '@/lib/types';
import { Shell } from '@/components/Shell';
import { QuestionnaireForm } from '@/components/QuestionnaireForm';

export default async function FormPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ task?: string }>
}) {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'participant') return <main className="page">Participant form only. <Link href="/dashboard">Return to dashboard</Link>.</main>;
  const { id } = await params;
  const { task } = await searchParams;
  const [form, dashboard] = await Promise.all([
    serverApi<Questionnaire>(`participant/questionnaires/${id}`),
    serverApi<ParticipantDashboard>('participant/dashboard')
  ]);
  const selectedTask = dashboard.tasks.find((item) => item.id === task);
  if (form.stage === 'after_task' && !selectedTask) return <Shell user={user}><div className="alert error">Select an assigned task for this form.</div></Shell>;
  if (form.stage === 'after_task' && process.env.STUDY_PROTOCOL === 'natural' && !selectedTask?.final_rating_received) {
    return <Shell user={user}><div className="alert">Upload your final snapshot manifest and security rating on the task page first.</div>
      <Link href={`/participant/tasks/${selectedTask?.id}`}>Return to your task</Link></Shell>;
  }
  if (form.stage === 'after_both' && (!dashboard.tasks.length || !dashboard.tasks.every((item) => item.status === 'submitted' &&
    dashboard.questionnaires.some((row) => row.stage === 'after_task' && row.response_task_id === item.id)))) {
    return <Shell user={user}><div className="alert">Complete both tasks, their evidence uploads, and their after-task forms first.</div>
      <Link href="/dashboard">Return to your study session</Link></Shell>;
  }
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">{form.stage.replace('_', ' ')} · version {form.version}</p>
    <h1>{form.title}</h1><p>{selectedTask ? `For ${selectedTask.external_task_id}. ` : ''}Please answer from your own experience. You may skip optional text questions.</p></div></div>
    {form.stage === 'after_task' && process.env.STUDY_PROTOCOL === 'natural' && selectedTask && <p>
      After saving your answers, finish uploading this task's evidence. <Link href={`/participant/tasks/${selectedTask.id}#evidence`}>Return to task uploads</Link>.</p>}
    <div style={{ maxWidth: 780 }}><QuestionnaireForm form={form} taskId={task}
      returnToTaskId={form.stage === 'after_task' && process.env.STUDY_PROTOCOL === 'natural' ? selectedTask?.id : undefined}
      nextTaskId={form.stage === 'pre_task' ? dashboard.tasks.find((item) => item.task_order === 1)?.id : undefined} /></div>
  </Shell>;
}
