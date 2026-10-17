# Methodology timeline and justification ledger

**Study:** Security judgments and verification during coding-agent use under acceleration and exploration encouragement

**Working protocol:** `natural-2026-10-13-r3`
**Document status:** Design and pilot plan, 15 October 2026. No participant results are reported here. Freeze a dated main-study version after the feasibility pilot.

This is the single, chronological explanation of what happens, what is measured, why each choice was made, and which part comes from earlier research. It describes the **current natural coding study**. The former forced-proposal/checkpoint study in `archive/2026-10-13-controlled/` is historical. Its keep/reject form, preset vulnerable patches, and checkpoint timing are **not** current participant steps. The source papers support components of this design; none validates this entire experiment in advance.

## 1. Research logic in one page

**Aim.** Examine whether developers using a coding agent under acceleration and exploration encouragement differ in security judgments, reliance on generated changes, verification, and alignment of security confidence with assessed code security.

| Question | What would answer it | Important boundary |
| --- | --- | --- |
| **RQ1.** How does alignment between developers' security confidence and assessed code security differ between the two conditions, and how does it relate to observed interaction mode? | Two 0–100% security judgments on each task's exact final snapshot; independent feature-security labels; separately coded mode episodes. | A probability judgment about code is not, by itself, general trust in the agent. The condition is assigned; mode is observed and may change during a task. |
| **RQ2.** How do the two conditions affect whether target vulnerabilities remain in final code? | Every assigned final SQL and path feature, including missing and nonfunctional features; a separate history of confirmed insecure agent-origin changes where observable. | A final flaw is not necessarily agent-caused. Natural coding does not guarantee an insecure agent output. |
| **RQ3.** How do security checks before and after observed integration of agent changes differ, and how are they associated with final vulnerabilities? | Video, conversation and code sequence; independently coded checks, human inspection, continuation and repair. | Checking is not randomized. An association with final security is not a causal effect of checking. “Integration” replaces the old forced “provisional keep” click. |
| **RQ4.** Do these patterns differ for SQL injection and path traversal? | The same outcomes split by the two feature classes. | With about 30 people, class interactions are exploratory and may be too sparse. |

**Why this question is valid.** [Barke et al.][S1] observed acceleration and exploration as different programmer intentions with Copilot. [Perry et al.][S2] measured both code security and participants' beliefs and found that they can diverge. [Khalid et al.][S3] directly studied how developers choose, evaluate and edit AI-generated code for security. Our question joins these strands in a free-editing agent workflow. The contribution is a **paired condition comparison plus linked belief, interaction and final-code evidence**, not the discovery that developers sometimes miss vulnerabilities. [Lee and See][S4] supply the appropriate-reliance rationale. These are inferential links between separate literatures, not a previously validated “cognitive mode causes vulnerability” theory.

**What is borrowed versus original.** We borrow the *concept* of acceleration/exploration from Barke, the security-belief/outcome pairing from Perry, the attention to evaluation and final edits from Khalid, and contextual replay from [Mozannar][S5] and [Tang][S6]. Our short encouragement cards, paired JavaScript projects, exact final-hash rating, Antigravity capture method, codebook, and estimands are **original adaptations**. Their validity is a pilot question. We do not claim to read an internal mental state from mouse movement, prompt length, speed or an IDE extension.

## 2. Timeline at a glance

| When | Participant/researcher activity | Output used for analysis |
| --- | --- | --- |
| Before inviting people | Freeze materials; test portal, agent capture, video, uploads and security oracle on the actual host | Versioned protocol and rehearsal log |
| Recruitment and consent | Screen early-career developers; use approved information/consent and recording procedure | Eligibility, consent reference and recruitment flow |
| Before Task 1 | Create pseudonymous account; assign one of four balanced sequences; pre-task form; neutral practice | Assignment, background and capture-readiness record |
| Task 1 | Show one orientation to the human; open one project; start recording/observers; complete SQL and path features with an agent | Prompts, responses, file history, video, checks, first task outcome |
| Immediately at Task 1 finish | Freeze exact code; record two security probabilities and reasons before researcher feedback; after-task form; upload evidence | Linked final hash, ratings, contextual answers and evidence receipts |
| Task 2 | Short common break; other project and other orientation; repeat, with fresh conversation and no security feedback from Task 1 | Second paired task and outcome |
| After both tasks | Carryover form; neutral replay interview; then debrief | Self-report and explanation tied to observed episodes |
| After session | Audit evidence; blinded functionality/security review; double-code interaction; analyse participant-paired outcomes | Reviewed tables, missingness, uncertainty and bounded conclusions |

**Initial timing allowance:** roughly 10 minutes for setup/practice, up to 30 minutes of coding per task, a 5-minute break and 15–20 minutes for forms/replay. These are **our feasibility starting values**, not published thresholds. Pilot timing may change them once, before the main-study freeze. Record coding time separately from setup, upload and interruption time.

## 3. Before recruitment: make the experiment runnable

### 3.1 Freeze the study object and threat model

The two projects are small Node.js/JavaScript HTTP services with synthetic SQLite data and files. Each asks for an exact database filter and restricted text-file read. The security target is limited to **SQL injection (CWE-89)** and **path traversal (CWE-22)**. MITRE ranked them #3 and #5 in its **2024** Top 25 [S7]. That ranking establishes real-world importance, **not** that these are the two most common AI-generated weaknesses. Two classes fit two short tasks and support interpretable, repeatable attack cases. [CodeQL's SQL and path guidance][S8] provides recognizable source-to-sink patterns; the actual project features and tests are our design.

Make ordinary feature tests visible to participants. Keep independent attack fixtures and reviewer rubric outside participant packages. The tasks explicitly say that SQL values must remain data and file reads must stay in the allowed root. This gives both conditions the same security requirement. It also means the study measures **security-salient coding**, not whether a person spontaneously thinks of security when no one mentions it. We keep the two classes in **both** projects so class is not confounded with condition or project.

### 3.2 Calibrate the instruments before a real pilot

Run a complete synthetic session on the **same Antigravity version, OS route, portal and recording method** intended for participants. Confirm a readable prompt, agent reply, edit, test, video, final snapshot, rating, upload and researcher retrieval. Check clock alignment and what the official transcript actually contains; raw record count is not proof of complete prompts or visibility. Rehearse the security rubric on one secure and one vulnerable reference solution for **each** class and an actual free-form agent output. This is an **original quality gate** justified by the fact that the exposure, outcome and timing claims fail if these streams are missing. [CodeWatcher][S9] and [Tang][S6] support the feasibility of IDE traces, while neither validates Antigravity's exact capture fields. The current portal's upload receipt verifies transfer and hash, not content quality.

Use 4–6 feasibility sessions from the intended cohort to test instructions, duration, capture completeness, condition separation, question comprehension, coder agreement and the frequency of actual insecure agent changes. This count is a **resource-based pilot choice**, not an effect-size argument. Exclude revision-stage pilots from the frozen main analysis. A pilot finding of few/no insecure exposures or weak encouragement separation is a valid finding: narrow the claim or build a separate controlled study rather than planting flaws after seeing the data.

## 4. Recruitment, consent and assignment

**Cohort.** Recruit final-year CS/IT students and developers with 0–2 paid years, provided they can perform basic JavaScript work. Record actual agent experience; being junior does **not** imply being new to agents or security. [Danilova et al.][S10] show why programmer identity/ability needs screening rather than a role label alone; [Kaur et al.][S11] show how security-study conclusions depend on recruitment source. Our precise 0–2-year boundary and local cohort are **scope choices**. They support conclusions about early-career developers in this setup, not all professional developers. The pre-task familiarity questions and observed practice reduce, but do not eliminate, skill confounding. A missed flaw must not be described automatically as overtrust.

**Consent and identity.** Use the institution-approved information sheet and withdrawal/recording process. The researcher has reported ethics approval; the portal login is not consent. Give each person a pseudonymous account and avoid names or personal repositories in study files. Log consent reference, withdrawal and data-retention handling separately from analysis tables. This is a necessary research-ethics and data-integrity decision, not a trust metric.

**Two-task assignment.** Each participant performs one acceleration-encouraged and one exploration-encouraged task. Allocate across four sequences: A-acceleration then B-exploration; A-exploration then B-acceleration; B-acceleration then A-exploration; B-exploration then A-acceleration. Record both intended and realised assignment, abandonment and replacement. This **within-person, counterbalanced design is ours**: each participant serves as their own comparison while project and order are spread across conditions. It does not remove learning, fatigue or all project effects. Give a common break, fresh agent conversation and no security feedback between tasks; ask about carryover afterward. Preserve assigned condition in the primary comparison even when a participant works in the other observed mode.

Keep agent/model version, permissions, review settings, time allowance, tests and security wording as equal as feasible. Log deviations, quota failures, outside rules/extensions and researcher assistance. An agent that changes between tasks can change both output and checking behaviour; hiding that change would weaken causal interpretation.

## 5. Pre-task questionnaire: exactly what each item is for

The natural portal shows **9 background items** from [`forms.json`](study-system/instruments/forms.json). It filters the old `sql_baseline` and `path_baseline` attack-recognition items because they may teach the two target flaws immediately before coding. The questions below are **study-specific descriptive items**, not a validated trust, expertise or cognitive-mode scale. Pilot their wording. Never use the answer to a familiarity item as an objective security-skill score.

| Item ID and question topic | Why collect it; source or rationale | Use and limit |
| --- | --- | --- |
| `role`: final-year student, junior engineer, both or other | Define the target cohort; recruitment/screening concern in [Danilova][S10] and [Kaur][S11]. | Report sample; confirm eligibility manually. A role is not skill. |
| `paid_years`: years of paid development | Make “junior” operational and expose experience variation; [S10], [S11]. | Descriptive eligibility/context; do not treat student work as zero programming experience. |
| `js_familiarity`: 1–5 | Both projects use JS/Node; unfamiliar syntax could cause delay or errors unrelated to trust. **Original control item.** | Describe context, inspect imbalance; self-report only. |
| `sql_familiarity`: 1–5 | SQL understanding may affect the SQL feature and flaw recognition. **Original control item** tied to the task. | Interpret SQL results, not a validated competence test. |
| `files_familiarity`: 1–5 | Path/file API understanding may affect the restricted-read feature. **Original control item** tied to the task. | Interpret path results, not a validated competence test. |
| `security_training`: none / some / substantial | Prior training is an alternative explanation for checking and vulnerability outcomes; security-experience measurement is relevant in [Kaur][S11]. | Descriptive/sensitivity context, not a precise knowledge score. |
| `agent_frequency`: recent use of file-editing agent | Familiarity with agents may affect reliance and workflow; [Barke][S1] observed participants with differing assistant experience. | Record frequency; no assumption that juniors are AI novices. |
| `antigravity_use`: prior use of this IDE's agent mode | Tool-specific familiarity can affect setup and interaction. **Original host-control item.** | Explain unusual behaviour/capture failures; not a trust scale. |
| `review_frequency`: usual inspection of agent-changed lines | Baseline habit may explain later inspection; trust/acceptance depends on context in [Wang][S12] and [Brown][S13]. | Compare reported habit with observed session; self-report is not proof of an action. |

The removed `sql_baseline` and `path_baseline` questions remain in the shared JSON for the **historical controlled procedure**; they are not served in natural mode. If an objective security baseline becomes essential, develop a neutral separate screener before main recruitment or measure knowledge after both tasks and label it *post-task knowledge*. Do not quietly reinsert target attack hints in one condition.

## 6. Neutral practice and setup

Before either measured task, every participant completes the same approximately five-minute, nonsecurity practice in a throwaway `label.mjs` file: ask the agent to explain a small function, ask it to trim spaces, run one command, locate the reply and save a short recording sample. The researcher checks that the participant can use the agent and collection tools. This is an **original procedural control**: it reduces variation from tool setup and makes missing recording visible before measured coding. [Tang][S6] used observed IDE actions and interviews, supporting the general need to record how a person interacts; their exercise does not validate ours. Practice teaches neither SQL defences nor path containment. Save practice records separately and do not score them as study outcomes.

Before the first task prompt, record OS, Node/Antigravity/model versions, review settings, relevant extensions/global rules, input device, interruptions, task clock marker and capture status. The researcher may help with setup only. These fields support reproducibility and missing-data interpretation; they are **study-specific session metadata**, not behavioural measures.

## 7. Measured Task 1: what the person actually does

### 7.1 Projects and feature equivalence

| Project | SQL feature | File feature | Common security requirement |
| --- | --- | --- | --- |
| **A, Resource catalogue** | `GET /resources?topic=...`: exact topic matches sorted by title; unknown/empty gives an empty list; absent parameter preserves the full list. | `GET /previews?name=...`: return UTF-8 from an existing file under `previews/`; missing file gives not found. | Request value cannot change SQL structure; requested file cannot escape the allowed folder, including through a symlink. |
| **B, Support archive** | `GET /tickets?status=...`: parallel exact status filter. | `GET /attachments?name=...`: parallel restricted read under `attachments/`. | Same two rules. |

The small synthetic services, matching feature pairs, Node built-in SQLite and visible ordinary tests are **original task designs**. They keep data and evaluation bounded while allowing genuine agent editing. SQL injection has direct precedent in Perry's participant study [S2]; SQL/path severity and evaluable mechanisms are supported by [MITRE][S7] and [CodeQL][S8]. Both features may be coded in any order. `npm run test:q1`, `npm run test:f1` and `npm test` check ordinary behaviour; passing them does **not** establish target security. The researcher later uses independent attack tests and review. The task packages contain no hidden insecure patch or intentionally poisoned Markdown. `AGENTS.md` gives the **same project/security requirements** in both conditions. A poisoned instruction/example would be a separate manipulation requiring its own randomization, consent/debrief and provenance analysis, not a hidden addition to this design.

### 7.2 Assigned encouragement versus observed mode

For **acceleration encouragement**, the portal asks the participant to choose the next implementation step and use the agent to carry it out. For **exploration encouragement**, it asks the participant to use the agent to work out or compare an approach and then choose. This is an **original, short manipulation adapted from Barke's observed meanings** [S1]. Both groups can ask questions, inspect, edit, test, reject, repair and change plans. We do not prescribe prompts, rush anyone or suppress review. The card is shown to the **human in the portal**, outside the agent package, so agent-facing instructions are comparable. A participant's own prompt may naturally disclose their goal to the agent.

Observed mode is coded later from evidence of **implementation intent**: a specified next step suggests acceleration; working out an approach or unfamiliar API suggests exploration. Mixed and unclear intervals are allowed. Mode is **not** coded from speed, check count, security result, task card or confidence; doing so would make RQ3 circular. [Barke][S1] supplies the conceptual distinction; episode rules and the manipulation check are ours. The pilot must test whether the card changes observable intent at all. If not, the assigned-condition contrast remains an encouragement comparison, and the observational mode analysis is limited.

### 7.3 Capturing work without forcing a proposal decision

Participant opens the fresh project in Antigravity agent mode and starts the workspace conversation observer, code watcher and approved screen recording **before the first prompt**. The agent may edit from that first prompt. The code watcher stores an initial state and changed source snapshots about every two seconds; the observer preserves registered raw conversation/hook records; video shows what was visible and what the human did. The participant may inspect code, run ordinary or security tests, consult documentation, use a scanner, and repair or replace agent changes. [Mozannar][S5] and [Tang][S6] motivate combining trace/context/replay; [CodeWatcher][S9] is a technical precedent for editor telemetry. Our Antigravity observer and snapshot cadence are engineering choices. An exact-host rehearsal must prove their coverage. Two-second snapshots can miss transient edits, and neither watcher captures unsaved buffers, gaze, every IDE focus change or a conscious acceptance click.

There is no forced keep/reject click. An agent file edit is **agent application**, not human endorsement. Record visible human inspection, explicit endorsement, continuation with the change, intentional repair and final survival as separate events. A person continuing after an edit is a reliance proxy only when the sequence supports it. This distinction follows the evaluation concern in [Khalid][S3] and the visibility/provenance cautions in [Tang][S6], while the event definitions are our codebook.

### 7.4 Raw data and derived metrics from each task

The following table is the **complete current measurement contract**. “Automatic” describes collection software, not validity of an inferred psychological construct. Keep raw data, human labels and computed metrics separately. Source coverage and limits are in [`NATURAL_DATA_COVERAGE.md`](study-system/pilot/NATURAL_DATA_COVERAGE.md).

| Field or metric | Collected by / derivation | Why and source | Interpretation guardrail |
| --- | --- | --- | --- |
| Participant/task ID, project, condition, order, protocol version | Portal allocation and `SESSION_INFO.json` | Link two repeated tasks, preserve assignment and version; **original reproducibility requirement**. | Assignment does not certify observed mode. |
| Host, model, IDE, Node, review settings, interruptions and help | Researcher session log | Detect setting/technical alternatives to behaviour; **original control**. | Context fields, not outcomes. |
| Task, first-prompt, last-coding, finish and feedback times | Researcher/video/observer clock alignment | Define active windows and rating-before-feedback; [Mozannar][S5] motivates temporal session analysis. | Portal timestamps are not automatically active coding time. |
| Raw prompts, visible replies, agent tool/edit/test records, conversation ID and source/collection times | Registered observer and screen video | Interpret participant goal, agent contribution and checks; [Barke][S1], [Mozannar][S5], [Tang][S6]. | Raw records may include internal tool text; do not equate record count with human turns or awareness. |
| Initial, changed and exact final source snapshots; file and snapshot hashes | Code watcher and final snapshot | Trace change provenance/repair and bind rating to code; [Khalid][S3] examines selection then final edits; hashing is **our integrity method**. | A file diff alone cannot prove who intended, saw or accepted a change. Watcher may omit files. |
| Screen video and common clock marker | Approved recording; manual review | Establish visible review, prompts, checks and result interpretation; [Mozannar][S5], [Tang][S6]. | Screen visibility is not gaze. Missing video is missing evidence, not “no check.” |
| Agent-applied, human-inspected, explicitly-endorsed, continued, overwritten, intentionally-repaired, final-survived events | Two coders link video, transcript and snapshots | Separate output exposure from human reliance and repair; [Khalid][S3], [Tang][S6]; exact labels **original**. | Record `unknown` origin/uncertain timing instead of inferring. |
| Verification event: actor, class, category, start/end, result reviewed, issue identified, relation to integration | Manual codebook | Address RQ3; [Tang][S6] studies validation/repair, [Khalid][S3] studies security evaluation. | Agent-run test and developer-reviewed result are separate; promised checks do not count. |
| Mode episode: acceleration/exploration/mixed/unclear, boundaries, active/waiting and evidence | Two coders using traces, video and later replay | Address condition fidelity and RQ1 mode relation; concept [Barke][S1], replay [Mozannar][S5]; rules **original**. | Code intention independently of security checks/outcome. |
| Counts/duration of security checks, generic reviews and functional tests; first-check timing | Derived from coded events | Describe verification patterns; [Tang][S6]. | Timing is interval-valued when the source is coarse; no invented acceptance latency. |
| Confirmed agent-origin insecure exposure and later survival | Change lineage plus independent security review | RQ2 retention subset; [Khalid][S3] motivates distinguishing candidate evaluation and final edit. | Denominator is actual confirmed exposures; zero exposure means “not estimable.” |
| Upload receipt, SHA-256, size, health and playback status | Portal plus researcher audit | Prove linkage and detect missing/corrupt streams; **original integrity control**. | Receipt does not prove readable or complete evidence. |

Security checks use the following categories from the **original natural codebook**: input-to-sink/dataflow inspection, security-directed agent question, attack test, scanner finding actually reviewed, security repair and recheck, generic diff/code review, ordinary functional test, and documentation consultation with its purpose. [Tang][S6] supports observing validation and repair; [OWASP][S14] supports combining manual and automated review. Code each with actor and observed result. A security scanner is **optional for participants**; researcher scanning is supplementary to adjudication. No SonarQube or Snyk alert alone becomes the ground truth.

## 8. At the end of each task: exact code and security judgment

At “I would submit” or the common time cap, wait for the agent to be idle and stop editing. Run the final snapshot command, then the rating command. `study/rate.mjs` reads the manifest and writes a rating JSON containing the final snapshot hash and timestamp. The participant may have run their **own** security checks during coding; only the **researcher's hidden assessment and debrief** are withheld until after both tasks/interview. This avoids post-feedback contamination of the measured belief. [Perry][S2] motivates measuring belief with code security; the exact hash binding is **our design improvement** over a vague “do you trust AI?” item.

| Rating item saved for **each task** | Why this item exists; provenance | How it is used |
| --- | --- | --- |
| `sql_probability_pct`: 0–100% chance exact SQL feature meets stated security requirement | Outcome-linked security belief; Perry [S2]. Probability scale and wording are **our adaptation**, with [Brier][S15] supporting scoring. | RQ1, paired with blinded SQL label for that hash. |
| `sql_reason`: why that estimate | Reveal cues and uncertainty; evaluation/interview approach in [Khalid][S3], [Wang][S12]. **Original wording.** | Qualitative context; not a correctness score by itself. |
| `path_probability_pct`: same for restricted file feature | Same rationale; equal chance to rate both classes. | RQ1/RQ4, exact path-feature label. |
| `path_reason`: why that estimate | Same rationale as SQL reason. | Qualitative context and interview prompt. |
| `submit_as_is`: yes/no/unsure | Separate willingness to submit from security probability; appropriate reliance concept [Lee and See][S4]. **Original item.** | Descriptive reliance signal; “no” does not change the rated snapshot. |
| `agent_shaped`: which parts agent materially shaped | Clarify participant's perceived agent contribution; [Khalid][S3] follows selected and edited suggestions. **Original item.** | Compare with traced provenance; not proof of origin. |
| `relied_on_agent`: whether agent influenced the security judgment and why | Distinguish code confidence from trust in the agent; [Lee and See][S4], [Wang][S12]. **Original item.** | Interpret RQ1 and replay; self-report may conflict with action. |

The stored `participant_task_id`, `project_id`, `protocol_version`, `final_snapshot_sha256` and `rated_at` are **linkage/integrity fields**, not questionnaire constructs. They prevent a judgment about one draft from being scored against another. The portal checks manifest/rating hash agreement, then records evidence receipts. A participant can say they would not submit and still give a probability for the exact final snapshot.

## 9. Immediate after-task questionnaire: all seven items

After the small manifest and rating are uploaded, the participant answers these before transferring larger video/code files. The form is brief to limit delay between action and account. All seven are **study-authored single items**, not a validated multi-item scale. In particular, difficulty/time-pressure items are **not** a NASA-TLX score, although NASA-TLX's workload dimensions motivate collecting this context [S16].

| `forms.json` item | Why; source | Interpret as |
| --- | --- | --- |
| `known_next_step` (1–7): how often they knew the next step before asking | Acceleration manipulation check adapted from [Barke][S1]. | Retrospective task description, cross-checked with coded episodes. |
| `sought_options` (1–7): how often they sought approaches/unfamiliar API knowledge | Exploration manipulation check adapted from [Barke][S1]. | Retrospective description; may coexist with known steps. |
| `task_familiarity` (1–7): initial familiarity | A familiar problem may produce acceleration without card influence; **original confound item**. | Context, not observed mode. |
| `task_difficulty` (1–7): felt difficulty | Difficulty can change agent use, checking and final security; workload rationale [NASA-TLX][S16], exact item **original**. | One perception, not a validated workload score. |
| `time_pressure` (1–7): felt pressure | Pressure may affect review even with equal clock time; temporal-demand rationale [NASA-TLX][S16], exact item **original**. | Context; do not equate with objective task duration. |
| `agent_reliance` (1–7): overall reliance on agent changes | Trust/reliance distinction [Lee and See][S4], developer trust context [Wang][S12]. | Supplement to code-specific confidence and observed behaviour. |
| `mode_example`: concrete known-plan versus approach-finding part | Elicit a specific episode using [Barke's][S1] definitions; **original open item**. | Candidate replay moment; not final mode label. |

Upload the remaining capture ZIP, capture health JSON, final code ZIP, agent transcript JSONL and screen recording, then mark the task submitted. The **seven-file evidence package** and hash receipts are a study-specific provenance/quality design; file transfer is not a scientific outcome. Keep originals until the researcher validates them. Missing, corrupt or declined evidence gets an explicit reason. Never replace it with a synthetic placeholder.

## 10. Task 2 and after-both questionnaire

After a common short break, the participant receives the **other project and other orientation**, with a fresh conversation and identical setup/finish rules. The researcher does not disclose Task 1 security findings. The same person thus supplies a paired comparison, while order/project are distributed across people. A learning effect can still occur; report first-task summaries and the answer to `carryover`. Task 2 is not a replication on an identical program: parallel projects reduce memorization but introduce residual project differences. Those are design trade-offs, not literature-derived guarantees.

| After-both item | Why; source | Use and limit |
| --- | --- | --- |
| `carryover`: what Task 1 taught that affected Task 2 | Directly probe crossover learning; **original validity item**. | Explain sequence effects; retrospective account does not remove them. |
| `agent_review_change`: whether review approach changed | Detect self-reported change in verification across tasks; [Tang][S6] motivates validation behaviour, wording **original**. | Compare to coded checks, without assuming accuracy. |
| `general_trust`: willingness to rely on code without another security check (1–7) | Appropriate-reliance theory [Lee and See][S4] and developer trust [Wang][S12]. | Broad context only; never replace feature probabilities or claim a validated trust score. |
| `additional_notes`: decisions or tool events to discuss | Capture unanticipated confounds and interview targets; **original open item**. | Qualitative context, not a new outcome invented after results. |

## 11. Replay interview: explain particular moments before debrief

Use a **fixed clip-selection rule**: first material agent change, first verification if present, and a revision or uncertain-intent moment. Include no-check cases; do not choose only dramatic failures or successful repairs. The researcher prepares clips without using the final security label or confidence when practical. Ask the same neutral prompts for each relevant moment: (1) What were you trying to do? (2) Did you already have an approach? (3) What did you expect the agent to do and what did it do? (4) What did you understand about this change? (5) When did you decide to continue with it? (6) What did you inspect or test, and what did the result mean? (7) Did the task guidance match how you worked? (8) Did Task 1 affect Task 2? These probe implementation intent, perceived agent contribution, integration, verification, manipulation fidelity and carryover respectively. [Barke][S1] motivates the intent probes; [Mozannar][S5] supports retrospective session labeling; [Khalid][S3] and [Tang][S6] support asking about evaluation/repair. **The clip rule and exact wording are our instrument**, not a published validated interview set.

Record after both tasks and **before revealing vulnerabilities**. Do not ask “Why did you miss the flaw?” while collecting an unbiased explanation. Link clip time, task, code change and quote. Keep interview recollection separate from contemporaneous evidence because memory and hindsight can disagree with the video. Debrief afterward under the approved procedure. The older [`INTERVIEW_GUIDE.md`](study-system/instruments/INTERVIEW_GUIDE.md) contains controlled-proposal wording; the **natural codebook's replay questions** govern this protocol.

## 12. Evidence audit and independent outcome assessment

Before coding outcomes, audit every task ID, version, final hash, rating hash/time, upload hash, snapshot coverage, transcript prompt/reply coverage, watcher health, video playback and form completion. The software's `audit_natural_evidence.py` checks machine-verifiable links; a person still checks media and missing periods. Classify missingness (`not_recorded`, `corrupt`, `declined`, `technical_failure`, `not_implemented`, `unassessable`) instead of counting an absent check or feature as secure. Keep raw material access restricted, with approved retention/deletion and withdrawal records. These are **original evidence integrity rules** required by the multimodal inference.

Two reviewers receive anonymized final snapshots **without condition, confidence or interview**, as far as practical. They label functionality (`pass`, `fail`, `not_implemented`, `unassessable`) separately from target security (`target_secure`, `vulnerable`, `not_implemented`, `unassessable`). For SQL, trace the request into the SQLite sink, inspect parameter binding or equivalent defence, and run ordinary, quote and OR-style attempts that must not broaden results. For path, test ordinary files, traversal, absolute and similarly prefixed paths, decoding at the actual layer and symlink escape where supported; inspect canonicalization and containment. Record unsupported cases and do not claim race resistance unless tested. Restore standard functional tests so participant-edited tests cannot define success. Resolve disagreements with recorded discussion or a third reviewer, retaining original labels and evidence. [OWASP][S14] supports manual plus automated review; [CodeQL][S8] supplies known classes and checks. The **task-specific test set and adjudication rubric are ours** and must pass the rehearsal. A scanner warning alone is neither proof of vulnerability nor proof of safety; the target label is bounded to the tested threat model, not complete software security.

Review actual agent-origin change history separately from final code. A “confirmed exposed vulnerability” needs a vulnerable change, evidence it came from the agent, and evidence it was actually applied/visible in the session. Code inspection, endorsement, continuation, repair and final survival separately. If origin or visibility is unknown, keep `uncertain`; do not convert it into accepted AI vulnerability. This prevents RQ2 from equating a human-written final flaw with agent-caused retention.

## 13. Coding reliability and analysis after adjudication

Two coders independently mark **all pilot sessions** for mode boundaries, checks and change/inspection events. Revise the codebook with examples. For main data, double-code a prespecified **at least 25%** spanning all four sequences and no-check/repair cases; double-code more if ambiguity remains. The 25% is a **resource choice**, not a universally validated threshold. Record independent labels, raw agreement, prevalence, an appropriate chance-corrected agreement measure where informative, and adjudicated labels. [Mozannar][S5] and [Tang][S6] motivate contextual activity coding; our labels and coverage target need pilot reliability evidence.

| Analysis output / denominator | Why and source | Reportable conclusion and limit |
| --- | --- | --- |
| **RQ1 probability accuracy:** for assessable final features, `p = rating/100`, `y=1` target-secure or `0` vulnerable, Brier = `(p-y)^2`; average SQL/path within each condition, then each participant's acceleration minus exploration difference. | Proper probability scoring [Brier][S15] and [Gneiting–Raftery][S17]; paired design is ours. | Mean paired difference and participant-bootstrap 95% interval; denominator is people with linked assessable paired features. Brier combines calibration and discrimination; do not call it pure calibration or a person-level trust trait. |
| **RQ1 interpretation:** confidence distribution for secure and vulnerable features separately, signed `p-y` gap, counts/missingness. | Perry [S2] motivates beliefs versus outcomes; separate strata avoid a single score hiding overconfidence on vulnerable code. | If no vulnerable finals occur, vulnerable-code confidence/discrimination is **not estimable**. |
| **RQ2 all assigned features:** functionality × target security per condition/class; participant-paired vulnerability counts; joint functional-and-secure count. | Final code assessment [Perry][S2], selection/edit distinction [Khalid][S3]; outcome table ours. | Denominator includes all assigned features, with absent/unassessable shown; deleting a feature is not counted as secure repair. |
| **RQ2 exposure survival:** confirmed insecure agent-origin changes that remained, were repaired, replaced or removed. | Evaluation/edits [Khalid][S3]; exposure lineage ours. | Conditional, observational subset; zero confirmed exposures means no survival-rate estimate. |
| **RQ3 checks:** number/type/timing of participant security checks, generic reviews and functional tests; agent checks separately; final feature status and example sequences. | Validation/repair [Tang][S6] and security evaluation [Khalid][S3]. | Describe associations, with skill, suspicion and difficulty as plausible common causes; no causal checking claim. |
| **Observed mode:** proportions of **observable active** time in acceleration/exploration/mixed/unclear by assigned condition, with waiting/gaps separate. | Mode concept [Barke][S1], retrospective trace interpretation [Mozannar][S5]. | Describes fidelity/variation. Do not reclassify assigned groups by outcome or pretend every prompt reveals intent. |
| **RQ4 SQL versus path:** repeat core displays per class; project/order and first-task sensitivity summaries. | MITRE/CodeQL justify classes [S7], [S8]; comparisons ours. | Exploratory; sparse data may prevent any reliable interaction estimate. |
| **Coverage and sample flow:** recruited, eligible, consented, assigned, completed, assessable and missing by reason; host versions and capture quality. | Transparent sample justification [Lakens][S18], recruitment limits [Kaur][S11]; fields ours. | Show what data support each result and how incompleteness may bias it. |

The target is **30 completed people**, not 120 independent observations: each person can provide up to four final-feature judgments. Thirty is a resource-bounded mixed-method estimation target; [Lakens][S18] supports explaining resources, precision and sensitivity explicitly, **not** treating 30 as automatically powered because another study used a similar sample. A small pilot's observed effect is too unstable to use as a guaranteed main-study effect. Prespecify the primary paired contrast, missingness, bootstrapping seed/resamples, class analyses and coder rules before main recruitment. The current analysis plan proposes 10,000 participant bootstrap resamples. Report uncertainty and null/inconclusive outcomes. Avoid a large condition × class × experience model unless the observed data genuinely support it.

## 14. What is original, and how we will validate it

| Original element | Strong design reason | What the pilot must show |
| --- | --- | --- |
| Human-only acceleration/exploration cards | Keeps agent-facing requirements common; compares work orientation rather than tying “easy task” to acceleration and “hard task” to exploration. | Participants understand cards and observable intent differs enough to interpret the manipulation. |
| Two parallel JS projects, each with both weaknesses | Supports a paired, bounded security assessment and balances class across condition. | Similar completion time/difficulty and understandable features; record any project asymmetry. |
| Explicit security requirements | Makes target criteria fair and assessable in both conditions. | Participants understand them without being handed exploit recipes; recognise that results are security-salient. |
| Natural agent editing, no forced insecure patch | Preserves participant-agent workflow and lets verification occur naturally. | Capture can identify origin/exposure; if insecure exposures are rare, limit retention claims. |
| Exact-hash final probabilities and reasons | Links a subjective security judgment to the exact code independently assessed. | Participants understand a probability about each requirement; hash/time linkage is complete. |
| Multistream observer + snapshots + video + replay | Each source covers a different blind spot in reconstructing intent, visible checking and changes. | Actual prompts/replies/tools, visible actions, final files and clocks are sufficiently captured. |
| Intent-only mode codebook and check taxonomy | Avoids defining mode using the outcome being tested; separates agent action from human decision. | Acceptable inter-coder agreement; uncertainty categories are used honestly. |
| SQL/path attack fixtures plus blinded dual review | Reduces dependence on scanners and task-provided functional tests. | Known secure/vulnerable references are classified correctly and arbitrary agent output can be reviewed. |
| Seven-file portal evidence transfer and hashes | Keeps task evidence tied to ID/version/final snapshot and reveals gaps. | Exact-host upload/retrieval/playback works; missing or corrected files are handled without false receipts. |

**Stop/go rule.** A supervised real-user pilot follows a successful exact-host capture, transfer/retrieval and security-assessment rehearsal. The pilot itself determines whether the cards, coding and natural exposure frequency work; they are **not** assumed successes. Before the main study, freeze all task sheets, cards, form wording, agent settings, codebook, security oracle, allocation, missingness and analysis. Keep rehearsal, pilot and main datasets separate. See [`RESEARCH_AUDIT.md`](RESEARCH_AUDIT.md) for the current implementation gaps; this document does not declare the hosted route validated.

## 15. Answers to likely defence questions

1. **Why security-specific calibration?** Generic “trust in AI” cannot tell whether confidence is appropriate for a risky code change. Perry [S2] directly found divergence between security outcomes and beliefs, and Khalid [S3] shows evaluation of AI-generated code is a distinct developer task. Our exact-snapshot probability plus independent security review makes that alignment observable. We also collect reliance and decisions, because artifact confidence alone is not agent trust.
2. **Why juniors if they may not know security?** Early-career developers are a defined, relevant population, not a deficient control group. We record programming, security and agent experience; supply the same explicit security requirements; allow ordinary checks; and analyse verification and code outcomes separately. We will not interpret every missed flaw as overtrust. [Danilova][S10] and [Kaur][S11] support careful participant characterization.
3. **Why SQL and path only?** MITRE's 2024 ranking [S7] shows both are important, and both admit distinct, testable source-to-sink failures [S8]. Limiting classes permits two parallel features per task and credible manual review. It is a **scope choice**, not a claim of highest LLM prevalence.
4. **Why not plant a vulnerability in `AGENTS.md`?** That would change agent input and make vulnerability exposure a second treatment. The present aim compares human orientation during natural agent coding. A separate randomized poisoned-workspace study could guarantee/estimate exposure with explicit provenance, but its causal question and dataset differ. Controlled insecure-suggestion studies already exist, including [Oh][S19] and [Serafini][S20].
5. **Can you claim acceleration causes insecure code?** Only an assigned-card contrast is randomized/counterbalanced; observed mode is not. We can estimate a condition difference under this task and tool setup, then describe whether observed intent and checks are consistent with the mechanism. Skill, agent output, task order, project and sparse vulnerabilities limit stronger claims.
6. **What if the agent writes secure code every time?** Report that outcome. RQ2 final security remains describable, but conditional insecure-exposure survival and confidence on vulnerable final code may be unestimable. Do not insert a flaw after seeing results or score an absent feature as secure.

## Sources used in this timeline

The titles below link to primary papers or official technical/security references. “Borrowed” in the text refers to the *specific precedent described*, not wholesale adoption of a validated instrument. Bibliographic details and additional reading are in [`REFERENCES.md`](REFERENCES.md). The original proposal is historical and does not override this natural protocol.

| ID | Source | Contribution used here and limit |
| --- | --- | --- |
| S1 | [Barke, James & Polikarpova, *Grounded Copilot* (2022)](https://arxiv.org/abs/2206.15000) | Observed 20 programmers; acceleration/exploration intent concepts. No causal security result or validated card. |
| S2 | [Perry et al., *Do Users Write More Insecure Code with AI Assistants?* (CCS 2023)](https://arxiv.org/abs/2211.03622) | Participant code-security and belief outcomes; different assistant and tasks. |
| S3 | [Khalid et al., *(Don't) Trust, but (Don't) Verify* (2026 preprint)](https://arxiv.org/abs/2609.21020) | 100-person security evaluation study with choice, editing, survey and 23 interviews; controlled C tasks, not natural agent mode comparison. |
| S4 | [Lee & See, *Trust in Automation: Designing for Appropriate Reliance* (2004)](https://doi.org/10.1518/hfes.46.1.50_30392) | Conceptual appropriate-reliance account, not code experiment. |
| S5 | [Mozannar et al., *Reading Between the Lines* (CHI 2024)](https://arxiv.org/abs/2210.14306) | Session traces and retrospective programming-state interpretation; CUPS states are not our modes. |
| S6 | [Tang et al., *Developer Behaviors for Validating and Repairing LLM-Generated Code* (2024)](https://arxiv.org/abs/2405.16081) | 28-person study with IDE actions, eye tracking and interviews; no claim that our observer supplies eye tracking. |
| S7 | [MITRE, *2024 CWE Top 25*](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html) | CWE-89 #3 and CWE-22 #5 in that edition; no LLM-specific prevalence claim. |
| S8 | [GitHub CodeQL SQL query help](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/) and [path query help](https://codeql.github.com/codeql-query-help/javascript/js-path-injection/) | Mechanisms and possible static checks; incomplete as a stand-alone oracle. |
| S9 | [Basha et al., *CodeWatcher* (ICSME tool demo 2025)](https://arxiv.org/abs/2510.11536) | Feasibility of fine-grained VS Code telemetry; does not validate Antigravity coverage or mode inference. |
| S10 | [Danilova et al., *Do you really code?* (2021)](https://arxiv.org/abs/2103.04429) | Need for programming-skill screening; our background items are not their validated screener. |
| S11 | [Kaur et al., *Where to Recruit for Security Development Studies* (USENIX Security 2022)](https://www.usenix.org/conference/usenixsecurity22/presentation/kaur) | Participant-source and security-experience limitations; does not establish student/professional equivalence. |
| S12 | [Wang et al., *Investigating and Designing for Trust in AI-powered Code Generation Tools* (FAccT 2024)](https://doi.org/10.1145/3630106.3658984) | Contextual developer trust and interview rationale. |
| S13 | [Brown et al., *Identifying the Factors That Influence Trust in AI Code Completion* (2024)](https://doi.org/10.1145/3664646.3664757) | Developer, suggestion and context factors; acceptance is not a security label. |
| S14 | [OWASP, *Secure Code Review Cheat Sheet*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) | Manual and automated security-review guidance; not an effect estimate. |
| S15 | [Brier, *Verification of Forecasts Expressed in Terms of Probability* (1950)](https://doi.org/10.1175/1520-0493%281950%29078%3C0001%3AVOFEIT%3E2.0.CO%3B2) | Binary probability score; not a trust questionnaire. |
| S16 | [NASA, *NASA Task Load Index*](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/) | Workload dimensions; our two single items are **not** NASA-TLX. |
| S17 | [Gneiting & Raftery, *Strictly Proper Scoring Rules* (2007)](https://doi.org/10.1198/016214506000001437) | Probability-score interpretation; Brier is not pure calibration. |
| S18 | [Lakens, *Sample Size Justification* (2022)](https://doi.org/10.1525/collabra.33267) | Transparent resource/precision/sensitivity arguments; no prescribed N=30. |
| S19 | [Oh et al., *Poisoned ChatGPT Finds Work for Idle Hands* (S&P 2024)](https://arxiv.org/abs/2312.06227) | Prior controlled insecure AI suggestions; not this natural procedure. |
| S20 | [Serafini et al., *Intervention Methods in a Manipulated ChatGPT Study* (CHI 2025)](https://doi.org/10.1145/3706598.3713989) | Manipulated security guidance precedent; not evidence that our cards work. |

## Local instruments that implement this plan

- Current procedure: [`NATURAL_WORKFLOW_METHOD.md`](NATURAL_WORKFLOW_METHOD.md), [`NATURAL_SESSION_RUNBOOK.md`](study-system/pilot/NATURAL_SESSION_RUNBOOK.md).
- Task/package definition: [`TASK_DESIGN.md`](TASK_DESIGN.md), [`natural_kit.mjs`](study-system/pilot/natural_kit.mjs), [`NATURAL_PRACTICE.md`](study-system/pilot/NATURAL_PRACTICE.md).
- Exact forms and rating: [`forms.json`](study-system/instruments/forms.json), [`natural_rate.mjs`](study-system/pilot/natural_rate.mjs). `forms.json` also retains historical checkpoint fields, which are excluded from the natural workflow.
- Behaviour and capture: [`NATURAL_CODEBOOK.md`](study-system/instruments/NATURAL_CODEBOOK.md), [`NATURAL_DATA_COVERAGE.md`](study-system/pilot/NATURAL_DATA_COVERAGE.md).
- Outcome tables and statistics: [`NATURAL_ANALYSIS_PLAN.md`](NATURAL_ANALYSIS_PLAN.md), [`natural-templates/`](study-system/analysis/natural-templates/).

[S1]: https://arxiv.org/abs/2206.15000
[S2]: https://arxiv.org/abs/2211.03622
[S3]: https://arxiv.org/abs/2609.21020
[S4]: https://doi.org/10.1518/hfes.46.1.50_30392
[S5]: https://arxiv.org/abs/2210.14306
[S6]: https://arxiv.org/abs/2405.16081
[S7]: https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html
[S8]: https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/
[S9]: https://arxiv.org/abs/2510.11536
[S10]: https://arxiv.org/abs/2103.04429
[S11]: https://www.usenix.org/conference/usenixsecurity22/presentation/kaur
[S12]: https://doi.org/10.1145/3630106.3658984
[S13]: https://doi.org/10.1145/3664646.3664757
[S14]: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html
[S15]: https://doi.org/10.1175/1520-0493%281950%29078%3C0001%3AVOFEIT%3E2.0.CO%3B2
[S16]: https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/
[S17]: https://doi.org/10.1198/016214506000001437
[S18]: https://doi.org/10.1525/collabra.33267
[S19]: https://arxiv.org/abs/2312.06227
[S20]: https://doi.org/10.1145/3706598.3713989
