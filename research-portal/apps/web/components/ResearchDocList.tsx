'use client';
import { useState } from 'react';
import type { ResearchDoc } from '@/lib/research-docs';

export function ResearchDocList({ docs, selected, pending, onOpen }: {
  docs: ResearchDoc[]; selected: string; pending: string | null; onOpen: (path: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = docs.filter((doc) => `${doc.title} ${doc.path} ${doc.category}`.toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(filtered.map((doc) => doc.category))];
  return <aside className="card document-sidebar"><label htmlFor="doc-search" className="small">Search research files</label>
    <input id="doc-search" type="search" placeholder="Aim, methodology, pilot…" value={query}
      onChange={(event) => setQuery(event.target.value)} />
    <div className="small muted">{filtered.length} of {docs.length} Markdown files</div>
    <nav aria-label="Research documents">{groups.map((group) => <div key={group}>
      <h2 className="document-group">{group}</h2>
      {filtered.filter((doc) => doc.category === group).map((doc) =>
        <a key={doc.path} href={`/researcher/research?doc=${encodeURIComponent(doc.path)}`}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpen(doc.path);
          }}
          aria-current={selected === doc.path ? 'page' : undefined}
          className={`document-link${selected === doc.path ? ' active' : ''}`}>
          <span>{doc.title}</span><small>{pending === doc.path ? 'Opening document…' : doc.path}</small></a>)}
    </div>)}</nav></aside>;
}
