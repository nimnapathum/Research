import 'server-only';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, posix, resolve } from 'node:path';

export type ResearchDoc = { path: string; title: string; category: string; updatedAt: string };
const root = resolve(process.env.RESEARCH_DOCS_ROOT || join(process.cwd(), '../../..'));
const roots = ['', 'tasks', 'study-system', 'research-portal', 'archive'];
const excluded = new Set(['node_modules', '.git', '.next', 'dist', '.agents', '.codex', '.study-capture']);
const mainDocs = new Set([
  'CURRENT_STUDY.md', 'RQ.md', 'TASK_CONTRAST_DESIGN.md', 'TASK_DESIGN.md',
  'NATURAL_WORKFLOW_METHOD.md', 'METHODOLOGY_TIMELINE_AND_JUSTIFICATION.md',
  'study-system/instruments/NATURAL_QUESTIONNAIRES.md',
  'study-system/instruments/NATURAL_INTERVIEW_GUIDE.md',
  'SCREEN_RECORDING_EVALUATION_PLAN.md', 'NATURAL_ANALYSIS_PLAN.md', 'REFERENCES.md'
]);
const operationsDocs = new Set([
  'PILOT_READINESS_AUDIT_2026-10-18.md',
  'study-system/pilot/NATURAL_SESSION_RUNBOOK.md',
  'study-system/pilot/NATURAL_PILOT_GATE_RECORD.md',
  'study-system/pilot/NATURAL_DATA_COVERAGE.md',
  'study-system/pilot/AGENT_OBSERVER_GUIDE.md',
  'study-system/pilot/ELIGIBILITY_AND_RECRUITMENT.md',
  'study-system/pilot/NATURAL_PRACTICE.md'
]);
const olderDocs = new Set([
  'Agentic_Coding_Security_Study_Methodology.md', 'Security_Trust_Study_Workplan.md', 'BUILD_PLAN.md',
  'study-system/instruments/QUESTIONNAIRES.md', 'study-system/instruments/INTERVIEW_GUIDE.md',
  'study-system/pilot/FACILITATOR_SCRIPT.md', 'study-system/pilot/NATURAL_REHEARSAL_TODAY.md',
  'study-system/pilot/READINESS_AUDIT.md', 'study-system/pilot/READINESS_2026-10-13.md',
  'study-system/pilot/MEASUREMENT_INVENTORY.md', 'study-system/pilot/PARTICIPANT_INSTRUCTIONS_AUDIT.md',
  'study-system/pilot/REHEARSAL_CHANGES_2026-10-18.md',
  'research-portal/DEPLOY_ORACLE_CLOUD.md', 'study-system/STATUS.md'
]);
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
  if (path === 'STUDY_GUIDE.md') return '01 Start here';
  if (mainDocs.has(path)) return '02 Main-study method';
  if (operationsDocs.has(path)) return '03 Pilot and session operation';
  if (path.startsWith('archive/') || olderDocs.has(path) ||
      (path.startsWith('study-system/instruments/') && path !== 'study-system/instruments/NATURAL_CODEBOOK.md') ||
      path.startsWith('study-system/stimuli/') ||
      path.startsWith('study-system/pilot/')) return '99 Historical designs and status';
  if (path.startsWith('research-portal/')) return '04 Portal and deployment';
  if (path.startsWith('tasks/')) return '05 Task materials';
  if (path.startsWith('study-system/instruments/')) return '06 Supporting instruments';
  if (path.startsWith('study-system/analysis/')) return '07 Analysis implementation';
  if (path.startsWith('study-system/pilot/')) return '08 Supporting operations';
  return '09 Research notes';
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
