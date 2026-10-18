# Study guide: security judgments during coding-agent work

**Current research design; main-study procedure with a preceding feasibility pilot. Updated 18 October 2026.** Capture protocol: `natural-2026-10-13-r3`. New task packages: orientation `2026-10-18-v3`, stimulus `2026-10-18-api-contrast-v1`. These are version identifiers, not evidence that the design has been validated. The hosted portal has passed a synthetic delivery/upload test; a complete real-host rehearsal and security-review rehearsal remain release gates. No adjudicated participant findings are reported. Use the institution-approved participant information, consent, withdrawal and retention procedure; approval was reported by the researcher, but the exact approved documents have not been checked in this workspace.

**Read this page first.** It describes the intended **main study** from question to analysis. The feasibility pilot uses the same two-task structure to test whether it is understandable, recordable and assessable. Pilot data and changing versions are kept separate from the frozen main-study dataset. Detailed rules live in the linked documents below; older controlled-checkpoint drafts are historical.

## 1. The question and the contribution

**Aim.** Examine whether early-career developers using a coding agent under acceleration-oriented and exploration-oriented task conditions differ in final-code security judgments, reliance on agent changes, verification, and target vulnerability outcomes. Relate these condition differences to the interaction purposes actually observed during work.

| RQ | Plain meaning | Evidence needed |
| --- | --- | --- |
| **RQ1** Confidence–security alignment | Are participants more or less accurate about the security of their submitted SQL and file-access features under the two conditions? How does this relate descriptively to observed mode? | Two 0–100% final-feature judgments per task, exact final hash, independent security labels, coded mode episodes. |
| **RQ2** Final vulnerabilities | Does the number of target vulnerabilities in final code differ between conditions? When a vulnerable agent change was genuinely exposed, what happened to it? | All assigned final features, functionality and security review, plus separately confirmed agent-origin exposure and repair history. |
| **RQ3** Verification sequence | What security-specific checks did the developer perform before and after working onward with an agent change, and how do these relate to final outcomes? | Screen recording, agent transcript and code timeline, human-reviewed check events, continuation and repair. |
| **RQ4** Weakness class | Do these descriptive patterns differ for SQL injection and path traversal? | The same records separated by class, with actual denominators and uncertainty. |

The full researcher wording and the recommended natural-task refinement of RQ3 are in [RQ.md](RQ.md). In free agent editing there is no guaranteed “keep” click or insecure suggestion. RQ3 therefore uses **observed integration and continuation**. Final confidence concerns the *submitted code*, including human edits; it is not a direct probability that the agent is trustworthy.

Prior work supplies the question's components: [Barke et al.](https://arxiv.org/html/2206.15000v3) observed known-step acceleration and approach-seeking exploration; [Perry et al.](https://arxiv.org/abs/2211.03622) paired AI-assisted security outcomes with users' security beliefs; [Khalid et al.](https://arxiv.org/html/2609.21020v1) studied evaluation, selection, edits and security. The **new contribution, if the study works**, is a within-person comparison of two assigned work structures with linked final-code probability, security review and temporal agent–human evidence. These papers do not validate our exact tasks, manipulation, Antigravity capture or coding rubric.

## 2. The design at a glance

```text
One early-career participant
  → consent and background form → neutral practice
  → Task 1: project A or B, assigned acceleration or exploration
  → exact-code security rating + after-task form
  → common break
  → Task 2: other project and other condition, fresh agent conversation
  → exact-code security rating + after-task and after-both forms
  → neutral replay interview → debrief
  → evidence audit → independent code-security review + behavior coding
  → participant-paired RQ analysis
```

The planned main sample is about **30 completed participant pairs**, preceded by **4–6 feasibility participants**. These are resource-bounded targets, not power guarantees from prior papers. Report actual recruitment, missingness and estimate precision. [Lakens](https://doi.org/10.1525/collabra.33267) supports an explicit resource/precision justification; it does not prescribe this sample size. Eligible participants are final-year CS/IT students or developers with 0–2 paid years who can do basic JavaScript work. Record actual language, security and agent experience. Junior status does not imply AI inexperience or explain every missed flaw. See [eligibility and recruitment](study-system/pilot/ELIGIBILITY_AND_RECRUITMENT.md).

Each person completes one **Resource Catalogue** and one **Support Archive** JavaScript/Node task. Each task asks for an exact SQL filter and a text-file read confined to one folder. Both task briefs state the security boundary, so this is **security-salient** coding. SQL injection (CWE-89) and path traversal (CWE-22) are important and testable; they ranked #3 and #5 in [MITRE's 2024 Top 25](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html). That ranking is **not** evidence that they are the two most frequent coding-agent flaws. See [task design](TASK_DESIGN.md).

The **acceleration-oriented package** supplies familiar Node.js APIs and an implementation map. The **exploration-oriented package** supplies a small unfamiliar record/document interface and a guide to its operations, leaving the route to implementation open. The human orientation card appears in the portal, outside the agent workspace. Both packages have the same feature and security requirements, time allowance, tools and freedom to question, inspect, edit, test or reject agent work. Four allocation sequences balance project, condition and order. See [task contrast](TASK_CONTRAST_DESIGN.md).

This is a **compound work-structure manipulation**: the card and interface vary together. The assigned-condition comparison cannot prove that an internal cognitive state alone caused a security difference. Independently code actual acceleration/exploration *episodes* from implementation intent; people may switch within a task. The familiar/unfamiliar contrast is adapted from [Barke et al.](https://arxiv.org/html/2206.15000v3), while these project packages and cards are ours. The pilot must test mode separation, difficulty and completion before freezing them.

## 3. What happens in each task

1. The researcher records the approved consent reference, pseudonymous participant ID, allocation, host/IDE/model/Node versions and any protocol deviation. The participant completes the nine visible background questions **before** the neutral practice. The natural portal hides two old direct SQL/path recognition items to reduce immediate teaching of the target weaknesses. These are study-created background questions, not an objective security-skill test. See [questionnaire map](study-system/instruments/NATURAL_QUESTIONNAIRES.md).
2. The participant reads the portal task and orientation, downloads that task's frozen `-natural.zip`, opens only that project in Antigravity agent mode, and starts a fresh conversation. The researcher starts the approved Google Meet recording. The local code watcher and agent observer start **before the first measured prompt**. Check a real prompt/reply and initial snapshot without interrupting normal coding. The participant may prompt, inspect, write code, run tools, repair and use permitted documentation freely. No researcher-supplied insecure patch, hidden instruction attack, forced reveal or keep/reject checkpoint is in the current protocol.
3. At “I would submit” or the common time limit, the participant freezes the exact final code and rates the chance (0–100%) that **each** target feature meets its security requirement, with reasons and reliance context. No hidden security feedback is given yet. The rating includes the final snapshot hash. The participant completes seven after-task questions. The portal receives **six task evidence files**; the researcher stores the restricted Meet recording link separately. A file receipt proves transfer, not complete video, transcript or code coverage.
4. A common break precedes the other project/condition. Task 2 uses a fresh project and agent conversation. After Task 2, the participant answers four carryover questions. The researcher conducts a neutral replay interview using predetermined event rules, then follows the approved debrief. The first task's verdict is withheld until both tasks and interview are done. See the [session runbook](study-system/pilot/NATURAL_SESSION_RUNBOOK.md), [interview guide](study-system/instruments/NATURAL_INTERVIEW_GUIDE.md) and [participant portal guide](research-portal/LOCAL_NATURAL_REHEARSAL.md).

## 4. What the evidence can and cannot show

| Source | Supports | Does not establish alone |
| --- | --- | --- |
| Portal assignment/forms and final rating | Assigned condition, self-reported context, exact-code security probability | Observed cognitive mode or agent trust as a stable trait |
| Agent transcript and code snapshots | Prompt/tool sequence, candidate agent origin, code evolution and final hash | What the human saw, understood or endorsed |
| Meet recording and replay interview | Visible navigation, viewed results, checks, timing and recalled purpose | Eye gaze, invisible reasoning, or complete code security |
| Two independent final-code reviews plus ordinary/attack probes | Target functionality and security of the exact final artifact | Full security beyond the specified threat model or human intent |

Code a change's **agent application, human inspection, explicit endorsement (if any), continuation, repair and final survival separately**. Code implementation intent without using speed, check count or security outcome as the label. A security question to the agent is a visible action, but the agent's own reassurance is not independent verification. A normal test is not automatically a SQL/path security check. These rules adapt observation and retrospective methods from [Barke](https://arxiv.org/html/2206.15000v3), [Mozannar et al.](https://arxiv.org/html/2210.14306v5), and [Tang et al.](https://arxiv.org/html/2405.16081v1); the exact file-editing-agent rubric is original. See the [screen-recording evaluation plan](SCREEN_RECORDING_EVALUATION_PLAN.md) and [codebook](study-system/instruments/NATURAL_CODEBOOK.md).

The independent reviewers assess functionality and SQL/path security separately. They receive metadata-masked final code without ratings, interview or stated assignment where practical; the interface may still reveal condition, so record any inferred condition. Use source data-flow reasoning and attack cases; a passing scanner or one test is not a verdict. [OWASP's secure review guidance](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) supports combining manual and automated evidence. Run submitted code only in an externally isolated disposable environment. See the [analysis plan](NATURAL_ANALYSIS_PLAN.md).

## 5. How the four RQs are evaluated

- **RQ1:** join each 0–100 probability to the reviewed security label using the same final hash. Score assessable binary outcomes with a Brier score, average SQL/path within each condition and compare each person's two task averages. Report confidence on secure and vulnerable features separately, counts, missing pairs and uncertainty. Brier measures probability accuracy, combining calibration and discrimination; four judgments do not establish individual trust calibration. [Gneiting and Raftery](https://doi.org/10.1198/016214506000001437) support proper scoring, not our question wording.
- **RQ2:** report every assigned feature as functional and target-secure, vulnerable, nonfunctional, not implemented or unassessable. Compare paired final-vulnerability counts and show denominators. Separately describe the fate of **confirmed visible agent-origin vulnerable changes**. A final flaw need not be agent-caused; zero confirmed insecure exposures means retention among exposures is not estimable.
- **RQ3:** report human-reviewed security-check types and timing before/after application and continuation, with agent-only checks and generic tests separate. Relate them descriptively to final results, with replay examples. Skill, suspicion and difficulty may cause both checking and outcome, so this association is not the causal effect of checking.
- **RQ4:** repeat relevant summaries for SQL and path with class-specific denominators. Treat differences as exploratory if events are sparse; do not fit a complex model just because there are four feature observations per person.

The [analysis plan](NATURAL_ANALYSIS_PLAN.md) specifies estimands, missingness and figures. The [analytics workflow](RQ_ANALYTICS_REVIEW.md) links portal exports with independently resolved video, exposure and code-review tables. Portal charts are descriptive monitoring, not automatically generated cognitive-mode or security verdicts. No participant findings have been established in these documents.

The local portal plots hash-linked ratings, independently reviewed final outcomes and read-only source-change summaries as evidence arrives. After video and transcript coding is reconciled, a researcher can import the five completed coding CSVs on the Analytics page; the portal then runs the existing analysis script and displays mode, check and exposure summaries for that phase. It marks those summaries stale if the underlying feature table changes. The imported labels remain human judgments with their own source records.

## 6. Pilot, main study and defensible limits

| Phase | Uses the same core task sequence? | Purpose | Data handling |
| --- | --- | --- | --- |
| Researcher self-rehearsal | Yes | Prove actual capture, upload/retrieval, playback, hash linkage and review can run on the intended host | Synthetic account; never pool with participants |
| Feasibility pilot (planned 4–6) | Yes, using a recorded version | Test comprehension, mode separation, difficulty, timing, insecure-exposure frequency and coding/reviewer reliability | Keep versions and results separate; revise between sessions only with a logged new version |
| Main study (target about 30 completed pairs) | Yes, with materials frozen after pilot | Estimate the prespecified paired contrasts and explain observed processes | Retain incomplete cases and reasons; report uncertainty and bounded claims |

The [pilot release gates](PILOT_READINESS_AUDIT_2026-10-18.md) must be cleared before a new real-user pilot on the revised packages. The exact approved consent/retention flow, live observer and Meet coverage, reviewer reference cases, and hosted recovery/security maintenance need documented checks. The pilot does **not** have to yield vulnerabilities or significant differences. Before main recruitment, freeze the RQ wording, task cards/interface, forms, time rules, model settings, codebook, security adjudication, exclusions and analysis. Preserve negative or inconclusive pilot findings. See the [pilot release record](study-system/pilot/NATURAL_PILOT_GATE_RECORD.md).

Main limitations remain even after a successful pilot: task conditions combine several changes; repeated ratings/checks can cue Task 2; early-career knowledge varies; explicit security requirements increase salience; natural agent output may offer few insecure exposures; and four final-feature ratings per person cannot establish a stable personal trust trait. These boundaries determine the claims, not post-hoc exclusions.

## 7. Reading path and references

Read in order: **this guide → [RQs](RQ.md) → [task contrast](TASK_CONTRAST_DESIGN.md) → [method](NATURAL_WORKFLOW_METHOD.md) → [questions](study-system/instruments/NATURAL_QUESTIONNAIRES.md) and [interview](study-system/instruments/NATURAL_INTERVIEW_GUIDE.md) → [recording evaluation](SCREEN_RECORDING_EVALUATION_PLAN.md) → [analysis plan](NATURAL_ANALYSIS_PLAN.md) → [session runbook](study-system/pilot/NATURAL_SESSION_RUNBOOK.md).** The [methodology timeline](METHODOLOGY_TIMELINE_AND_JUSTIFICATION.md) expands each decision and the [reference ledger](REFERENCES.md) states precisely what every cited source supports and does not support. Operational hosted status is in [HOSTED_REHEARSAL_STATUS.md](research-portal/HOSTED_REHEARSAL_STATUS.md); it is not research evidence.

Core primary sources are linked at the point of use above: Barke (interaction modes); Perry (security belief and outcome); Khalid (security evaluation); Mozannar and Tang (interaction/validation traces); MITRE (class importance); OWASP (security review); Gneiting–Raftery (probability scoring); and Lakens (sample-size justification). **Our exact manipulation, tasks, instruments, agent observer, timing anchors and linked analysis are original adaptations requiring pilot validation.**
