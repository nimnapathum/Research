# Research validity and analysis workflow

**Working local revision, 18 October 2026.** The new dashboard and report in this document are local only. They contain no participant findings. The study aim is to compare security judgment, reliance, verification and final code security between the two **assigned work-structure conditions**, and relate those patterns to separately observed acceleration/exploration episodes. The card and code interface vary together, so a condition difference is not proof of a mental-state effect.

## Is the collected data enough?

**Potentially, if the raw evidence is complete and coded.** Upload counts, agent-record counts and confidence bars alone cannot answer the four RQs. The final feature must be independently assessed, the confidence hash must match it, and behaviour must be reconstructed from synchronized video, transcript and code history. The portal currently captures or links these streams, but the video, independent review and behavioural coding remain researcher work. A missing event row must never be interpreted as zero without a completed coding record.

| Question | Minimum usable evidence | Result to report | Key validity check |
| --- | --- | --- | --- |
| RQ1: security confidence | Final SQL/path probabilities linked to final hash; resolved target-security labels; complete two-task participant pairs | Participant-paired Brier difference, confidence on secure versus vulnerable code, individual and missing-pair counts | Brier measures probability accuracy, not a stable trust trait; use reliance answers and observed decisions when discussing trust |
| RQ2: final vulnerabilities | Every assigned feature, including absent/unassessable; independent functionality and security review; agent-origin exposure coding where possible | All-feature outcome table, functional-and-secure count, paired vulnerable-feature count; separately, confirmed exposure-to-final flow | An unimplemented feature is not secure; a final vulnerability need not be agent-caused or knowingly accepted |
| RQ3: verification | Complete task-level check coding, agent application/continuation timing, actual result viewing, repairs, final outcome | Checks before/after application and continuation, no-check tasks, descriptive check–outcome table plus replay cases | Checking is observational and may be caused by suspicion or skill; agent-run tests do not equal developer verification |
| RQ4: class differences | Same RQ1–RQ3 data split by SQL/path, with denominators in every cell | Class-specific confidence, final outcomes, checks and confirmed exposures | Sparse or one-class outcomes mean the interaction is not estimable; class claims stay exploratory |

## Literature basis and what is original

- [Barke et al.](https://arxiv.org/abs/2206.15000) observed acceleration as carrying out a known next step and exploration as working out an approach. Our assigned cards/interfaces are a new manipulation; observed mode is coded from intent and replay, never inferred from the card or check frequency.
- [Perry et al.](https://arxiv.org/abs/2211.03622) paired AI-assisted security outcomes with participants' belief in code security. Our two exact-final-feature probabilities, hash linkage and paired condition contrast are study-specific adaptations.
- [Khalid et al.](https://arxiv.org/abs/2609.21020) directly studied how developers select, evaluate and edit AI-generated code using tasks, survey and interviews. Our natural agent edit history and before/after verification coding extend the observed process, but exposure and conscious acceptance cannot be assumed from a file edit.
- [Mozannar et al.](https://arxiv.org/abs/2210.14306) used retrospective coding of AI-assisted programming activity. Our fixed replay moments and explicit coding-status record adapt that practice to agent-edited files and prevent empty rows from becoming false zero counts.
- [Gneiting and Raftery](https://doi.org/10.1198/016214506000001437) support proper scoring of probabilistic judgments. Our Brier contrast combines calibration and discrimination; report the separate secure/vulnerable confidence distributions and avoid individual “well-calibrated developer” labels from four items.
- [Lakens](https://doi.org/10.1525/collabra.33267) supports transparent resource- and precision-based sample justification. About 30 paired participants provide bounded estimates, with RQ4 and check associations exploratory; a pilot effect must not be used as the assumed true effect.

These sources justify components. They do not validate the full task, questionnaire, coding rules or Antigravity capture. Those require the feasibility pilot.

## Workflow for each participant

1. **Confirm evidence quality.** Preserve the six uploads, final rating, package version/hash, transcript and restricted recording link. Run the full archive/hash audit. Record capture failures and task deviations in `session_log.csv`.
2. **Judge the exact final code.** Two reviewers inspect metadata-masked copies and independent functional/attack probes. Save original sheets and disagreements. Enter resolved outcomes against the uploaded final hash in the portal. The reviewers' labels and the tool output remain separate evidence.
3. **Export the feature table.** Choose one phase on Analytics and download the feature CSV. Inspect blanks, hash mismatches, absent tasks and the reviewer provenance. Do not combine rehearsal, pilot and main rows.
4. **Code the process.** Independently code mode episodes and security checks from video, transcript and snapshots, then reconcile. Record agent-origin insecure exposures only when origin and visibility are confirmed. Fill one `coding_status.csv` row per task, even if no check or exposure occurred. Keep original coder files for agreement assessment.
5. **Run the linked report.** Put the six resolved CSVs in a restricted folder and run `python3 study-system/analysis/natural_behavior_report.py FOLDER --phase pilot --markdown-output FOLDER/report.md` (or `main`). Save the printed JSON alongside the readable Markdown. Review warnings and source hashes; report participant counts, feature denominators, complete coding counts and missingness beside estimates.
6. **Interpret with cases.** Select replay examples by the fixed event rule, including no-check and unsuccessful cases. Compare explanations with observed actions. Use self-reported familiarity and task difficulty to examine rival explanations; they are not a substitute for objective baseline skill.

## Pilot decisions to freeze before the main study

- Check whether the intended conditions actually differ in **observed task-level mode shares** while retaining similar completion, usable capture and manageable difficulty. Report the contrast even if weak. Revise the task or claims before main recruitment, then exclude revision-stage pilots from the main estimate.
- Rehearse secure/vulnerable reference implementations for both weaknesses, two-reviewer agreement, interview prompts and the no-event coding rule. Pilot the separation between agent action, human inspection, continuation, explicit endorsement and deliberate repair.
- Check how often the agent exposes a confirmed insecure target change. If it is rare, RQ2 still answers final-security differences, but exposure retention has an empty or tiny denominator. A later controlled-exposure study would be a separate design and dataset.
- Specify the primary Brier contrast, the RQ2 paired vulnerability count, exclusions, incomplete-pair sensitivity, class summaries, coder agreement method and any interview/knowledge probes **before** the main sample. Do not add a participant-facing security quiz to the approved flow without checking the ethics-approved materials; a post-task quiz would also reflect learning during these tasks.

The current local analytics page is a research workbench. The phase-specific CSV and `natural_behavior_report.py` create the analysis trail; they do not generate mode/security labels or causal claims.
