import { Shell } from '@/components/Shell';
import { QuestionnaireBuilder } from '@/components/QuestionnaireBuilder';
import { serverApi } from '@/lib/server-api';
import type { StudyUser, Questionnaire } from '@/lib/types';

export default async function QuestionnairesPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const rows = await serverApi<(Questionnaire & { slug: string; response_count: number })[]>('researcher/questionnaires');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Study instruments</p><h1>Questionnaires</h1>
    <p>Prepare forms before recruitment and record their versions in the protocol.</p></div></div>
    {process.env.STUDY_PROTOCOL === 'natural' && <div className="notice"><strong>Current participant form</strong>
      <p>The natural-task pre-task form shown to participants omits the stored SQL and path baseline questions. The stored questionnaire may still show them for the earlier checkpoint study. Check actual response fields and form versions before analysis; do not revise a published form during a session.</p></div>}
    <QuestionnaireBuilder rows={rows} /></Shell>;
}
