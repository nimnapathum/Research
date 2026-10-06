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
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">{form.stage.replace('_', ' ')} · version {form.version}</p>
    <h1>{form.title}</h1><p>{selectedTask ? `For ${selectedTask.external_task_id}. ` : ''}Please answer from your own experience. You may skip optional text questions.</p></div></div>
    <div style={{ maxWidth: 780 }}><QuestionnaireForm form={form} taskId={task} /></div>
  </Shell>;
}
