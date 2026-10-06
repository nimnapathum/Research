import { Shell } from '@/components/Shell';
import { QuestionnaireBuilder } from '@/components/QuestionnaireBuilder';
import { serverApi } from '@/lib/server-api';
import type { StudyUser, Questionnaire } from '@/lib/types';

export default async function QuestionnairesPage() {
  const user = await serverApi<StudyUser>('auth/me');
  const rows = await serverApi<(Questionnaire & { slug: string; response_count: number })[]>('researcher/questionnaires');
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Study instruments</p><h1>Questionnaires</h1>
    <p>Prepare forms before recruitment and record their versions in the protocol.</p></div></div>
    <QuestionnaireBuilder rows={rows} /></Shell>;
}
