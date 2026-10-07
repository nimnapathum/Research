import 'server-only';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, posix, resolve } from 'node:path';

export type ResearchDoc = { path: string; title: string; category: string; updatedAt: string };
const root = resolve(process.env.RESEARCH_DOCS_ROOT || join(process.cwd(), '../../..'));
const roots = ['', 'tasks', 'study-system', 'research-portal'];
const excluded = new Set(['node_modules', '.git', '.next', 'dist', '.agents', '.codex', '.study-capture']);
const indexTtlMs = 30_000;
let indexCache: { docs: ResearchDoc[]; expiresAt: number } | undefined;
let indexBuild: Promise<ResearchDoc[]> | undefined;

async function scan(relative: string, paths: string[]) {
  const entries = await readdir(join(root, relative), { withFileTypes: true });
  for (const entry of entries) {
    if (excluded.has(entry.name) || entry.name.startsWith('.')) continue;
    const path = posix.join(relative.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) await scan(path, paths);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) paths.push(path);
  }
}
function category(path: string) {
  if (path.startsWith('research-portal/')) return 'Portal';
  if (path.startsWith('tasks/')) return 'Task design';
  if (path.startsWith('study-system/pilot/')) return 'Pilot operations';
  if (path.startsWith('study-system/instruments/')) return 'Instruments and tasks';
  if (path.startsWith('study-system/capture/')) return 'Capture and telemetry';
  if (path.startsWith('study-system/analysis/')) return 'Analysis';
  if (path.startsWith('study-system/')) return 'Study system';
  return 'Research foundation';
}
async function buildResearchDocIndex(): Promise<ResearchDoc[]> {
  const paths: string[] = [];
  for (const relative of roots) {
    if (relative === '') {
      const entries = await readdir(root, { withFileTypes: true });
      paths.push(...entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
        .map((entry) => entry.name));
    } else {
      try { await scan(relative, paths); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
  }
  const docs = await Promise.all(paths.map(async (path) => {
    const absolute = join(root, path);
    const [source, info] = await Promise.all([readFile(absolute, 'utf8'), stat(absolute)]);
    const heading = source.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return { path, title: heading || posix.basename(path, '.md').replaceAll('_', ' '),
      category: category(path), updatedAt: info.mtime.toISOString() };
  }));
  return docs.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
}
export function listResearchDocs(): Promise<ResearchDoc[]> {
  if (indexCache && Date.now() < indexCache.expiresAt) return Promise.resolve(indexCache.docs);
  if (indexBuild) return indexBuild;
  indexBuild = buildResearchDocIndex()
    .then((docs) => {
      indexCache = { docs, expiresAt: Date.now() + indexTtlMs };
      return docs;
    })
    .finally(() => { indexBuild = undefined; });
  return indexBuild;
}
export async function readResearchDoc(path: string, docs: ResearchDoc[]): Promise<string | null> {
  if (!docs.some((doc) => doc.path === path)) return null;
  return readFile(join(root, path), 'utf8');
}
export function linkedDoc(from: string, href: string, docs: ResearchDoc[]): string | null {
  if (href.startsWith('#')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
  const [file, anchor] = href.split('#', 2);
  if (!file) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(file); } catch { return null; }
  const relative = posix.normalize(posix.join(dirname(from).replaceAll('\\', '/'), decoded));
  if (!docs.some((doc) => doc.path === relative)) return null;
  return `/researcher/research?doc=${encodeURIComponent(relative)}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
}
