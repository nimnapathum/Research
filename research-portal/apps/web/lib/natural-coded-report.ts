import 'server-only';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const naturalPhases = ['rehearsal', 'pilot', 'main', 'legacy'] as const;
export type NaturalPhase = typeof naturalPhases[number];
export const codedTables = ['session_log', 'coding_status', 'episodes', 'checks', 'exposures'] as const;

export type NaturalCodedReport = {
  report_version: string; study_phase: NaturalPhase; source_sha256: Record<string, string>;
  coverage: { tasks: number; participants: number; coding_states: Record<string, Record<string, number>> };
  rq1: { observed_mode_by_condition: { condition: string; complete_tasks: number;
    mean_task_acceleration_share: number | null; mean_task_exploration_share: number | null }[] };
  rq2: { confirmed_exposure_flow: { condition: string; coded_tasks: number;
    confirmed_agent_origin_exposures: number; final_survival_yes: number;
    final_survival_no: number; final_survival_unclear: number;
    intentional_repair_yes: number }[] };
  rq3: { checks_by_condition: { condition: string; coded_tasks: number;
    tasks_with_reviewed_security_check: number; reviewed_security_checks: number;
    before_application: number; after_application_before_continuation: number;
    after_continuation: number }[];
    reviewed_security_check_vs_final_security: { condition: string; class: string;
      reviewed_check: boolean; final_security: string; features: number }[] };
  rq4: { by_condition_and_class: { condition: string; class: string; assigned_features: number;
    resolved_assessable: number; final_vulnerable: number; check_coded_tasks: number;
    reviewed_security_checks: number;
    confirmed_agent_origin_exposures: number; exposures_surviving: number }[] };
  warnings: string[];
};

export function analysisRoot(phase: NaturalPhase) {
  const root = resolve(/* turbopackIgnore: true */ process.env.STUDY_EVIDENCE_ROOT ||
    join(process.cwd(), '../../.local-evidence'));
  return join(root, 'analysis', phase);
}

export function featureCSVHash(csv: string) { return createHash('sha256').update(csv).digest('hex'); }

export async function latestNaturalCodedReport(phase: NaturalPhase, currentFeatures: string) {
  let runs: string[];
  try { runs = (await readdir(analysisRoot(phase))).filter((name) => /^run-\d{8}T\d{9}Z-[a-f0-9-]{36}$/.test(name)).sort().reverse(); }
  catch { return null; }
  for (const run of runs) {
    try {
      const raw = await readFile(join(analysisRoot(phase), run, 'report.json'), 'utf8');
      if (raw.length > 3 * 1024 * 1024) continue;
      const report = JSON.parse(raw) as NaturalCodedReport;
      if (report.study_phase !== phase || !report.report_version?.startsWith('natural-rq-') ||
          !report.source_sha256?.features || !Array.isArray(report.rq1?.observed_mode_by_condition) ||
          !Array.isArray(report.rq2?.confirmed_exposure_flow) ||
          !Array.isArray(report.rq3?.checks_by_condition) ||
          !Array.isArray(report.rq4?.by_condition_and_class)) continue;
      return { report, run, current: report.source_sha256.features === featureCSVHash(currentFeatures) };
    } catch {}
  }
  return null;
}
