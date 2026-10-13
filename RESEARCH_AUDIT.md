# Research and implementation audit — 13 October 2026

The research aim remains security confidence, reliance and verification during coding-agent use under acceleration and exploration encouragement. The current operational protocol is **natural-2026-10-13-r3**. This audit covers recruitment, allocation, tasks, capture, forms, interviews, security assessment, analysis and the participant portal. It does not report participant results.

## Findings and refinements

| Step | Problem found | Refinement and reason | Status |
| --- | --- | --- | --- |
| Protocol | Root and pilot documents still described the old forced checkpoint flow as current. | Use the natural method, runbook, codebook and analysis plan linked below as one authoritative set. Keep older material visibly historical. | Documentation updated |
| Recruitment | “Junior” and “new to AI” were sometimes treated as equivalent. | Include final-year computing students or developers with 0–2 paid years, with basic JS ability. Measure agent experience; do not assume it from role. | Operational rule documented; researcher screens |
| Consent | Earlier instructions repeatedly treated approval as missing. | Researcher has explicitly confirmed coverage of this revised procedure. Use the approved sheet and actual retention terms. | Approval reported; approved document remains institution-owned |
| Allocation | Rehearsals consume allocation slots; completion can differ by condition/order. | Separate rehearsal/pilot/main records and freeze a fresh main allocation. Preserve assignments and withdrawals; audit realised balance rather than assuming it. | Allocation exists; main-study freeze pending |
| Task manipulation | `AGENTS.md` told the agent to read the assigned condition card. The copied collector also contained task generation logic. | Deliver encouragement to the human through the portal only. Keep agent-facing requirements the same across conditions; package a collector without research allocation logic. This removes an avoidable direct agent-instruction difference. | Implemented in r2 |
| Mode validity | Fast acceptance or many checks could become the definition of the mode being compared on checking. | Code implementation intent independently of checking, confidence and final security. Allow mixed/unclear episodes; treat self-report as supplementary. | Natural codebook added; reliability pilot pending |
| Task realism | Security requirements and closely parallel projects may reduce flaws and create learning effects. | Keep equal explicit requirements, acknowledge a security-salient setting, use fresh agent conversations, counterbalance project/order, collect carryover explanations. | Instructions refined; timing/exposure pilot pending |
| Folder extraction | Capture used the directory basename as task ID; normal `-natural` or `(1)` folder names failed evidence identity checks. | Read the stable ID from `SESSION_INFO.json`; retain the protocol version in captured records. | Implemented and regression-tested |
| Capture scope | Two-second snapshots miss transient edits; chat, video, mouse and human intent are not captured by the watcher. | Publish the actual data inventory. Use video/transcript for provenance and timing, mark gaps, avoid automatic mode or acceptance claims. | Documented; exact-host rehearsal pending |
| Participant guidance | Capture commands were hidden in ZIP instructions; “before security feedback” could discourage participants' own checks. | Show commands and expected files on the task page. Clarify that participants may test freely; ratings precede researcher assessment/debrief. | Implemented |
| Questionnaire timing | Large video uploads delayed the after-task form. | Upload the small final manifest/rating first, answer the form, then transfer media. Task 2 still requires completion of Task 1 evidence and form. | Implemented |
| Progression | Direct API calls could bypass some form/task ordering; submitted tasks could be reopened casually. | Check prerequisites in the API and disable reopening submitted tasks in participant UI. | Implemented; synthetic flow checked |
| Versioning | Repeated downloads regenerated projects from changing source files. | Cache each task's first package, sheets and encouragement with protocol/hash metadata; new versions require fresh accounts. | Implemented; repeated-download check added |
| Evidence integrity | A ZIP signature or receipt cannot establish code contents, readable video or correct ratings. | Independently audit archive manifests/content hashes and rating linkage, then inspect media. Keep transport receipt separate from quality acceptance. | Audit tool added; real files still need review |
| Missing evidence | Current upload gate requires seven files and cannot represent waived/missing evidence or corrected uploads. | Never fabricate a placeholder. Record a deviation and have the researcher resolve the session. An audited replacement/exception UI remains needed before unattended pilots. | Open practical limitation |
| RQ3 | “Known exposed vulnerabilities” was interpreted as guaranteeing insecure output. | Keep original RQ text as history; use the natural operational wording. Analyse confirmed insecure exposures only where they exist; final-code outcomes cover all tasks. | Revised wording documented for supervisor freeze |
| Adjudication | Old candidate oracles were described as a complete assessment of arbitrary natural output. | Use functional tests, bounded attack cases and two blinded security reviews on actual final code. Existing probes provide partial evidence only. | Rubric documented; final-code assessment rehearsal pending |
| Analysis | Controlled proposal exports were still the implied analysis source. | Separate natural feature, exposure and episode tables. Pair at participant level; define missingness and sparse-event limits before main data. | Natural plan, templates and descriptive script added |
| Portal analytics | Legacy exposure charts could be mistaken for natural-task results. | Hide legacy exposure charts in natural mode and label historical imports. Natural analysis currently runs from checked external tables; a native import/dashboard is still needed for portal-only analysis. | Misleading display fixed; native natural analytics open |
| Sample | Thirty was sometimes defended through precedent alone. | Resource-bounded estimation study, 30 completed people; four feature judgments per person are repeated observations. Class interactions remain exploratory. | Justification clarified |
| Claim scope | There is no unaided-programming control group. | Compare the two agent-assisted encouragements; do not claim the study estimates AI versus manual-programming harm. | Documented |
| Delivery | The hosted portal still served an older build when checked on 13 October; its natural evidence route returned an HTML 404. | Added researcher-only raw evidence retrieval, local synthetic permission/hash checks and a hosted natural update guide. Test the updated external route, large upload, retrieval and real capture after deployment. | Code prepared; hosted release and real-host rehearsal pending |
| Local startup | A stale watcher/server could survive a restart, leaving old API behaviour behind updated pages. | Stop managed process trees, retain service PIDs and require the API health response to report natural mode. | Implemented; live restart check required |

## What prior research justifies

- **Mode concept:** Barke et al. describe known-next-step versus option-seeking interactions. The encouragement cards and intent-only coding rules here are our adaptations and require piloting. [Grounded Copilot](https://arxiv.org/abs/2206.15000).
- **Belief and outcome:** Perry et al. motivate collecting security beliefs alongside assessed code. Their assistant, tasks and comparison differ from this study; their effect sizes do not establish ours. [Perry et al.](https://arxiv.org/abs/2211.03622).
- **Evaluation and review:** Khalid et al. isolate code evaluation using selectable suggestions, then review final edits and interview developers. This supports examining decisions and final security, but their controlled task is not evidence that our natural condition manipulation works. [Khalid et al.](https://arxiv.org/abs/2609.21020).
- **Retrospective evidence:** Mozannar et al. use screen replay and retrospective activity labels. Tang et al. combine IDE actions, eye tracking and interviews. Our manual event coding borrows the triangulation principle; it does not reproduce eye tracking or validate mouse speed as mode. [Mozannar et al.](https://arxiv.org/abs/2210.14306), [Tang et al.](https://arxiv.org/abs/2405.16081).
- **Sample and scores:** Resource constraints and sensitivity/precision can justify sample size if reported honestly. Proper probability scores assess forecast accuracy, while calibration requires separate interpretation. [Lakens](https://doi.org/10.1525/collabra.33267), [Gneiting and Raftery](https://doi.org/10.1198/016214506000001437).

These sources justify components, not the whole experiment. The exact JavaScript projects, wording, timing, ratings and coding rules are original instruments. Feasibility, comprehension, condition separation and measurement quality must be demonstrated with our pilot.

## Current authoritative set

1. [Natural method](NATURAL_WORKFLOW_METHOD.md): aim, design, RQ interpretation and session sequence.
2. [Natural analysis plan](NATURAL_ANALYSIS_PLAN.md): units, estimands, scoring, missingness and reporting.
3. [Natural session runbook](study-system/pilot/NATURAL_SESSION_RUNBOOK.md): researcher steps and release criteria.
4. [Natural codebook](study-system/instruments/NATURAL_CODEBOOK.md): episode, verification, provenance and replay rules.
5. [Data coverage](study-system/pilot/NATURAL_DATA_COVERAGE.md): what is automatic, manual or unavailable.
6. [Local participant guide](research-portal/LOCAL_NATURAL_REHEARSAL.md): current portal instructions.

**Release position:** self-rehearsal is appropriate. A supervised feasibility pilot can start after a real host/capture/transfer/retrieval rehearsal and a security-assessment rehearsal pass on the intended route. It does not require already proving the manipulation succeeds—that is a pilot question. Main-study collection additionally requires a frozen protocol, allocation, coding rules and analysis plan. Do not combine r1 rehearsals, r2 pilots and main-study data without explicitly planned compatibility criteria.

**Hosted update:** [HOSTED_NATURAL_UPDATE.md](research-portal/HOSTED_NATURAL_UPDATE.md) gives the environment, storage, Nginx, build and verification steps for the existing VM. The local synthetic portal check now downloads the exact uploaded manifest through a researcher-only route and rejects participant access. The hosted site has not been updated or restarted in this workspace; its real upload size, disk capacity, recording playback and access controls still need verification there.

## r3 conversation capture refinement

The new observer registers fresh study conversations through workspace hooks and polls their documented transcript paths. Raw records, collection timestamps, tool/model metadata, offsets, source revisions and health are preserved. It does not scan personal history, inject messages or alter permissions. The portal validates the observer export and shows record/status metadata; the evidence audit checks its final health footer. Synthetic tests pass for scope, partial lines, duplicate prevention, rewrites, missing records and timestamps. An actual Antigravity/OS rehearsal is still required to demonstrate prompt/reply coverage and source timestamp semantics. See [AGENT_OBSERVER_GUIDE.md](study-system/pilot/AGENT_OBSERVER_GUIDE.md).

## Participant instruction consistency check

The overview, task page, forms, uploads, and packaged START_HERE guide now use the same natural-task sequence. Legacy event upload is hidden and redirects in natural mode. After-task answers return participants to the remaining evidence uploads. See [Participant instructions audit](study-system/pilot/PARTICIPANT_INSTRUCTIONS_AUDIT.md) for the checked surfaces, frozen-package limitation, and native-host rehearsal requirement.
