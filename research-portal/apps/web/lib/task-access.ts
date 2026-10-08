import type { ParticipantDashboard, StudyTask } from './types';

export function taskAccess(data: ParticipantDashboard, task: StudyTask): { allowed: boolean; reason?: string } {
  const preDone = data.questionnaires.some((form) => form.stage === 'pre_task' && Boolean(form.response_id));
  if (!preDone) return { allowed: false, reason: 'Complete the pre-task questionnaire to open your task materials.' };
  if (task.task_order === 2) {
    const first = data.tasks.find((item) => item.task_order === 1);
    const afterFirst = first && data.questionnaires.some((form) =>
      form.stage === 'after_task' && form.response_task_id === first.id);
    if (!first || first.status !== 'submitted' || !afterFirst) {
      return { allowed: false, reason: 'Submit Task 1 and its after-task questionnaire first.' };
    }
  }
  return { allowed: true };
}
