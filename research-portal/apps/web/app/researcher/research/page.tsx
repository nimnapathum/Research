import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shell } from '@/components/Shell';
import { ResearchDocList } from '@/components/ResearchDocList';
import { serverApi } from '@/lib/server-api';
import { linkedDoc, listResearchDocs, readResearchDoc } from '@/lib/research-docs';
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
  const metadata = docs.find((doc) => doc.path === selected)!;
  return <Shell user={user}><div className="hero"><div><p className="eyebrow">Research library</p><h1>Study documents</h1>
    <p>Read the current methodology, questions, tasks, instruments, and pilot guides from the workspace.</p></div></div>
    <section className="card research-summary"><h2>Research at a glance</h2>
      <p><strong>Aim:</strong> Examine whether developers working with a coding agent in acceleration and exploration episodes differ in security judgments, reliance on generated changes, verification, and security trust calibration.</p>
      <div className="grid two"><div><strong>Research questions</strong><ol>
        <li>Does security confidence align with assessed code security differently across the two conditions?</li>
        <li>Do exposed vulnerabilities remain in final code differently across conditions?</li>
        <li>How do security checks before and after provisional retention relate to repair or retention?</li>
        <li>Do these patterns differ for SQL injection and path traversal?</li>
      </ol></div><div><strong>Current stage</strong><p>Pilot preparation. Participant outcomes and preliminary results are not yet available.</p>
        <p className="small">Start with <Link href="/researcher/research?doc=RQ.md">RQs and rationale</Link>, <Link href="/researcher/research?doc=METHODOLOGY.md">methodology</Link>, and <Link href="/researcher/research?doc=study-system%2Fpilot%2FSESSION_RUNBOOK.md">session runbook</Link>.</p></div></div>
    </section>
    <div className="document-layout"><ResearchDocList docs={docs} selected={selected} />
      <article className="card document-content"><div className="document-meta"><span>{metadata.category}</span>
        <span>{metadata.path}</span><span>Updated {new Date(metadata.updatedAt).toLocaleDateString()}</span></div>
        <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}
          components={{ a: ({ href, children }) => {
            const target = linkedDoc(selected, href || '', docs);
            if (!target) return <span>{children}</span>;
            if (target.startsWith('http')) return <a href={target} target="_blank" rel="noopener noreferrer">{children}</a>;
            return <Link href={target}>{children}</Link>;
          }, img: ({ alt }) => <span className="muted">[Image: {alt || 'not available in the Markdown viewer'}]</span> }}>
          {source}</ReactMarkdown></div>
      </article></div></Shell>;
}
