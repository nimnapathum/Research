# Natural-task evaluation and analysis plan

Working version for natural-2026-10-13-r3. Freeze the main-study version before main recruitment. Rehearsal and feasibility-pilot data remain separate. This plan concerns the two free coding tasks; the old checkpoint export is not its input.

## 1. Units and records

The independent sampling unit is the **participant**. Each person completes two tasks under opposite encouragements. Each task has one SQL and one path feature: at most four final-feature judgments per person, or 120 for 30 completed people. These 120 observations are not 120 independent participants.

Use the CSV headers in `study-system/analysis/natural-templates/`. Preserve raw media, transcripts, hashes and questionnaire responses separately from these human-coded tables.

| Table | One row represents | Required linkage |
| --- | --- | --- |
| `features.csv` | One assigned feature, including an absent/unassessable feature | Participant, task, condition, project/order, class, final hash, rating hash, security and functionality review |
| `episodes.csv` | One interval of implementation intent | Task, start/end, mode, coder, evidence and uncertainty |
| `checks.csv` | One observed check | Task, feature/change, interval, security/generic category, invocation and reviewed result |
| `exposures.csv` | One confirmed or uncertain agent-origin target weakness | Agent action, code hash, actual exposure, inspection, repair and final survival |
| `session_log.csv` | One task/session setup | OS, tool/model/version, start/end, interruptions, capture quality and protocol deviations |

Keep coder 1, coder 2 and adjudicated labels as distinct records. A blank label means not coded yet; `unclear` means examined but insufficient evidence. Record missingness as `not_recorded`, `corrupt`, `declined`, `technical_failure`, `not_implemented`, or `unassessable`, with a note. A missing feature is never silently labelled secure.

## 2. Security adjudication

Give two reviewers anonymised final snapshots without condition, confidence or interview material. Remove `study/SESSION_INFO.json`, rating files and condition metadata from their review copies; preserve the original. Random review IDs reduce condition leakage, but project/content may still identify a task. Record reviewer experience and blinding failures.

Assess **functionality** separately (`pass`, `fail`, `not_implemented`, `unassessable`). For target security use `target_secure`, `vulnerable`, `not_implemented`, or `unassessable`. “Target secure” means no weakness found within the named requirement and tested threat model; it is not a claim of complete software security. Unrelated flaws are recorded separately.

- SQL: trace request input through the endpoint into SQLite; test ordinary values, quotes and an OR-style payload that must not broaden results. Review whether binding is used or an equivalent proven defence exists. Passing one payload is insufficient structural evidence.
- Path: test ordinary files, traversal to harmless outside fixtures, absolute paths, similarly prefixed directories, encoded inputs at the actual decoding layer, and symlink escape where the host supports it. Inspect canonicalisation/containment and errors. Mark unsupported host cases untested. Do not claim protection against races unless evaluated separately.
- Run only in an isolated disposable assessment environment with synthetic data. Restore standard functional tests so participant modifications to tests cannot redefine success. Preserve commands, versions, outputs and snapshot hashes.
- Existing `probe_snapshot.mjs` and candidate oracle can supply evidence for compatible implementations; fixed candidate-pattern expectations do not adjudicate arbitrary natural code. Adapt tests where participants legitimately change the implementation; document every adaptation.

Resolve reviewer disagreement through recorded discussion or a third reviewer. Save the original labels and evidence. Report agreement before resolution and the prevalence of each label; a chance-corrected statistic can be unstable when almost every item has one label.

## 3. RQ1: confidence–security alignment

The rating is the probability that the **exact final feature** meets its stated security requirement, collected after coding and before researcher assessment/debrief. Participants may see their own checks during coding. Convert 0–100 to `p` in [0,1]. For resolved, assessable features use `y=1` for target secure and `y=0` for vulnerable. Compute `Brier=(p-y)^2`; smaller means more accurate probability judgments. Example: 90% on vulnerable code scores .81; 90% on target-secure code scores .01.

Recommended primary estimate: for people with both classes assessable and correctly linked in both tasks, average the two Brier values within each condition, then compute the participant's acceleration minus exploration difference. Report the mean paired difference and a 95% participant-bootstrap interval using a fixed seed and 10,000 resamples. Display individual paired differences and sample counts. This is a conditional estimate for complete assessable pairs; disclose selection if incomplete tasks are common. No significance claim is required for the feasibility pilot.

Report probability distributions on secure and vulnerable features separately, condition/class counts, and mean `p-y` as a descriptive signed gap. The Brier score combines aspects of probability accuracy; it is not pure calibration or an individual trust trait. With only four judgments per person, avoid person-specific calibration curves and an automatic high/low trust label. Pooled reliability bins, if shown, need counts and broad uncertainty, and may be uninformative with sparse outcomes.

Sensitivity: pair each class separately; report confidence and security as separate outcomes where one label dominates; retain all assigned-feature counts and missing reasons. If there are no vulnerable final features, vulnerable-code confidence and discrimination cannot be estimated. Do not manufacture insecure cases to rescue the primary analysis.

## 4. RQ2: final security and natural vulnerability survival

For each condition show all assigned features as functional/target-secure, functional/vulnerable, nonfunctional, not implemented or unassessable. Report participant-paired differences in vulnerability counts with intervals and the raw paired table. Include the joint functional-and-target-secure outcome so removing a feature cannot look like success. Show project and order summaries and incomplete task counts. Bound missing security labels by showing what happens if all unassessable cases are vulnerable versus all target-secure; keep absent functionality separate.

Separately describe **confirmed visible agent-origin vulnerable changes**: identified, inspected, left in place, intentionally repaired, replaced, and surviving in final code. The denominator is actual confirmed exposures. Zero exposed changes means survival is **not estimable**, not 0%. Exposure can itself be affected by the condition, so comparing retention conditional on exposure is observational; it is not the causal effect of the assigned encouragement on all participants. A direct agent edit does not demonstrate conscious acceptance.

## 5. RQ3 and mode analysis

Use the [natural codebook](study-system/instruments/NATURAL_CODEBOOK.md). Summarise checks per task, security-specific checks per target feature, timing relative to agent application and human inspection, intentional repairs, and evidence-supported final status. Include generic checks separately. Associate checks with final vulnerability status descriptively and explain selected sequences through replay interviews. Checking is not randomised: suspicion, knowledge and difficulty can cause both checks and outcomes.

Code mode from implementation intent, without using verification intensity, speed, confidence or final security as label criteria. Compare proportions of observable time in acceleration/exploration/mixed/unclear episodes by assigned condition. Exclude agent-wait time and unobservable gaps from active-mode time, and report them separately. Preserve assignments for the primary comparison even when participants switch mode. Do not drop “noncompliant” people to improve the condition difference.

For replay, select moments using a fixed rule: first material agent change, first verification if present, and one revision or uncertain-intent episode. Include no-check cases. Ask neutral questions before revealing security findings. Use participant explanations as one evidence stream; they can conflict with the recording. Blind coders to outcomes and assignment where practical, and record unavoidable leakage.

## 6. RQ4, sample size and confounding

SQL versus path comparisons are exploratory. Thirty paired participants do not justify a large model with condition × class × experience interactions. Prioritise counts, paired estimates and intervals. A model is optional only if outcome diversity and sample support it; prespecify it before main analysis, check separation and avoid treating episodes as independent people.

Thirty completed participants is a resource-bounded mixed-method estimation target. Justify recording/coding burden and report sensitivity or interval precision for the chosen primary contrast; similar-sized studies provide feasibility context, not statistical power. Recruit replacements for incomplete sessions under a fixed rule unrelated to observed outcomes; retain the recruitment flow and incomplete data permitted by consent. Do not use a small pilot's observed effect as the assumed true effect to justify 30.

Counterbalance the four project/condition/order sequences, log actual allocations and withdrawals, use a fresh conversation per task, and keep agent/model/review settings consistent. Project and learning can still affect outcomes. Report first-task summaries as a carryover sensitivity, with reduced precision. OS, familiarity, training and agent experience are descriptive covariates; avoid post-hoc extensive adjustment with n=30.

## 7. Deliverables and claims

Use `python3 study-system/analysis/natural_summary.py features.csv` for a checked descriptive summary and paired Brier bootstrap. It does not create security labels, mode labels or causal conclusions. Keep outputs with protocol version, source file hashes and script version.

Recommended displays: recruitment/coverage flow; feature outcome counts; paired probability-score plot; confidence distributions split by security label; coded check timelines; mode-time proportions; and a joint table combining behavioural evidence with interview explanations. No participant names, raw transcripts or revealing code are published without the approved procedure.

Source support: probability scoring [Gneiting and Raftery](https://doi.org/10.1198/016214506000001437); explicit sample justification [Lakens](https://doi.org/10.1525/collabra.33267); code-review/interview precedent [Khalid et al.](https://arxiv.org/abs/2609.21020). These analysis choices are this study's adaptations. Register the final questions, primary contrast, exclusions, missingness rules and exploratory analyses before the main sample.
