import type { ResearchDoc } from './research-docs';

export function linkedDoc(from: string, href: string, docs: ResearchDoc[]): string | null {
  if (href.startsWith('#')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
  const [file, anchor] = href.split('#', 2);
  if (!file) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(file); } catch { return null; }
  const segments = [...from.replaceAll('\\', '/').split('/').slice(0, -1), ...decoded.replaceAll('\\', '/').split('/')];
  const normalized: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') normalized.pop();
    else normalized.push(segment);
  }
  const relative = normalized.join('/');
  if (!docs.some((doc) => doc.path === relative)) return null;
  return `/researcher/research?doc=${encodeURIComponent(relative)}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
}
