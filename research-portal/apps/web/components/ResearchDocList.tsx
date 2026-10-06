'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { ResearchDoc } from '@/lib/research-docs';

export function ResearchDocList({ docs, selected }: { docs: ResearchDoc[]; selected: string }) {
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
        <Link key={doc.path} href={`/researcher/research?doc=${encodeURIComponent(doc.path)}`}
          className={`document-link${selected === doc.path ? ' active' : ''}`}>
          <span>{doc.title}</span><small>{doc.path}</small></Link>)}
    </div>)}</nav></aside>;
}
