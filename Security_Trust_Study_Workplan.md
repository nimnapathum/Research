# Cognitive modes and security trust calibration in entry-level developers

Research protocol draft • 21 September 2026

This plan follows the latest four research questions supplied in the conversation. Earlier proposal and defense slides are background, not the current protocol. All task counts, timing, thresholds, and schedules below are proposed design choices to pilot and preregister; they are not validated prescriptions from the cited papers. This is a plan, not a completed experiment or validated instrument.

## 1. Recommended scope and contribution

Run a controlled, counterbalanced, within-participant study with 30 entry-level engineers. Each completes two programming task blocks: one designed to encourage acceleration and one to encourage exploration. Each block contains four independent, short suggestion opportunities, producing eight planned decisions per participant. Use two security classes, SQL injection and path traversal. Present both secure and vulnerable suggestions. Randomize a secure versus insecure neighboring-code example while holding the corresponding assistant suggestion fixed.

Use the IDE extension as a measurement instrument. Measure cognitive mode independently through participants' stated implementation intent and retrospective episode coding. Log acceptance, subsequent verification, confidence, and final outcomes. A telemetry classifier is optional exploratory analysis; an adaptive verification prompt is outside this experiment's core scope.

Proposed title: **Developer Cognitive Modes and Security Trust Calibration in LLM-Assisted Programming: A Controlled Study of Entry-Level Engineers.**

Proposed contribution: evidence about how security confidence, reliance decisions, and verification relate to acceleration and exploration episodes under controlled exposure to secure and vulnerable suggestions. The study also estimates whether an insecure neighboring example changes unsafe propagation and whether that relationship differs by mode.

This does not establish the prevalence of vulnerabilities in current LLMs, the superiority of one assistant, or an effect for all developers. It does not directly measure an internal System 1/System 2 state. Avoid “first study” claims without a systematic search.

## 2. Why security is a justified focus

Security provides a specific setting in which apparent success and actual adequacy can diverge: code can execute correctly on normal inputs while allowing an unauthorized query or access outside an allowed directory. This creates a testable question about whether developers mistake evidence of functionality for evidence of security. Many ordinary correctness bugs also escape tests, so this is a useful specialization rather than a claim that only security has hidden failures.

Perry et al. found less secure output and greater belief in security among participants with assistant access in their study [S2]. Sandoval et al. found a smaller security impact in a different C programming study [S3]. These findings justify investigating conditions associated with unsafe reliance; they do not justify assuming that AI assistance, or acceleration, always makes code less secure.

The research gap is narrower than “AI can generate insecure code”: **under comparable exposure to flawed suggestions, does the developer's interaction mode help explain when security confidence is misplaced, when insecure context is propagated, and what verification occurs?**

Security also gives the experiment concrete assessment criteria: functional tests and separate adversarial security tests, supplemented by manual review. “Trust” alone is too broad unless linked to a specific judgment and outcome. General correctness would be a valid alternative topic, but choosing security makes the construct and consequences more focused.

Defense wording:

> This research focuses on security because a functionally successful AI suggestion may still violate a security requirement. It investigates whether developers' confidence and reliance reflect that distinction, and whether acceleration and exploration episodes are associated with different verification and vulnerability-detection patterns. Security is therefore the evaluation domain for trust calibration, rather than an unrelated additional topic.

## 3. Research questions and priorities

| Question | Recommended wording | Status and reason |
|---|---|---|
| RQ1 | How does security confidence align with assessed security outcomes across acceleration and exploration episodes in LLM-assisted programming? | Primary. Directly addresses the central calibration contribution. |
| RQ2 | Does a visible insecure code example increase unsafe pattern propagation, and does this relationship differ across interaction modes? | Secondary; mode-by-context interaction exploratory with 30 participants. Requires randomized context. |
| RQ3 | How do verification behaviors differ across modes, and how are they associated with vulnerabilities remaining in submitted code? | Secondary. Links process to outcome without assuming mediation or causation. |
| RQ4 | Do these patterns differ between SQL injection and path traversal opportunities? | Exploratory. Limited tasks and participants cannot support broad vulnerability-class generalization. |

Using “affect” in the title of a question is acceptable as a research ambition, but causal conclusions need qualification. Randomization identifies the effect of the assigned task/preparation condition and randomized context. Observed mode is not itself randomized. Familiarity and preparation can influence performance through routes other than mode.

Keep functional correctness as a companion outcome. Do not claim that verification predicts security failures more strongly than ordinary bugs unless a matched set of ordinary-bug probes is added. That additional comparison is not required by the latest RQs.

## 4. What is borrowed from the literature

| Source | Supported use | Boundary |
|---|---|---|
| Grounded Copilot [S1] | Definition of acceleration as implementing a known plan and exploration as discovering how to proceed; qualitative observation and familiar/unfamiliar task inspiration | It developed a grounded theory with 20 participants. Your study tests a theory with controlled stimuli, so it is not a direct replication of its method. |
| CodeWatcher [S4] | Timestamped IDE events, session reconstruction, and event-level validation | Logs do not validate cognitive states. Its insertion heuristic is insufficient to prove AI authorship in every case. |
| Cracking CodeWhisperer [S5] | Combining telemetry with qualitative analysis of developer interactions | Supports the mixed-method approach, not a validated mode detector. |
| Awad et al. [S6] | Rolling telemetry features and the feasibility of predicting suggestion acceptance | Acceptance prediction is different from cognitive-mode inference and appropriate trust. |
| Kuo et al. [S7] | Importance of workflow timing and the cost of interventions | Receptivity to proactive help is different from security calibration. Do not introduce proactive prompts into this observational comparison. |
| When Help Hurts [S8] | Candidate verification-burden signals: failures, first-run latency, churn, pauses, switches | Its modes are interface types. Its composite does not directly measure security checking or acceleration/exploration. |

The original proposal and defense slides conflate model probability calibration, human confidence, and reliance in places. Spiess-style model calibration can inform statistical concepts but does not establish that developers are calibrated. Platt-scaling a model's scores is not a method for measuring a person's trust.

## 5. Participants and sample-size justification

Target 30 completed participants. Define entry-level operationally before recruitment: for example 0–2 years of professional software-development experience, including a documented decision on whether paid internships count. Require regular use of the selected language and basic ability to implement a short function. Record years of coding separately from professional tenure.

Recruit from several teams or organizations if feasible. Record language proficiency, assistant-use frequency, professional tenure, relevant API familiarity, and security training. Use a short general programming screening task; avoid showing the exact vulnerabilities in advance. A brief security knowledge assessment can occur after the programming tasks to reduce priming, with the limitation that it is not a pristine baseline covariate.

Entry-level engineers define a coherent population and a useful training context; the study must not assume that they are uniformly careless or incapable of security review. Do not blend seniors into the sample and then attempt subgroup comparisons.

Budget 4–6 additional pilot participants, separate from the final 30. This is a practical usability and instrumentation pilot, not sufficient validation of a telemetry classifier. Recruit a small reserve if 30 complete sessions are required. If 30 is an absolute total recruitment limit, allocate the pilot explicitly and report the smaller main sample.

Thirty is a resource-constrained target, not a universal adequacy threshold. For orientation, a simple two-sided paired t-test with 30 pairs, alpha=.05, and 80% power detects a standardized paired difference of approximately dz=.53 under its assumptions [S10]. This does not establish power for binary outcomes, clustered probes, mode-by-context interactions, or missing episodes.

Before the main study, run a sensitivity simulation for the actual design across plausible vulnerability-retention rates, participant heterogeneity, missingness, and effect sizes. Choose a minimum effect worth detecting with the supervisor. Use pilot data mainly for event rates and feasibility; do not rely on an unstable pilot effect estimate. If power is limited, report uncertainty and keep interaction analyses exploratory.

Eight decisions from each of 30 people yield up to 240 decision records, not 240 independent participants. Four deliberately vulnerable exposures per participant yield up to 120 flawed-suggestion opportunities; actual acceptance and measurable modes will reduce analysis subsets.

## 6. Task structure and counterbalancing

Use one language, one IDE, and the same assistant UI in both conditions. Python is a reasonable default only if recruitment supports it. Changing from inline completions in acceleration to chat in exploration would confound interface with cognitive mode.

Create two matched task families, A and B: for example an internal document portal and an internal support-record portal. Each family contains four small, independent functions: two database-query tasks and two directory-constrained file-access tasks. Use different field names and business examples across families, while matching suggestion length, code complexity, visible test count, and target security properties as closely as possible.

Each family can be assigned to either condition:

* Acceleration encouragement: participants rehearse the relevant non-security workflow/API and describe a known implementation plan before the block. Use routine operations within demonstrated competence.
* Exploration encouragement: participants encounter an unfamiliar but fully documented API/workflow and discover how to implement the same kinds of functionality. Provide sufficient documentation and equal access to all security-relevant facts.

An especially controllable option is two small, equally capable project APIs, one rehearsed and one unrehearsed, with API assignment counterbalanced. If used, document that custom APIs increase internal control at the expense of realism. Preparation must not teach the exact fix or contain the insecure example used in the probe. A pilot must confirm that participants understand the task while differing in how well they know the implementation plan.

Do not tell participants to be careless, hurry, or inspect security more carefully in one condition. Give equal time and requirements. A condition that changes pressure, task complexity, programming language, and familiarity simultaneously cannot isolate a useful interpretation.

Suggested allocation:

| Sequence | First block | Second block | Participants |
|---|---|---|---:|
| 1 | A, acceleration encouragement | B, exploration encouragement | 8 |
| 2 | A, exploration encouragement | B, acceleration encouragement | 7 |
| 3 | B, acceleration encouragement | A, exploration encouragement | 7 |
| 4 | B, exploration encouragement | A, acceleration encouragement | 8 |

This yields 15 participants in each mode-order sequence and 15 assignments of each task family to each encouragement. Randomly allocate participants to this prepared schedule.

Within each block, expose each participant to one secure and one vulnerable suggestion per vulnerability class. Rotate which task instance gets each status. Independently balance two secure-context and two insecure-context examples per block across participants; rotate combinations so context is not tied to class, suggestion status, or position. Perfect balance is not possible in every cell with 30; save the allocation table, audit counts, and report residual imbalance.

Four independent probes in each block is a compromise between repetition and fatigue. Pilot 25–30 minutes per block. If unrealistic, shorten the functions, lengthen the session modestly, or reduce the exploratory questions before reducing to only two total decisions.

## 7. Planted suggestions and context probes

Use a controlled assistant that replays prepared, LLM-origin suggestions at predefined checkpoints. Record source model/version, generation prompts, original outputs, manual modifications, and final hashes. Generate candidates before the experiment and have two reviewers assess them. Be explicit that these are curated experimental stimuli; the experiment cannot estimate the natural vulnerability rate of that LLM.

Provide the same assistant interaction affordances in both conditions, such as a completion panel and a finite, documented explanation/help bank. Pilot whether this supports meaningful exploration. If live follow-up generation is essential, use a fixed configuration, save every exchange, mark all additional suggestions and warnings, and acknowledge unequal follow-up exposure. The preferred core design fixes critical suggestions and follow-up materials to keep the stimulus exposure interpretable.

| Class | Visible functional goal | Planted flaw | Security oracle |
|---|---|---|---|
| SQL injection | Search only matching records in a local database | Unsafe incorporation of untrusted input into a query | Query semantics remain constrained across adversarial input cases |
| Path traversal | Read a requested file from an allowed directory | Missing or incorrect canonical-path containment check | Requests cannot return contents outside the defined root under the stated filesystem assumptions |

Specify symlink assumptions and platform behavior for path tasks. Secure variants must still perform the intended function; refusing all input is not a successful solution. Use local dummy data only. Keep one intended target flaw per vulnerable probe, and reject stimuli with distracting unintended defects.

For RQ2, place an equivalent neighboring example in the file: secure in one version, insecure in the other. Keep names, length, comment tone, visibility, and functionality comparable. The assistant candidate for a given item/status must stay identical across context versions. Otherwise the experiment combines human context influence with changes in what the model generates.

Assess the new target function separately from the seeded neighboring function. An unchanged planted example is not a newly introduced participant vulnerability. Code whether the participant copies/retains the relevant unsafe operation in the target, repairs it, removes it, or notices it only in the neighboring function. Acceptance of a matching insecure candidate is evidence of context-consistent reliance; proving the psychological mechanism is anchoring requires corroborating interview evidence and alternative explanations.

Secure controls are necessary: without them, blanket rejection and uniformly low confidence can appear desirable, and confidence discrimination between secure and insecure suggestions cannot be assessed.

## 8. Identifying mode without circular reasoning

The construct is implementation intent: did the participant know the next implementation approach, or were they using the assistant to discover it? Speed alone does not define mode. Exploration does not guarantee good verification; acceleration can reflect expertise and accurate pattern recognition.

At each microtask start, collect a brief, neutral plan/familiarity item before the critical suggestion. After the block, replay short timestamped clips and ask:

1. Before this suggestion, did you already know the implementation approach?
2. Were you mainly implementing an approach you had chosen, or deciding how to proceed?
3. Did that change during this part of the task? At what point?

Record each response on a small anchored scale plus optional explanation. These are study-specific items that require piloting, not an established validated scale. Do not describe modes to participants as “careless” and “careful,” or “fast” and “slow.”

Two raters code episodes as acceleration, exploration, mixed/transition, or insufficient evidence using intent and recalled approach. Mask final correctness and confidence where practical. Do not define exploration by “ran many tests” and then claim to discover that exploration produces more testing. Post-acceptance testing, edits, and pauses remain outcomes for RQ3, not ingredients of the primary mode label.

Prefer quiet work plus stimulated retrospective recall over continuous think-aloud, because talking can alter pauses and checking. This is a deliberate adaptation of Grounded Copilot. If continuous think-aloud is chosen, apply it consistently and avoid interpreting raw timing as natural behavior.

Double-code all eight decision episodes per participant if feasible (240 short episodes). Otherwise preregister a stratified subset, including both conditions and uncertain cases. Report raw agreement, class counts, and Cohen's kappa or Krippendorff's alpha before adjudication. Revise the rubric in the pilot, then freeze it.

Analyze all valid participants by assigned condition, including those whose mode did not match the encouragement. Report manipulation success explicitly. Observed-mode analyses are complementary and associational. Keep mixed/uncertain episodes visible; do not silently drop “failed induction” participants from the randomized comparison.

## 9. What trust calibration means operationally

Measure three constructs separately:

* **Security confidence:** a 0–100 probability judgment about a specified code artifact satisfying a defined security requirement.
* **Reliance:** whether the participant keeps, rejects, or repairs assistant code.
* **General tool trust:** optional short pre/post attitudinal questionnaire. It provides context but cannot replace episode-level confidence and outcomes.

The main measurement concerns confidence in accepted/retained code. It does not isolate how much confidence is attributable to the LLM versus the participant's own knowledge; interpret that through reliance records and interviews.

At each checkpoint, let the participant inspect and use the suggestion normally. When they first choose to keep or reject it, capture a snapshot and record the decision. Immediately obtain confidence, before feedback or further edits. For kept code, ask:

> How likely is it, from 0% to 100%, that this current implementation satisfies the stated security requirement, including for unusual or adversarial inputs?

Also ask functional confidence about normal stated behavior. For rejected suggestions, use a separate question explicitly referring to the displayed candidate. Keep the artifact reference and analysis denominator distinct. Never score confidence about a modified artifact against the original candidate's label.

Allow continued work, and at microtask submission repeat confidence about the final artifact. Save that snapshot too. Confidence prompts can themselves increase attention; use identical timing in both conditions, exclude prompt-completion time from behavior windows, and acknowledge the resulting measurement reactivity. The study observes participants under periodic confidence elicitation.

Score submitted artifacts with hidden adversarial tests plus blinded manual review. Define security as passing the scoped property, not being universally vulnerability-free. Score functional correctness separately. Record inconclusive/incomplete artifacts as such; do not count an unexecutable function as secure just because exploitation cannot run.

For a set of comparable decisions j, let c_j be confidence in [0,1] and y_j be the scoped security outcome (1=satisfies, 0=violates):

**Mean calibration gap:** G = mean(c_j) - mean(y_j).

Positive G indicates aggregate overconfidence; negative G indicates aggregate underconfidence. Individual residuals c_j-y_j are not evidence of a stable personal calibration trait. A person who reports 80% can be well calibrated across trials despite some failures.

**Brier score:** B = mean((c_j-y_j)^2).

Lower scores indicate better probabilistic prediction overall. Brier mixes calibration and discrimination; do not present it as a pure calibration metric [S9].

Report mean confidence on insecure artifacts, secure-versus-insecure confidence separation, unsafe retention, and pooled reliability plots with uncertainty. Four decisions per condition cannot support reliable individual calibration curves or fine-binned ECE. Report counts and missing confidence explicitly.

Define unsafe retention as an exposed target flaw still present in the submitted target function. Separately record whether the flaw was recognized. Detection without repair, repair without explicit recognition, and failed repair are distinct outcomes. Normalize detection rates by vulnerable exposures, not by all suggestions.

Analyze confidence among accepted artifacts to answer the stated question, but identify this as an acceptance-conditioned subset. Also report every exposure and rejection: mode-dependent acceptance can change which items enter the subset. If a participant accepts no assessable suggestions in a condition, their accepted-code calibration is undefined, not zero.

## 10. IDE extension and telemetry specification

Start by evaluating CodeWatcher for reuse, then implement the missing study functions. CodeWatcher's documented events include insertions, deletions, copy/paste, and focus changes; its filters omit much character-level typing. It therefore cannot be assumed to provide complete typing-speed data without modification. Its published tool validation used controlled trials and does not validate cognitive inference [S4].

A study-controlled suggestion provider makes displayed/accepted/rejected events and suggestion IDs observable. Generic document-change hooks alone cannot reliably distinguish an accepted assistant suggestion from a pasted snippet. VS Code exposes document/editor events and completion APIs, but ordinary extensions should not be assumed to see every proprietary assistant event [S11].

| Capture | Derive | Purpose / limitation |
|---|---|---|
| Suggestion displayed, candidate ID, full/partial accept, explicit reject, expiration | Time to decision; uptake and partial uptake | Separate model waiting time from inspection time; inactivity is not automatically rejection |
| Document changes, version IDs, affected ranges, snapshots | Edit amount and target-region changes | Large edit distance is not necessarily security repair |
| Editor/file/panel focus and selection events | Navigation and revisits | Focus is not gaze; it cannot prove reading |
| IDE activity timestamps, focus loss, assistant waiting | Pauses and active elapsed time | Separate recorded inactivity from thinking; exclude known waiting and survey time |
| Instrumented run/test command with structured test IDs and results | Functional versus security-relevant checks; failures; rechecks | Terminal visibility alone does not show what was tested |
| Confidence prompt and snapshot ID | Confidence/outcome alignment | Save the exact rated artifact |
| Task and microtask boundaries, context variant, candidate status | Analysis linkage | Assigned condition must remain distinct from coded mode |

Minimum event record: schema_version, pseudonymous participant_id, session_id, sequence_number, monotonic_timestamp, event_type, block_id, task_item_id, candidate_id, document_version, snapshot_id, and event-specific payload. Store UTC timestamps too for recording alignment. Keep identity/contact records separate.

Use local JSONL buffering and an explicit session export. A research server is optional, not necessary for 30 sessions. Collect only study-project data; code content and screen recording require explicit consent. Pin the extension and API versions and verify behavior in the selected runtime.

Feature definitions, computed on explicit windows:

* Decision latency = first keep/reject time minus confirmed display time; retain undecided cases as censored/missing, not arbitrary zeroes.
* Normalized edit distance = token-level Levenshtein distance between aligned target snippets divided by max(original length, final length, 1). Specify tokenizer and range tracking.
* Churn rate = inserted plus deleted characters in the target region divided by active observation minutes. Keep formatting-only changes identifiable.
* Pause fraction = summed qualifying inactivity intervals divided by eligible window duration. Pilot a threshold such as 2 seconds and report sensitivity at 5 seconds; neither threshold establishes cognition.
* Revisit count = returns to a previously viewed target region, using a preregistered event-based definition.
* Security-check occurrence = at least one observed check that tests or reasons about the scoped security property, verified from test content or qualitative coding.

Do not sum undo/redo/delete counts into a “churn ratio” without ensuring non-overlapping event definitions. Avoid acceptance-history features in the primary mode measurement because acceptance is also a key outcome.

Use a pre-display window (for example up to 60 seconds, tagged when shorter) for optional mode prediction. For RQ3, use first acceptance to microtask submission, report exposure duration, and distinguish activity before versus after recognizing the flaw. Later repairs can cause churn, making reverse causation likely.

The CHI 2026 verification-load composite is a source of candidate process measures, not a requirement to create another index [S8]. Keep individual measures primary. If an adapted index is later used, define its components, normalization, missing values, and validation first. More verification burden is not synonymous with more effective checking.

## 11. Session and environment

Plan about 110–120 minutes, to be revised after the pilot:

| Stage | Minutes | Purpose |
|---|---:|---|
| Consent, background, neutral study explanation | 10 | Establish eligibility and collection consent |
| IDE warm-up and condition preparation | 15 | Reduce tool novelty; implement the familiarity manipulation |
| First task block | 25–30 | Four controlled decisions |
| First retrospective recall and break | 10 | Label episodes while memory is fresh; reduce fatigue |
| Second task block | 25–30 | Four corresponding decisions |
| Second recall, short interview, debrief | 20–25 | Explain decisions and disclose planted faults |

Use identical machine images where possible: OS, screen size, VS Code, extension versions, runtime, dependencies, dataset, test harness, assistant settings, documentation, and network policy. A container standardizes runtime but not screen, editor, or human-facing environment. Restore a clean project copy for every session and disable unrelated coding assistants. Provide the same local docs in both conditions.

Keep the threat model and security requirements equally available. Do not hide requirements in order to manufacture mistakes. Withhold researcher test results until the end; participants may run their own checks. No feedback between blocks explaining which seeds were flawed, to limit teaching effects. Record ordinary feedback participants discover themselves.

Obtain institutional ethics review before recruitment. Curated or altered assistant outputs may require approved partial disclosure and debriefing. Explain screen/code collection, retention, withdrawal, and separation from employment evaluation. Use local synthetic data and no real secrets. Pay for participation rather than correct/security outcomes.

## 12. Evaluation and analysis

### A. Instrument validation

Create scripted manual scenarios with known actions: display, accept, reject, partial accept, ordinary paste, typing, delete, undo, file switch, focus loss, tests, confidence, export. Compare logs with screen recordings and expected event counts. Report event precision/recall, duplicate/missing events, timestamp ordering, artifact hashes, and all critical decisions successfully linked to snapshots. Test offline buffering and interrupted sessions. This validates the instrument, not the research hypothesis.

### B. Manipulation evaluation

Compare independent plan-known ratings and proportions of coded acceleration/exploration episodes between assigned conditions. Report transitions and uncertain labels. If conditions produce similar mode distributions in the pilot, redesign preparation/tasks before collecting the main sample. If the main manipulation fails, report that failure and restrict conclusions; telemetry cannot retrospectively rescue a failed experimental contrast.

### C. Primary and secondary outcome analysis

Preregister one primary RQ1 contrast: difference in participant-level mean accepted-code calibration gap between assigned acceleration-encouragement and exploration-encouragement conditions at first keep decision. Report its raw components (confidence and security outcome rates), paired effect estimate, and uncertainty. Because acceptance is post-assignment selection, interpret this as a contrast among selected accepted artifacts rather than a pure causal mode effect. Use all-exposure unsafe-retention results to contextualize it.

Use participant-cluster bootstrap intervals for descriptive contrasts, keeping each participant's records together; specify the method and inspect small-sample stability. A paired t-test is a simple sensitivity analysis if its assumptions are reasonable. Prespecify how participants lacking an assessable accepted artifact in either condition are reported and handled; do not impute perfect calibration.

For item-level outcomes, a parsimonious mixed logistic model can be used:

    logit P(unsafe_final_ij = 1) = beta0 + beta1*assigned_condition_ij
        + beta2*context_ij + beta3*candidate_status_ij
        + beta4*period_ij + item_effect_j + participant_intercept_i

Use item effects for the small fixed collection of task templates. Candidate status varies across participants within template. Assess model identifiability, separation, and convergence; simplify or use a regularized Bayesian model with stated priors if necessary. Do not fit a large predictor set solely because many telemetry rows exist. The RQ2 interaction condition*context is exploratory and should be added in a separate prespecified model.

Observed-mode versions of these models are secondary associations. RQ4 mode/condition-by-class models replace collinear fixed item/class terms appropriately: class is nested in templates, so a class main effect cannot simply be added to fully saturated item indicators. Report class-specific estimates and uncertainty, recognizing template-specific limitations.

For RQ3, select a few interpretable measures in advance, such as any security-relevant check, revisit count, and normalized target edit distance. Compare them by condition, then examine associations with unresolved flaws. Separate pre-detection checking from post-detection repair. Controlling for task and candidate status reduces some confounding but does not prove checking causes success. Avoid causal mediation claims in this design.

For an adequately populated pooled calibration plot/model, use:

    logit P(y_ij = 1) = a + b*logit(c_ij) + g*condition_ij
        + d*condition_ij*logit(c_ij) + participant_intercept_i

Preregister clipping of confidence 0 and 1 for the logit. This model is optional because sparse outcomes and highly confident ratings may make it unstable. An interaction alone does not establish calibration: assess intercept, slope, and observed-versus-predicted probabilities. Overall perfect calibration corresponds to identity of predicted and observed probabilities; conditional mixed-model parameters require careful marginal interpretation.

Report RQ1 as primary, secondary outcomes with an explicit multiple-testing policy, and RQ2 interaction/RQ4 as exploratory. A null p-value with a wide interval is inconclusive, not proof that modes are equivalent.

### D. Optional telemetry classifier

Only attempt this if independent labels are sufficiently clear and both classes occur across many participants. Start with regularized logistic regression using a small feature set. Compare against majority-class and assigned-condition-only baselines. Evaluate by leaving entire participants out; overlapping windows from one person must never be split across train/test. Fit scaling and feature selection within training folds. Per-person normalization for a new participant must use a separate warm-up or past observations, not future session data.

Report balanced accuracy, per-class precision/recall, confusion matrix, probability calibration, and uncertainty. Include an uncertain classification option whose threshold is chosen within training data. Do not treat .70 as an established cognitive threshold. Hidden Markov models are optional future work; unsupervised hidden states do not acquire cognitive meaning automatically.

### E. Qualitative analysis

Use a small deductive codebook with room for emergent codes: known implementation plan, uncertainty/discovery, acceptance rationale, reliance on working tests, security-specific reasoning, reliance on neighboring code, reason for rejection, perceived assistant competence, and changes in trust. Collect counterexamples, such as careful acceleration and uncritical exploration.

Ask neutral interview questions: “What convinced you?”, “What did the test result establish?”, “How did the surrounding code influence your approach?”, “Why did you return to this function?”, and “What remained uncertain?” Ask about security reasoning after the task rather than coaching during it. Integrate quotes with timestamped behavior and artifact outcomes, not as stand-alone proof of a causal mechanism.

## 13. Execution schedule and deliverables

| Phase | Suggested duration | Output and completion criterion |
|---|---|---|
| Scope, references, ethics submission | Weeks 1–2 | Final questions, construct definitions, consent/debrief draft; ethics submitted |
| Task/stimulus authoring | Weeks 3–4 | Two families, eight templates, secure/vulnerable and context variants; reviewer-agreed oracles |
| Extension and harness | Weeks 5–6 | Versioned environment, event schema, snapshot scoring, event-validation report |
| Pilot and sensitivity analysis | Weeks 7–8 | Timing and manipulation evidence; revised tasks; plausible power/precision scenarios |
| Protocol freeze and recruitment | Week 9 onward, after ethics approval | Preregistration, schedule, eligibility checks; no outcome-driven design changes |
| Main sessions | Weeks 10–12 | 30 completed sessions, daily data-integrity checks; log any replacements/exclusions |
| Coding and analysis | Weeks 13–15 | Independent episode labels, adjudication log, scored artifacts, estimates and uncertainty |
| Interpretation and writing | Weeks 16–18 | RQ-linked results, limitations, reproducible analysis, revision of proposal slides |

Durations are planning estimates and depend on ethics turnaround, access to engineers, and a second coder/security reviewer. Do not run the main study before the pilot shows usable modes, nontrivial detection rates, and reliable telemetry.

Minimum research package: protocol; recruitment/screening forms; consent and debrief; allocation manifest; tasks and model-output provenance; security/functional test harness; extension and environment manifest; mode and verification codebooks; analysis script; anonymized event dictionary and permitted dataset; limitations log.

## 14. Corrections to the earlier discussion

1. More testing in exploration is a hypothesis, not a predetermined conclusion. Expertise may make acceleration both quick and safe.
2. Two task conditions encourage modes; they do not certify mental states. Dual-process theory provides interpretation, not a telemetry equation.
3. The latest four RQs do not require a real-time classifier or an adaptive prompt. Adding both would materially enlarge the study.
4. Thirty participants can support a focused study with repeated measurements and qualitative evidence; it cannot automatically support all interactions.
5. Brier score is an overall probabilistic score, and a single confidence-minus-binary-outcome residual is not a complete calibration measure.
6. A generic pause, edit, or test event does not prove security verification. A successful security repair must be assessed against the target property.
7. Calling every rejected suggestion distrust is incorrect: rejection can reflect irrelevance, duplication, task fit, or preference.
8. If the design contains only one injection task and one path task, vulnerability class is confounded with task. Multiple instances and cautious scope are required.
9. A convenience mixture of novices and seniors does not strengthen a small study of entry-level engineers.
10. If security is removed, the study remains possible, but the outcome construct and probes must change to general correctness rather than retaining security claims.

## References and source roles

S1. Barke, James, and Polikarpova. *Grounded Copilot: How Programmers Interact with Code-Generating Models*. 2022 preprint; OOPSLA 2023 publication. [Paper](https://arxiv.org/abs/2206.15000). Local supplied PDF examined, especially Method and Theory.

S2. Perry, Srivastava, Kumar, and Boneh. *Do Users Write More Insecure Code with AI Assistants?* CCS 2023. [Paper](https://arxiv.org/abs/2211.03622). Evidence for security-confidence concerns in a particular assistant/task setting.

S3. Sandoval et al. *Lost at C: A User Study on the Security Implications of Large Language Model Code Assistants*. USENIX Security 2023. [Conference source](https://www.usenix.org/conference/usenixsecurity23/presentation/sandoval). Counterpoint showing contextual variability.

S4. Basha et al. *CodeWatcher: IDE Telemetry Data Extraction Tool for Understanding Coding Interactions with LLMs*. 2025. [Paper](https://arxiv.org/abs/2510.11536); [author artifact](https://osf.io/j2kru/overview). Supplied PDF examined, especially event representation and validation. Artifact reuse still requires implementation/license inspection.

S5. Javahar et al. *Cracking CodeWhisperer: Analyzing Developers' Interactions and Patterns During Programming Tasks*. VL/HCC 2025. [Paper](https://arxiv.org/abs/2510.11516).

S6. Al Awad et al. *Pre-Filtering Code Suggestions using Developer Behavioral Telemetry to Optimize LLM-Assisted Programming*. 2025 preprint. [Paper](https://arxiv.org/abs/2511.18849). Supplied paper examined in this conversation; acceptance prediction, not mode validation.

S7. Kuo et al. *Developer Interaction Patterns with Proactive AI: A Five-Day Field Study*. IUI 2026. [Paper](https://arxiv.org/abs/2601.10253). Supplied paper examined in this conversation; workflow receptivity.

S8. *When Help Hurts: Verification Load and Fatigue with AI Coding Assistants*. CHI 2026. [Publisher](https://doi.org/10.1145/3772318.3791176). Publisher-indexed methods text inspected; direct full-page access returned 403. Verify the full article before reproducing the composite in a preregistration. This protocol uses its components only as candidate measures.

S9. *A tutorial on calibration measurements and calibration models for clinical prediction models*. [Article](https://pmc.ncbi.nlm.nih.gov/articles/PMC7075534/). Statistical definitions only; this is not a validation of human trust instruments.

S10. statsmodels. *TTestPower*. [Documentation](https://www.statsmodels.org/stable/generated/statsmodels.stats.power.TTestPower.html). Paired-test sensitivity interpretation; actual study requires design-specific assessment.

S11. Microsoft. *VS Code Extension API*. [Documentation](https://code.visualstudio.com/api/references/vscode-api). Technical feasibility of extension instrumentation; inspect the selected version before implementation.

Background documents: the supplied original research proposal and *Proposal_Defense_Presentation.pdf*, dated 1 July 2026. Their older five RQs, heterogeneous sample, “first study” language, and ECE-centric measurements are superseded by this draft's narrower definitions and the user's latest questions.
