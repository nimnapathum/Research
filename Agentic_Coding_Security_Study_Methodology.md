# Methodology blueprint: cognitive mode, trust, and security in agentic coding

Draft for supervisor discussion, 4 October 2026. This is a proposed design, not a validated instrument or preregistration. Exact tasks, thresholds, timing, and sample size must be piloted. The only prior local artifact available for this review was [Security_Trust_Study_Workplan.md](Security_Trust_Study_Workplan.md); the original proposal and attached papers were not present in this workspace.

## 1. Research claim and scope

**Aim:** Examine whether developers working with a coding agent in acceleration and exploration episodes differ in their security judgments, reliance on generated changes, verification, and retention of scoped vulnerabilities.

**Unit of analysis:** an agent-generated change or a deliberately presented agent-generated review candidate, tied to a specific code snapshot and security requirement. A whole task is too coarse because participants can change mode mid-task.

Use **assigned task preparation** (encouraging a mode) and **observed episode mode** as different variables. The assignment can be randomized; a mental state cannot. The design can estimate effects of assignment and associations with coded mode. It cannot claim that an internal System 1 or System 2 state was measured directly. This follows the intent-based definition and observed switching in [Barke et al., *Grounded Copilot*](https://arxiv.org/abs/2206.15000).

Separate three constructs:

1. **Security judgment:** probability that a named artifact satisfies a named security property.
2. **Behavioral reliance:** whether the participant keeps, rejects, or repairs a particular agent change.
3. **General trust attitude:** optional questionnaire/interview statements about the agent. This is context, not a substitute for item-level judgment and behavior. [Perry et al.](https://arxiv.org/abs/2211.03622) measured security belief; [Khalid et al.](https://arxiv.org/abs/2609.21020) measured selection, edits, security outcomes, and reported trust separately.

## 2. Recommended research questions

| Priority | Question | Main observable evidence |
|---|---|---|
| Primary | How does the alignment between developers' security confidence and the assessed security of agent-generated changes differ across assigned acceleration-encouragement and exploration-encouragement conditions? | Confidence about the exact reviewed snapshot; blinded security adjudication; report secure and insecure items separately. |
| Co-primary or key secondary | How do the conditions differ in retention of exposed target vulnerabilities in submitted code? | All exposed opportunities, including rejection and repair; final artifact security. |
| Secondary | What security-specific checks occur before and after a participant decides to keep agent code, and how are these associated with final vulnerability retention? | Screen/video coding, tests, edits, agent requests, interview explanation. |
| Exploratory | Does an insecure workspace instruction/example alter agent output and developer retention, and does this vary by observed mode? | Randomized file variant; actual agent exposure; output classification; human decision. |

Vulnerability class comparisons can be descriptive/exploratory if there are multiple examples per class. With only one example of each class, class and item difficulty are inseparable.

## 3. Why this is still a contribution

[Perry et al.](https://arxiv.org/abs/2211.03622) found less secure output and greater security belief with assistant access in their tasks. [Sandoval et al.](https://www.usenix.org/conference/usenixsecurity23/presentation/sandoval) found a smaller security effect in C. [Oh et al.](https://arxiv.org/abs/2312.06227) studied insecure suggestions from poisoned assistants. [Khalid et al.](https://arxiv.org/abs/2609.21020), a September 2026 preprint, directly examined selection, verification, and trust in AI-generated code. Thus, the novelty claim must be the **mode-linked agent workflow and carefully controlled context effect**, not merely that developers accept insecure AI code or fail to inspect it.

## 4. Vulnerability-exposure options and decision

| Option | What it supports | Main weakness | Decision |
|---|---|---|---|
| Unmodified live agent | Ecological observation of actual agent output and developer reactions | It may generate no vulnerability, or different flaws for each person; the denominator of exposed participants changes | Keep as a naturalistic stream, not the sole source of target cases. |
| Workspace rule file (`AGENTS.md`/`GEMINI.md`) encouraging an insecure shortcut | Experimental test of rule-file influence on agent output and subsequent human review | It manipulates the agent as well as the human's exposure; output remains stochastic; participants who do not read the file cannot directly evaluate its contents | Randomize as a secondary factor only after a pilot shows exposure. |
| Fixed, previously generated agent patch at a review checkpoint | Equal flawed and secure candidate exposure and interpretable human comparison | Less natural than a spontaneous agent change | Recommended for the primary human trust/security comparison. |
| Insecure starter helper in the codebase | Guaranteed visible flaw and study of propagation | The flaw originates in researcher-provided code, not the agent | Useful only if origin is recorded and the claim is about propagation or detection. |

**Recommended hybrid:** participants use a real Antigravity agent on both tasks. At designated review checkpoints, present a versioned, previously generated agent patch (secure or vulnerable, balanced across participants). Preserve the agent's unprompted output as separate evidence. If a fixed patch cannot be presented credibly inside the same workflow, use randomized secure/insecure workspace rules plus a preflight generation pilot, and change the main outcome to **security of the submitted artifact under randomized rule condition**. Do not call a rule-induced vulnerability a naturally occurring agent error.

For a rule-file experiment, use an innocuous secure/unsafe pair of project conventions that differ in the target operation, keep the task prompt and other files identical, and keep the file available in the workspace. Google documents that Antigravity automatically loads scoped `AGENTS.md` and `GEMINI.md` rules into agent context. Record which file version was active, whether the agent read it, what output it produced, and whether the participant noticed the resulting code. [Antigravity rules documentation](https://www.antigravity.google/docs/rules/). Do not rely on a generic arbitrary Markdown file being automatically loaded.

Tell participants in consent that project materials may include incomplete or imperfect guidance and that their work and screen are recorded. If concealing the specific planted flaw is necessary, seek ethics approval for partial disclosure and debrief afterward. Avoid instructing participants that project instructions are irrelevant while the agent silently uses them: that creates a separate transparency manipulation. If you ask them not to open a file, state this uniformly for all conditions and explain at debrief.

## 5. Participants and the junior-developer challenge

Define one target population operationally, for example final-year CS/IT students who have completed a software project and engineers with 0–2 years of professional development experience. Record category, JavaScript proficiency, experience with the specific APIs, security training, and coding-agent frequency separately. Screen for a minimum JavaScript/Node ability with a short neutral task. Do not assume final-year students or juniors are new to AI; measure that directly. [Barke et al.](https://arxiv.org/abs/2206.15000) screened for language experience and explain why years alone can mislead. [Khalid et al.](https://arxiv.org/abs/2609.21020) reported that greater programming experience did not simply guarantee safer final code in their setting, so “juniors just accept everything” is a hypothesis, not a settled fact.

The defense is about the **population and variation within it**: junior/transition-to-work developers are a coherent group whose security decisions matter. Within that group, the study tests whether code quality, mode, confidence, and verification vary. Secure control patches reveal whether participants indiscriminately accept, indiscriminately reject, or discriminate. A short security knowledge assessment lets you describe knowledge and perform cautious adjusted/sensitivity analyses. Avoid claiming results generalize to senior engineers.

The existing workplan's 30 completed participants is a planning target, not a power calculation. Two tasks do not equal independent observations if each contains several review decisions; cluster all analysis by participant. Run a design-specific simulation using pilot exposure and retention rates. If sample size is limited, keep interactions and vulnerability-class contrasts exploratory.

## 6. Two-task structure and language

Use **one language and runtime** in both tasks: JavaScript or TypeScript on Node.js. JavaScript lowers setup friction for web-oriented participants; TypeScript adds type checking but does not settle security questions. Choose one after a recruitment survey and freeze the choice. Do not mix languages across modes, because language familiarity would confound the comparison.

Make two parallel, small projects rather than always assigning a different project to each mode. Example: **Document Desk** and **Case Desk**, each with (a) a record-search handler over a local database and (b) a file-download handler constrained to a local root. Both use dummy data and have the same number of files, similar code size, identical visible functional checks, and the same stated security requirements. The security properties are concrete: query parameters remain data rather than SQL syntax; a requested path cannot escape the authorized root. CodeQL documents JavaScript checks for [SQL injection](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/) and [uncontrolled path use](https://codeql.github.com/codeql-query-help/javascript/js-path-injection/).

Each participant completes both projects, one in each condition. Counterbalance which project receives which condition and which condition comes first. To encourage acceleration, provide a short non-security tutorial and a practice exercise on the relevant API before the project, then ask for a brief implementation plan. For exploration, provide equally complete reference documentation but no practice. This adapts Barke et al.'s familiar/unfamiliar task strategy; it does not prove mode induction. Pilot the plan-known ratings and retrospective labels. Do not change time pressure, agent model, interface, security requirements, or language between conditions.

At minimum, each project has two separate feature/review checkpoints (search and file access), yielding four distinct security judgments per person. That permits only **pooled** confidence analysis; it does not support a reliable individual calibration curve. If calibration is central, pilot four short checkpoints per project (eight total), or add a separate short code-review judgment battery and label it as a distinct measurement context. Preserve the user's requirement of **two main coding tasks**.

## 7. Antigravity instrumentation: verified capability and validation gate

Google's current Antigravity IDE documentation describes agent work across editor/terminal/browser and an in-editor review-changes view. It documents workspace rules, hooks, and local transcript paths. Hooks can observe `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, and `Stop`; common payload fields include `conversationId`, `transcriptPath`, and `modelName`. These are stronger evidence sources for agent activity than a generic editor extension alone. [IDE overview](https://www.antigravity.google/docs/ide/overview/), [review changes](https://www.antigravity.google/docs/ide/review-changes-editor/), [hooks](https://www.antigravity.google/docs/hooks/).

| Source | Capture | Important limit |
|---|---|---|
| Antigravity transcript export and hooks | Prompt/response sequence, model, tool calls, candidate and file provenance, timestamps | Inspect actual transcript schema/version in a pilot; hooks do not automatically prove that a human viewed or approved every change. |
| Study IDE extension, if Antigravity supports it | Workspace document changes, active editor, task markers, code snapshots, study confidence forms | Test installation and event delivery in the exact Antigravity build; VS Code APIs describe VS Code, not a guarantee that all Antigravity agent UI events are public. [VS Code API](https://code.visualstudio.com/api/references/vscode-api). |
| Versioned file snapshots or Git commits | Exact code before agent edit, after agent edit, after human review, at submission | Do not infer authorship from diff alone; align with transcript and video. |
| Screen recording | What the participant visibly inspected, approvals, external checks, and transitions | A visible screen is not eye tracking or proof of comprehension. |
| Study task runner | Test commands and structured functional/security results | Participants should see only designated public tests; hidden security tests run after submission. |
| Post-task interview | Intent, rationale, interpretation of tests, what remained uncertain | Retrospective self-report can be mistaken; use clips and artifacts as prompts. |

**Required pilot gate:** script known actions (agent request, response, file read/write, review view, accept/reject or revert, manual edit, test, focus switch, form response, export), then compare extension/hook/transcript data to the screen recording. Report missing/duplicate events and ensure every scored artifact is linked to its exact snapshot. If approval events are unavailable, code human reliance from video plus before/after snapshots, explicitly as an approximation. Pin IDE and model versions; verify quota access for every participant. Google says individual account quotas vary by plan and can change. [Antigravity plans](https://www.antigravity.google/docs/plans/).

## 8. Measures and coding rules

| Construct | Primary measure | Corroboration / caution |
|---|---|---|
| Mode manipulation | Pre-agent plan-known rating and short written plan, compared across assigned conditions | Retrospective episode labels; manipulation failure must be reported. |
| Observed cognitive mode | Two independent coders assign acceleration, exploration, transition/mixed, or insufficient evidence from intent and recalled decision process | Do not use verification/test count to define mode, then test whether mode predicts verification. [Barke et al.](https://arxiv.org/abs/2206.15000); [Wu et al.](https://arxiv.org/abs/2604.16393). |
| Security confidence | After the review decision, 0–100% probability that the **named reviewed snapshot** satisfies the stated security property; repeat for final submitted snapshot | Keep candidate and final-artifact ratings separate; the prompt can itself increase checking. |
| Behavioral reliance | Candidate shown; kept, rejected, repaired, reverted; retained target flaw at submission | Acceptance alone is ambiguous if agent changes files automatically; capture first review and final state. |
| Verification | Security-relevant check observed before/after decision, with subtype: reasoning about data flow, inspection of diff, adversarial test, static scan, documentation lookup, agent request for security review | A test run or long pause is not automatically security verification. [Khalid et al.](https://arxiv.org/abs/2609.21020). |
| Outcome | Scoped vulnerability absent/present/inconclusive, functional behavior pass/fail, origin and provenance of flaw | Hidden adversarial tests plus independent manual review; scanner findings are corroborating evidence. |

For aggregate calibration, report mean confidence and actual security rate separately for secure and vulnerable items, mean confidence minus outcome, and Brier score as a probabilistic accuracy measure. Report sample sizes and uncertainty. Brier score mixes calibration and discrimination; with four judgments per participant, do not produce individual ECE/reliability curves. The most direct safety outcome is **high confidence in a retained vulnerable artifact**; report its frequency alongside secure-code acceptance to identify blanket distrust. An optional general-trust scale can give descriptive context, but it should not be called security calibration.

## 9. Interview guide and provenance

No source above provides a validated questionnaire that directly diagnoses a person's acceleration/exploration state during an autonomous-agent task. The following are **study-specific, source-derived prompts to pilot**, not verbatim validated items. Barke et al. used observation, talk-through, and semistructured interview to identify intent; Wu et al. used retrospective labeling from screen recordings; Khalid et al. used artifact-supported interviews about suggestion choice and review. [Barke](https://arxiv.org/abs/2206.15000), [Wu](https://arxiv.org/abs/2604.16393), [Wu replication materials](https://github.com/YinanWusoymilk/FSE-2026-How-Developers-Interact-with-AI), [Khalid](https://arxiv.org/abs/2609.21020).

**Before each feature, before agent output:**

1. “What approach do you currently plan to use?” (free text, one sentence)
2. “How certain are you about the next implementation steps?” (0–100)

**Immediately after each task, replay selected short clips before revealing hidden test results:**

1. “At this point, had you already decided how to implement the feature, or were you using the agent to discover an approach? What tells you that?”
2. “Did that change during this part of the task? Where?”
3. “What did you expect the agent to do here, and which parts of its change did you inspect?”
4. “What convinced you to keep, edit, or revert this change?”
5. “What security property did your check establish? What might it have missed?”
6. “Did anything in the surrounding project files influence your decision?”
7. “At submission, what remained uncertain about this code?”

Ask a neutral final question about general agent reliability only after all task-level judgments. Do not ask leading questions such as “Why did you overlook the vulnerability?” during the study. Pilot interview wording, train two coders, freeze a codebook, report agreement before adjudication, and retain mixed/uncertain episodes.

## 10. Security scoring and third-party scanners

Use a three-part oracle: (1) ordinary functional tests; (2) hidden adversarial tests for the explicitly scoped threat; (3) manual security review by two reviewers or adjudication of disputed cases. [Sandoval et al.](https://www.usenix.org/conference/usenixsecurity23/presentation/sandoval) and [Khalid et al.](https://arxiv.org/abs/2609.21020) used test-based assessment and manual review. A scanner such as SonarQube, Snyk Code, or CodeQL can provide an additional signal; it should not alone be the truth label. Record tool/version/ruleset and inspect whether the chosen APIs are modeled. [CodeQL JavaScript SQL query](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/), [CodeQL JavaScript query list](https://codeql.github.com/codeql-query-help/javascript/), [SonarQube security rules](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-rules/security-related-rules), [Snyk JavaScript support](https://docs.snyk.io/supported-languages/supported-languages-list/javascript).

Keep target flaw labels separate from “any vulnerability.” A planted vulnerable neighbor that remains unchanged is not a vulnerability introduced by the participant. Code whether the flaw originated in the researcher context, live agent output, fixed agent patch, or participant edit. A function that refuses every request is not a secure success if it fails the stated functional requirement. Define path-resolution and symlink assumptions before writing hidden tests.

## 11. Session sequence and analysis

1. Consent and neutral eligibility/background questionnaire; separate AI-agent experience from junior status.
2. Antigravity/extension warm-up on a non-security feature.
3. Randomized task order and project-to-condition assignment; preparation/tutorial for one project, reference documentation for the other.
4. Two coding tasks in the same language and same Antigravity setup. At each checkpoint: pre-output plan-known item, agent work, first review decision, exact code snapshot, security/functional confidence, continued edits, final snapshot and confidence.
5. Immediately after each task: short video/artifact-supported interview. Do not disclose flaw locations until all tasks and judgments end.
6. Post-session security knowledge assessment if pre-assessment would prime the task; debrief seeded instructions/patches and allow withdrawal according to ethics protocol.

Preregister a **single primary contrast**, the within-person difference in aggregate item-level security judgment quality between assigned conditions, while reporting confidence and security outcomes separately. The key safety outcome is within-person difference in vulnerable final retention among actual target exposures. Use participant-clustered uncertainty or a parsimonious mixed model, accounting for task family, order, patch status, and participant. Observed-mode analyses are associational. Compare verification descriptively by condition/mode and examine association with unresolved flaws; do not claim mediation from this design. A mode-by-rule interaction and vulnerability-class effects need more participants/items and should be exploratory unless powered in advance.

## 12. Artifact package to prepare before recruitment

1. Protocol and RQ/construct/measure map; source-to-decision matrix that distinguishes prior method from your adaptation.
2. Recruitment and eligibility form; AI, JavaScript, and security-experience items.
3. Consent, partial-disclosure justification, recording/data-retention plan, and debrief.
4. Two matched repositories, task sheets, documentation, non-security tutorial, warm-up, public tests, hidden security tests, and reset scripts.
5. Versioned secure/vulnerable agent patches and rule-file variants, with hashes, source model/version, prompt provenance, reviewer sign-off, and allocation table.
6. Antigravity environment manifest, extension, hook configuration, transcript/export script, event dictionary, and instrumentation validation report.
7. Confidence forms with snapshot IDs, interview guide, mode codebook, verification codebook, vulnerability adjudication form, and pilot revision log.
8. Preregistered exclusion rules, analysis script, sample-size simulation, and reproducibility package.

**Go/no-go pilot criteria:** the assigned conditions produce distinguishable plan-known/mode distributions; each task finishes within the session; target secure/vulnerable variants remain functionally plausible; enough participants actually encounter reviewable vulnerable output; all critical logs and snapshots align; scanner and hidden-test results agree with expert review on authored fixtures. Any unmet gate requires changing the design before the main study, not relabeling observed behavior afterward.
