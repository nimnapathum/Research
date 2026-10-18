import 'server-only';
import { featureCells, type NaturalAssessment, type TaskSummary } from './natural-analysis';

const header = ['participant_id', 'task_id', 'condition', 'project_id', 'task_order',
  'vulnerability_class', 'final_snapshot_sha256', 'confidence_snapshot_sha256',
  'probability_secure_pct', 'security_status', 'functionality_status', 'review_status',
  'missing_reason', 'evidence_ref'];
const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function buildNaturalFeatureCSV(tasks: TaskSummary[], assessments: NaturalAssessment[]) {
  const lines = [header.map(csv).join(',')];
  for (const cell of featureCells(tasks, assessments)) {
    const task = cell.task;
    const probability = cell.weakness === 'sql' ? task.sql_probability : task.path_probability;
    const reason = !task.submitted ? 'task_not_submitted' : !task.final_hash ? 'not_recorded' : !task.rating_linked
      ? (task.rating_hash ? 'technical_failure' : 'not_recorded') :
      cell.status === 'pending' ? 'not_reviewed' : ['not_implemented', 'unassessable'].includes(cell.status)
        ? cell.status : '';
    lines.push([
      task.participant_code, task.task_id, task.condition, task.project, task.order, cell.weakness,
      task.final_hash || '', task.rating_hash || '', probability ?? '',
      cell.status === 'pending' ? '' : cell.status,
      cell.functionality === 'pending' ? '' : cell.functionality,
      cell.status === 'pending' ? 'unreviewed' : 'resolved', reason,
      `portal:researcher/evidence/${task.participant_code}/${task.task_id}`
    ].map(csv).join(','));
  }
  return lines.join('\n') + '\n';
}
