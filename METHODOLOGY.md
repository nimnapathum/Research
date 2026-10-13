# Methodology: participant study protocol

**Status:** archived **controlled-checkpoint design**. Its detailed procedure describes the currently built portal/client, not the recommended natural-coding pilot. The methodological revision is [NATURAL_WORKFLOW_METHOD.md](NATURAL_WORKFLOW_METHOD.md). Do not recruit for the revised pilot with this page or the old ZIP as the participant protocol. Software dry runs of this older design have passed; neither design has been validated with people.

## 1. Design in one sentence

Run a **within-participant study with preassigned, balanced order** in which each early-career participant completes two JavaScript coding tasks with an agent: one under acceleration encouragement and one under exploration encouragement. At four feature checkpoints in each task, participants see controlled supplied secure or vulnerable changes, judge exact code snapshots, decide what to keep, verify/revise, and submit final code. The present changes are constructed prototypes; calling them agent-generated requires the provenance step described below.

The assigned condition is the primary comparison. The observed interaction mode is independently coded from participant intention, video, prompts, and actions. Analysis of observed mode is associative because people may move between modes.

## 2. Causal and observational structure

~~~text
preassigned order + condition + project + candidate sequence
    -> agent interaction and actual candidate exposure
    -> provisional keep/reject + snapshot security confidence
    -> verification and repair
    -> final submitted code security

experience, prior agent use, SQL/path knowledge, task familiarity
    -> behavior, confidence, and security outcome
~~~

The condition can be compared as randomized encouragement **only if** the seeded balanced allocation is fixed before recruitment, followed at account creation, and audited against actual participation. The portal now reserves allocations from the checkpoint service; its existence alone does not establish balance in the analyzed sample. **Do not describe the contrast as the pure effect of an internal cognitive state.** Both task context and agent behavior can influence mode and outcomes. Mode coding tests whether the encouragement produced distinguishable episodes and provides explanatory context.

## 3. Participants and scope

- **Target:** final-year CS/IT students and junior software engineers with sufficient JavaScript to modify and run a small Node project. Set an explicit junior definition before recruitment, such as 0–2 years paid development experience; report distribution rather than assuming homogeneity.
- **Screening:** short self-report and practical baseline: JS/Node familiarity, SQL and filesystem API experience, secure-coding knowledge, agent use frequency, IDE familiarity. A short non-scored input-to-sink question for SQL and path can detect floor effects. [Danilova et al.](https://arxiv.org/abs/2103.04429) motivates screening actual programming experience; [Kaur et al.](https://www.usenix.org/conference/usenixsecurity22/presentation/kaur) motivates precise participant reporting.
- **Sample:** 4–6 separate feasibility pilots, then **30 completed main-study participants**. Recruit approximately 36–38 if 15–20% of sessions may be incomplete; report actual enrollment and exclusions. Thirty is a resource-bounded, estimation-oriented mixed-method target, **not** an 80%-power guarantee for every RQ. Report student and paid-junior subgroups descriptively; do not claim powered subgroup or SQL-versus-path interaction tests.
- **Eligibility:** prior basic JS and ability to use an IDE; no prior knowledge of study stimuli. Record accessibility needs. Do not exclude people for low AI use if “new to AI-led SE” is part of the target; stratify/descriptively report agent experience.
- **Junior defense:** the question is how people in this defined experience range make security judgments *under agent assistance*, after measuring baseline knowledge. A missed vulnerability could reflect knowledge, task understanding, attention, or workflow. Model/report these separately and avoid attributing every miss to blind trust. The contribution is bounded to this population.

“Junior” does **not** automatically mean “new to AI-led software engineering.” If that is part of the intended population, set an additional pre-recruitment threshold for prior **agent-mode** experience (for example, no regular agent-mode use, with the exact frequency/window chosen before screening), and report it. Otherwise, describe the sample as early-career with measured variation in agent experience. Give equal tool training either way; unfamiliarity with Antigravity must not masquerade as exploration.

### Why 30 completed participants is the bounded main-study target

The study prioritizes one within-person **RQ1** estimate: each developer completes both assigned conditions, so the main comparison is 30 paired participant summaries. RQ2 is a key secondary security outcome; RQ3 explains the recorded process; RQ4 is exploratory. The eight proposal reviews per person give repeated evidence and four balanced security opportunities per condition, but **240 reviews are not 240 independent people**. [Lakens](https://doi.org/10.1525/collabra.33267) recognizes resource constraints and sensitivity/precision analysis as explicit sample-size justifications when their limits are reported. Budget the real researcher hours for approximately 30 two-task sessions, 60 task recordings, 240 checkpoint reviews, 30 interviews, code adjudication and double coding. Do not cite another study's participant count as a power calculation.

As an illustrative sensitivity check, a two-sided paired test with 30 complete pairs, alpha 0.05 and 80% power would detect a standardized paired difference of roughly **0.53** under its assumptions. If the SD of participant-level Brier differences were 0.30, an ordinary 95% interval would have an approximate half-width of **0.11** Brier points. The SD and effect are unknown; these figures do **not** establish power for the discrete RQ2 outcome, multiple primary tests, mode-by-condition analyses or the SQL/path interaction. Before main recruitment, use pilot missingness and a plausible range of paired variances to report a design-specific sensitivity/precision table, and freeze the feasible target. A null or wide interval cannot establish that conditions are equivalent.

Record and briefly interview all 30. Code prespecified verification events in every usable recording; make deeper video/interview interpretations from a transparent spread of contrasting cases, while checking whether new themes continue to appear. [Hennink and Kaiser](https://doi.org/10.1016/j.socscimed.2021.114523) found that 9–17 interviews often cover narrow questions in relatively homogeneous populations; [Malterud et al.](https://doi.org/10.1177/1049732315617444) recommend judging qualitative sufficiency by information power. Those findings support the depth of 30 interviews but do not guarantee saturation in this mixed student/junior sample. Keep pilot data separate because its instruments may change.

## 4. Two tasks, randomization, and controls

Each participant completes **Project A and Project B**, one under each condition. Assign the four combinations of project-condition mapping and order approximately evenly:

| Sequence | First task | Second task |
| --- | --- | --- |
| 1 | A + acceleration | B + exploration |
| 2 | A + exploration | B + acceleration |
| 3 | B + acceleration | A + exploration |
| 4 | B + exploration | A + acceleration |

Generate and retain a private allocation record before recruitment. For password-portal participants, the portal now generates a random pseudonymous ID, asks the checkpoint service for the next seeded balanced allocation, and saves its exact project, condition and checkpoint orders. The checkpoint service remains authoritative for the candidate-status profile. Audit the realized project/order/status table before interpreting condition effects. Researcher-operated sessions created directly with the CLI must be included in that audit. If any allocation was changed manually, report that deviation and avoid claiming a fully randomized comparison.

Each project has the same workload shape: four small feature checkpoints, two SQL-related and two path-related. Each class has one known vulnerable and one known secure eligible candidate per condition. Randomize/counterbalance checkpoint order with constraints that avoid a predictable vulnerability sequence. Use different names/data in A and B and pre-test for comparable time and difficulty. [Barke et al.](https://arxiv.org/abs/2206.15000) grounds the two intent descriptions; the *task manipulation* is this study's own instrument and needs a manipulation check.

**Why checkpoints:** These are feature-level review opportunities and measurement anchors, not timed interruptions or separate tests of mental state. Four per task give one known secure and one known vulnerable proposal in each of the two target classes under each assigned condition. They let us record exposure, a decision and security confidence about the same exact proposal, verification around that decision, and the final code state. [Khalid et al.](https://arxiv.org/abs/2609.21020) provide a close precedent for repeated security-varying AI-code choices followed by participant edits; [Oh et al.](https://arxiv.org/abs/2312.06227) provide precedent for studying insecure suggestions during programming. Neither paper validates this exact four-checkpoint, frozen-proposal gate. It is our instrument and must be piloted.

**Mode-validity risk:** [Barke et al.](https://arxiv.org/html/2206.15000v3) observed that acceleration often follows decomposition into well-understood microtasks, while exploration appears when the path is uncertain; programmers also switch between modes within a task. Prescribing four small steps could therefore make both conditions more acceleration-like. Explicit security criteria, repeated confidence questions, and the forced provisional decision can also change checking behavior. Keep the same gate in both conditions, let the participant request a proposal when ready rather than interrupting on a timer, and allow free agent discussion, documentation use and tests before reveal and free repair after the initial decision. Independently code observed mode during the less constrained work, and ask in the pilot whether the gate disrupted the participant's approach. If the pilot shows little mode separation, revise and re-pilot the tasks/cards or narrow the claim to effects of the assigned instructions under this structured workflow; do not call the result a cognitive-mode effect.

**Acceleration encouragement:** The card asks participants to identify a next step and use the agent to carry it out efficiently. Do **not** direct them to hurry or skip security review. **Exploration encouragement:** The card asks participants to use the agent to compare or explain approaches before choosing a step. The built packages supply the same functional and security criteria, project information, time allowance and tools in both conditions; only the orientation wording changes. Estimate an **encouragement-package effect** and use observed mode to interpret whether the wording changed interaction. Pilot for unintended difficulty differences.

An alternative if the pilot shows large task-difficulty confounding is to use identical feature work and randomly vary only preparation/framing. Decide and freeze this before the main study. Do not tune condition text after seeing main outcomes.

## 5. Controlled agent suggestions and exposure

**Recommended main design:** pre-generate candidate changes with the chosen agent/version in the actual task repository, save raw prompt, response, diff, time, model and settings, then select candidates against a documented rubric. During a session, the participant may ask the live agent to inspect or discuss the target, but asks it not to edit that target until the controlled proposal is revealed. The local review page then applies one preselected candidate in the IDE workspace when the participant clicks reveal. The participant may use the live agent to question/test it and, after the first decision and confidence rating, repair or replace it. If the final set uses the current researcher-constructed patches, describe them as **constructed coding-agent-style proposals**, not authentic agent output. The procedure must state what is controlled and what remains live.

The set contains both secure and vulnerable code with similar functional behavior and plausible style. This gives both conditions comparable opportunities and lets RQ1 evaluate confidence for secure **and** insecure items. [Khalid et al.](https://arxiv.org/abs/2609.21020) provide precedent for security-varying AI suggestions in a participant evaluation study. [Oh et al.](https://arxiv.org/abs/2312.06227) and [Serafini et al.](https://doi.org/10.1145/3706598.3713989) provide direct precedent for deliberately insecure AI suggestions. Our assigned-orientation and agent-workflow design is an adaptation. Natural, unconstrained generation can be logged as a supplemental ecological arm, but **do not** count a participant who never saw a vulnerability in a denominator for vulnerability retention.

**Exposure gate:** save candidate ID, rendered diff or full code visible to participant, timestamp, and source/actor. If a tool failure means the candidate was never visible, mark unexposed and replace according to a prespecified rule. A secure candidate can turn vulnerable through participant edits; record both initial and final state. Any extra agent-generated vulnerabilities are adjudicated separately and reported, not silently folded into the balanced target-opportunity analysis.

**Ethical clarity:** Participants may inspect every repository file. Do not tell them they should avoid reading agent instruction files. The prior hidden Markdown vulnerability idea would introduce a different manipulation, deception, and source-attribution problem. If later added, it needs separate ethics review, randomized file variants, a check that the agent actually read the file, and a distinct analysis. It is **not** part of current RQ1–RQ4.

## 6. Session sequence

| Stage | Approximate time | Researcher action / evidence |
| --- | --- | --- |
| Consent/setup | 10 min | Explain recording, agent data capture, right to stop; configure a fresh account/workspace with no personal secrets. |
| Screening/baseline | 10 min | Experience, security knowledge, AI use, IDE familiarity. Do not disclose vulnerability placements. |
| Training | 8 min | Teach agent mode, keep/reject control, confidence prompt, functional tests, and how to request security checks on a neutral example. Equal training for all. |
| Task 1 | 35–45 min | Apply assigned encouragement; four checkpoints. Record prompts, proposals, edits, checks, provisional decisions, snapshots, confidence, and final repository. |
| Reset/break | 5 min | New repository/workspace; no task solution carry-over. Record any learning comments. |
| Task 2 | 35–45 min | Other encouragement, second project; same evidence. |
| Retrospective interview | 15–25 min | Replay selected events, ask about intention/mode, confidence, checks, suspected risks and why decisions changed. Debrief afterward. |

At each checkpoint: (1) display a functional request plus explicit security criterion; (2) participant may use the agent to inspect/discuss, without editing the target feature; (3) the researcher prepares an eligible candidate outside the participant workspace, and the review page applies it on reveal; its **proposed-change snapshot is frozen**; (4) participant may inspect, ask questions and test, but does not edit the target until the first decision; (5) participant records a **provisional keep/reject** decision and rates the security of that exact proposal, whether kept or rejected; (6) participant may then edit, replace, test and repair freely with the agent; (7) task end creates a final repository snapshot. If they reject and implement another solution, keep that decision and its final outcome. The pilot must establish that this structured review gate is workable and disclose its effect on naturalness.

**Timing caution:** “Before keep” versus “after keep” is based on the timestamp of the provisional decision. Security confidence is anchored to the immutable reviewed proposal, **not** to the repository after a rejection. The instrument can itself prompt further verification. Log the prompt time and consider a pilot or sensitivity check for reactivity. If the researcher forces a decision at each checkpoint, call it an experimental checkpoint rather than a natural acceptance event.

## 7. Data streams

1. Agent and IDE records: the current Antigravity workspace hook records model invocation and selected tool metadata; the local client sends workspace hashes and frozen baseline/proposal/final states. Full prompts/replies require a readable official transcript and screen recording. The VS Code-compatible extension source is **not** an installed standalone Antigravity extension.
2. Screen recording with participant consent, for context missed by hooks and verification coding. Store no personal account notifications.
3. Short checkpoint confidence and reason forms.
4. Final repository snapshots per task, with task/checkpoint order, candidate ID and hashes retained in the checkpoint database.
5. Retrospective interview audio/transcript with selected video clips and participant mode explanations.
6. Researcher oracle results and two blinded human security reviews.

See [IDE_TELEMETRY.md](IDE_TELEMETRY.md) for feasible versus pilot-dependent captures and [INTERVIEW_AND_FORMS.md](INTERVIEW_AND_FORMS.md) for scripts.

**Participant delivery:** The researcher creates a private portal account and two assignments. The participant completes the pre-task form, downloads the task-specific ZIP, opens only that extracted workspace in Antigravity, runs `node study/setup.mjs` and `node study/client.mjs`, then follows the web task sheet and checkpoint page. Task 2 unlocks after Task 1 final code and after-task form. The client applies the controlled proposal after reveal and uploads the final snapshot. The researcher separately attaches approved screen video; the participant can explicitly upload the official transcript file. This route requires Node 24+, Git and an approved HTTPS service when participant machines are remote. See the [portal runbook](study-system/pilot/PARTICIPANT_PORTAL_RUNBOOK.md) and [OS guide](study-system/pilot/CROSS_PLATFORM_CAPTURE.md).

**Optional pilot telemetry:** The ZIP includes a Python pointer recorder for macOS, Windows and Linux/X11. It stores five-second aggregate motion summaries while explicitly running; it observes pointer activity across applications. Linux Wayland is unsupported by this recorder. Pointer data are exploratory context only, can be absent without invalidating RQ1–RQ4, and must be covered by approved participant information before collection. The [measurement inventory](study-system/pilot/MEASUREMENT_INVENTORY.md) distinguishes built, manual and unverified streams.

## 8. Bias controls and quality gates

- **Order/learning:** randomized order and projects; model/report order; ask if the second task was influenced by the first.
- **Task difficulty:** pilot completion time, functional success, participant perceived difficulty, unfamiliarity; revise entire matched packages before main data collection.
- **Security knowledge:** baseline measure and same explicit security requirements for both conditions; do not conflate novice knowledge with trust.
- **Candidate confounds:** match length, functionality, style, test pass rate, and visual salience; independent pre-review of secure/vulnerable classification; randomize placement.
- **Researcher expectancy:** security adjudicators and behavioral coders receive anonymized candidate/snapshot IDs without condition or confidence where practicable; preregister codebook and analyses.
- **Agent stochasticity:** pin version/settings, retain raw generated sources, and present locked candidate IDs for target exposures. Log free agent deviations.
- **Instrumentation:** test clock synchronization, missing events, exact snapshot capture, terminal recording, Antigravity updates, storage/consent.
- **Learning from security prompts:** keep identical confidence/criterion wording, balance order, and quantify item order.

## 9. Ethics, data security, and reporting

Obtain institutional approval before the participant study. Consent must disclose screen/agent transcript recording, the existence of security evaluation and possibly flawed AI code, data retention, and withdrawal. Partial concealment of *which* suggestions are vulnerable may be justified to avoid demand effects; debrief fully afterward. No live customer systems, personal repositories, credentials, or network services. The app uses local synthetic data and a disposable workspace. Encrypt or access-control recordings and transcripts; pseudonymize IDs; define retention/deletion dates and who sees raw data. Share sanitized stimuli and codebook, not identifiable videos or prompts.

Report CONSORT-like assignment flow for this experiment: recruited, eligible, randomized, session completed, candidate exposure achieved, missing confidence, and analyzable final submissions. Publish null and contrary results. See [MEASURES_AND_EVALUATION.md](MEASURES_AND_EVALUATION.md) for estimands and analyses.
