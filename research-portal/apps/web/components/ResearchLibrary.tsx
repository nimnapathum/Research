'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { MouseEvent } from 'react';
import type { ResearchDoc } from '@/lib/research-docs';
import { linkedDoc } from '@/lib/research-links';
import { ResearchDocList } from './ResearchDocList';

export function ResearchLibrary({ docs, initialSelected, initialSource }: {
  docs: ResearchDoc[]; initialSelected: string; initialSource: string;
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [source, setSource] = useState(initialSource);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const contents = useRef(new Map<string, string>([[initialSelected, initialSource]]));
  const requestId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const defaultPath = docs.some((doc) => doc.path === 'STUDY_GUIDE.md') ? 'STUDY_GUIDE.md' : docs[0]?.path;

  const load = useCallback(async (path: string) => {
    if (!docs.some((doc) => doc.path === path)) return;
    const id = ++requestId.current;
    abort.current?.abort();
    setSelected(path);
    setError('');
    const cached = contents.current.get(path);
    if (cached !== undefined) {
      setSource(cached);
      setPending(null);
      return;
    }
    setPending(path);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch(`/api/research/docs?doc=${encodeURIComponent(path)}`, {
        cache: 'no-store', signal: controller.signal
      });
      if (response.status === 401) {
        window.location.assign('/login');
        return;
      }
      if (!response.ok) throw new Error(`Could not open document (${response.status})`);
      const result = await response.json() as { source: string };
      if (id !== requestId.current) return;
      contents.current.set(path, result.source);
      if (contents.current.size > 8) contents.current.delete(contents.current.keys().next().value!);
      setSource(result.source);
    } catch (reason) {
      if (controller.signal.aborted || id !== requestId.current) return;
      setError(reason instanceof Error ? reason.message : 'Could not open document');
    } finally {
      if (id === requestId.current) setPending(null);
    }
  }, [docs]);

  const open = useCallback((path: string, hash = '') => {
    if (path === selected && !hash) return;
    window.history.pushState(null, '', `/researcher/research?doc=${encodeURIComponent(path)}${hash}`);
    void load(path);
  }, [load, selected]);

  useEffect(() => {
    const onBack = () => {
      const path = new URL(window.location.href).searchParams.get('doc') || defaultPath;
      if (path) void load(path);
    };
    window.addEventListener('popstate', onBack);
    return () => {
      window.removeEventListener('popstate', onBack);
      abort.current?.abort();
    };
  }, [defaultPath, load]);

  const handleLocalLink = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(target, window.location.href);
    const path = url.searchParams.get('doc');
    if (!path) return;
    event.preventDefault();
    open(path, url.hash);
  };
  const metadata = docs.find((doc) => doc.path === selected);
  const historical = metadata?.category.startsWith('99 ') || false;

  return <>
    <section className="card research-summary"><h2>Research at a glance</h2>
      <p><strong>Aim:</strong> Examine security judgments, reliance, verification and confidence accuracy when developers use a coding agent under two assigned work structures. Code the interaction modes they actually show.</p>
      <p className="small">The main study uses two tasks per participant. The feasibility pilot rehearses this same structure before the materials are frozen. Assigned conditions combine human guidance with a familiar or unfamiliar code interface; observed mode is coded separately.</p>
      <ol className="study-flow" aria-label="Study method at a glance">
        <li><strong>1</strong><span>Consent and background</span></li>
        <li><strong>2</strong><span>Two balanced agent tasks</span></li>
        <li><strong>3</strong><span>Final-code ratings and replay</span></li>
        <li><strong>4</strong><span>Independent code and video review</span></li>
        <li><strong>5</strong><span>Paired RQ analysis</span></li>
      </ol>
      <div className="grid two"><div><strong>Research questions</strong><ol>
        <li>Does security confidence align with assessed code security differently across the two conditions?</li>
        <li>Do target vulnerabilities remain in final code differently across conditions? Describe retention only when an insecure agent change was actually exposed.</li>
        <li>How do security checks before and after observed integration of agent changes relate to final outcomes?</li>
        <li>Do these patterns differ for SQL injection and path traversal?</li>
      </ol></div><div><strong>Read the study in order</strong><p>The <a href="/researcher/research?doc=STUDY_GUIDE.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=STUDY_GUIDE.md')}>A–Z study guide</a> explains the main method, what literature supports, what is new, and how each RQ is evaluated.</p>
        <p className="small">Then read the <a href="/researcher/research?doc=RQ.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=RQ.md')}>RQs</a>, <a href="/researcher/research?doc=TASK_CONTRAST_DESIGN.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=TASK_CONTRAST_DESIGN.md')}>task contrast</a>, <a href="/researcher/research?doc=SCREEN_RECORDING_EVALUATION_PLAN.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=SCREEN_RECORDING_EVALUATION_PLAN.md')}>recording evaluation</a>, <a href="/researcher/research?doc=NATURAL_ANALYSIS_PLAN.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=NATURAL_ANALYSIS_PLAN.md')}>analysis plan</a>, and <a href="/researcher/research?doc=REFERENCES.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=REFERENCES.md')}>source ledger</a>. The <a href="/researcher/research?doc=PILOT_READINESS_AUDIT_2026-10-18.md" onClick={(event) => handleLocalLink(event, '/researcher/research?doc=PILOT_READINESS_AUDIT_2026-10-18.md')}>pilot gate</a> records what must be checked before new participant collection.</p></div></div>
    </section>
    <div className="document-layout"><ResearchDocList docs={docs} selected={selected} pending={pending} onOpen={open} />
      <article className="card document-content" aria-busy={pending !== null}>
        <div className="document-meta"><span>{metadata?.category}</span><span>{selected}</span>
          <span>Updated {metadata ? metadata.updatedAt.slice(0, 10) : '—'}</span></div>
        {historical && <p className="alert">Historical design or status snapshot. Use the A–Z study guide and current session runbook for active sessions.</p>}
        {pending && <p className="muted" role="status">Opening document…</p>}
        {error && <p role="alert">{error} <button type="button" onClick={() => void load(selected)}>Retry</button></p>}
        {!pending && !error && <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]}
          components={{ a: ({ href, children }) => {
            const target = linkedDoc(selected, href || '', docs);
            if (!target) return <span>{children}</span>;
            if (target.startsWith('http')) return <a href={target} target="_blank" rel="noopener noreferrer">{children}</a>;
            if (target.startsWith('#')) return <a href={target}>{children}</a>;
            return <a href={target} onClick={(event) => handleLocalLink(event, target)}>{children}</a>;
          }, img: ({ alt }) => <span className="muted">[Image: {alt || 'not available in the Markdown viewer'}]</span> }}>
          {source}</ReactMarkdown></div>}
      </article></div>
  </>;
}
