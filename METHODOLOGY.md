# Methodology: participant study protocol

**Status:** proposed protocol for piloting. Read with [RQ.md](RQ.md), [TASK_DESIGN.md](TASK_DESIGN.md), and [MEASURES_AND_EVALUATION.md](MEASURES_AND_EVALUATION.md). This is a research plan, not a claim that the tasks, extension, or manipulation are already validated.

## 1. Design in one sentence

Run a **within-participant, randomized, counterbalanced** study in which each early-career participant completes two JavaScript coding tasks with an agent: one under acceleration encouragement and one under exploration encouragement. At several short feature checkpoints, participants see controlled agent-produced secure or vulnerable changes, judge exact code snapshots, decide what to keep, verify/revise, and submit final code.

The assigned condition is the primary comparison. The observed interaction mode is independently coded from participant intention, video, prompts, and actions. Analysis of observed mode is associative because people may move between modes.

## 2. Causal and observational structure

~~~text
randomized order + condition + project + candidate sequence
    -> agent interaction and actual candidate exposure
    -> provisional keep/reject + snapshot security confidence
    -> verification and repair
    -> final submitted code security

experience, prior agent use, SQL/path knowledge, task familiarity
    -> behavior, confidence, and security outcome
~~~

The condition can be compared as randomized encouragement if the manipulation is assigned independently of participant skill and project. **Do not describe this as the pure effect of an internal cognitive state.** Both task context and agent behavior can influence mode and outcomes. Mode coding tests whether the encouragement produced distinguishable episodes and provides explanatory context.

## 3. Participants and scope

- **Target:** final-year CS/IT students and junior software engineers with sufficient JavaScript to modify and run a small Node project. Set an explicit junior definition before recruitment, such as 0–2 years paid development experience; report distribution rather than assuming homogeneity.
- **Screening:** short self-report and practical baseline: JS/Node familiarity, SQL and filesystem API experience, secure-coding knowledge, agent use frequency, IDE familiarity. A short non-scored input-to-sink question for SQL and path can detect floor effects. [Danilova et al.](https://arxiv.org/abs/2103.04429) motivates screening actual programming experience; [Kaur et al.](https://www.usenix.org/conference/usenixsecurity22/presentation/kaur) motivates precise participant reporting.
- **Sample:** 4–6 pilot participants, then a main target provisionally around 30–40, **not** declared adequately powered without a pilot-based precision or simulation calculation. Recruit to the study population; report student and paid-junior subgroups descriptively. With 30–40, interaction-by-vulnerability estimates will be imprecise.
- **Eligibility:** prior basic JS and ability to use an IDE; no prior knowledge of study stimuli. Record accessibility needs. Do not exclude people for low AI use if “new to AI-led SE” is part of the target; stratify/descriptively report agent experience.
- **Junior defense:** the question is how people in this defined experience range make security judgments *under agent assistance*, after measuring baseline knowledge. A missed vulnerability could reflect knowledge, task understanding, attention, or workflow. Model/report these separately and avoid attributing every miss to blind trust. The contribution is bounded to this population.

“Junior” does **not** automatically mean “new to AI-led software engineering.” If that is part of the intended population, set an additional pre-recruitment threshold for prior **agent-mode** experience (for example, no regular agent-mode use, with the exact frequency/window chosen before screening), and report it. Otherwise, describe the sample as early-career with measured variation in agent experience. Give equal tool training either way; unfamiliarity with Antigravity must not masquerade as exploration.

## 4. Two tasks, randomization, and controls

Each participant completes **Project A and Project B**, one under each condition. Assign the four combinations of project-condition mapping and order approximately evenly:

| Sequence | First task | Second task |
| --- | --- | --- |
| 1 | A + acceleration | B + exploration |
| 2 | A + exploration | B + acceleration |
| 3 | B + acceleration | A + exploration |
| 4 | B + exploration | A + acceleration |

Each project has the same workload shape: four small feature checkpoints, two SQL-related and two path-related. Each class has one known vulnerable and one known secure eligible candidate per condition. Randomize/counterbalance checkpoint order with constraints that avoid a predictable vulnerability sequence. Use different names/data in A and B and pre-test for comparable time and difficulty. [Barke et al.](https://arxiv.org/abs/2206.15000) grounds the two intent descriptions; the *task manipulation* is this study's own instrument and needs a manipulation check.

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

1. Agent and IDE records: prompts/responses where available, tool calls, candidate IDs/diffs, file edits, tests/terminal actions, provisional decisions, snapshot hashes, timestamps.
2. Screen recording with participant consent, for context missed by hooks and verification coding. Store no personal account notifications.
3. Short checkpoint confidence and reason forms.
4. Final Git/repository snapshots per task.
5. Retrospective interview audio/transcript with selected video clips and participant mode explanations.
6. Researcher oracle results and two blinded human security reviews.

See [IDE_TELEMETRY.md](IDE_TELEMETRY.md) for feasible versus pilot-dependent captures and [INTERVIEW_AND_FORMS.md](INTERVIEW_AND_FORMS.md) for scripts.

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
