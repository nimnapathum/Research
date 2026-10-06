# Security adjudication and RQ analysis

**Status: runnable pipeline, awaiting participant data and independent reviewers.** It never treats a scanner alert or one attack probe as the final security truth. The target classes are SQL injection and path traversal only; functionality and additional weaknesses are separate findings.

## Steps after sessions are complete

1. Run the local app's `cli.mjs audit`. Resolve missing raw streams and attach the consented videos/transcripts. Keep lost exposure, missing confidence and missing final snapshots as distinct cases.
2. Run `node review_queue.mjs NEW_OUTPUT_DIR` with `STUDY_DATA_DIR` pointing to the app data. It creates shuffled, neutral-ID code packages. Give each reviewer a **separate private copy** of `NEW_OUTPUT_DIR/give-to-reviewers/` with only that reviewer's rating CSV; collect their completed files separately. Never give either reviewer `RESEARCHER_MAP.json`, the other reviewer's ratings, or the original study data. Inspect packages for accidental names/comments before sharing.
3. Two reviewers independently fill their rating CSVs. For each item, use the target task sheet, trace input to the SQL/file sink, test ordinary behaviour, and judge `secure`, `vulnerable`, `indeterminate`, or `missing`; record `pass`, `partial`, `fail`, or `missing` functionality and a short rationale. Do not reveal assigned condition, confidence or interview responses. [probe_snapshot.mjs](probe_snapshot.mjs) can supply dynamic evidence after independent inspection; it does not make the decision.
4. Run `node resolve_reviews.mjs NEW_OUTPUT_DIR`. It fills agreements into `RESOLVED_REVIEW.csv` and flags disagreements or missing ratings. Resolve those by documented discussion or a third reviewer; edit the resolved status, functionality and note. Preserve both original reviewer files. Report raw agreement and disagreements.
5. Code observed mode, verification and the decision-to-final path from synchronized video, prompts, edits and replay interview using [the codebook](../instruments/CODING_CODEBOOK.md). Enter episodes in `MODE_EPISODES.csv`, checks in `VERIFICATION_EVENTS.csv`, and one post-decision path in `DECISION_PATHS.csv`. Use phase `before_decision`, `after_keep` or `after_reject` for checks. Enter `none` explicitly only when a review was coded and no check occurred; a blank row means uncoded.
6. Run `node export.mjs REVIEW_OUTPUT NEW_ANALYSIS_OUTPUT`. It writes `opportunities.csv`, `task_summary.csv`, `forms.csv` and `summary.json`. It does not substitute prototype expected status when an exact proposal or final feature lacks independent adjudication.

## Main outcomes and denominators

| RQ | Analysis unit | What this pipeline computes |
| --- | --- | --- |
| RQ1 | Exposed exact proposal with confidence and adjudicated target security | Brier contribution, mean confidence on secure and vulnerable proposals, and a within-participant task-mean difference by assigned condition. Lower Brier means better probability accuracy; it combines calibration and discrimination. |
| RQ2 | **Actually exposed vulnerable** proposal | Keep/reject, coded edit/repair path and final status. `final_target_retained` uses only assessable final features; all-exposed functional-and-target-secure success needs a final snapshot and a coded final feature. Missing final evidence stays missing. |
| RQ3 | Review episode with coded security checks | Security-specific counts before decision, after keep, and separately after rejection, plus descriptive retention by check occurrence. The outcome association is observational. Do not call a generic normal test a security check without evidence of security intent. |
| RQ4 | The above split by target class | SQL/path descriptive estimates and condition differences, with uncertainty. Class interaction is exploratory at a small sample. |

`summary.json` includes paired Brier and security-success contrasts, RQ1 secure/vulnerable confidence components, an RQ2 exposed-to-final flow, an RQ3 check-versus-retention table, and exploratory SQL/path contrasts. It adds a paired bootstrap interval only when at least three complete participant pairs exist. Report raw denominators, order/project information, missingness, and divergent cases alongside it. The bootstrap is a descriptive uncertainty estimate; sample size and the analysis hierarchy need to be frozen after pilot and before main recruitment. See [MEASURES_AND_EVALUATION.md](../../MEASURES_AND_EVALUATION.md) for the full estimands and limitations.

## Static tools

CodeQL, SonarQube, Snyk or another scanner may be run on frozen snapshots with recorded tool/version/rules. Confirm every relevant finding against the target source–sink path and attack/normal tests. A clean scan is not proof of target security. The [OWASP secure review guide](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) supports combining manual review with automated checks; [Node's SQLite documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html) explains bound query values. The review rubric is study-specific and requires reviewer training on pilot examples.
