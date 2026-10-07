import { notFound, redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { ResearchLibrary } from '@/components/ResearchLibrary';
import { serverApi } from '@/lib/server-api';
import { listResearchDocs, readResearchDoc } from '@/lib/research-docs';
import type { StudyUser } from '@/lib/types';

export default async function ResearchPage({ searchParams }: {
  searchParams: Promise<{ doc?: string }>
}) {
  const user = await serverApi<StudyUser>('auth/me');
  if (user.role !== 'researcher') redirect('/dashboard');
  const docs = await listResearchDocs();
  const requested = (await searchParams).doc;
  const selected = requested || (docs.some((doc) => doc.path === 'RQ.md') ? 'RQ.md' : docs[0]?.path);
  if (!selected) return <Shell user={user}><div className="empty">No research Markdown files were found. Check RESEARCH_DOCS_ROOT.</div></Shell>;
  const source = await readResearchDoc(selected, docs);
  if (source === null) notFound();
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Research library</p><h1>Study documents</h1>
    <p>Read the current methodology, questions, tasks, instruments, and pilot guides from the workspace.</p></div></div>
    <ResearchLibrary docs={docs} initialSelected={selected} initialSource={source} />
  </Shell>;
}
