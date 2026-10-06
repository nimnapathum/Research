# Research aim, questions, and defenses

**Canonical status:** current researcher-supplied wording, 5 October 2026. Editorial suggestions are explicitly labeled. Source support and its limits are in [REFERENCES.md](REFERENCES.md).

## Aim

> Examine whether developers working with a coding agent in acceleration and exploration episodes differ in their security judgments, reliance on generated changes, verification, and Trust calibration on security.

The practical object of study is a developer judging an **agent-produced change to a specific repository**, deciding what to keep, checking it, and submitting code that can be assessed for named security requirements. “Trust calibration” here means the relationship between stated **security confidence** and actual security of the **same saved code snapshot**. Reliance and verification are observed behaviors, not synonyms for confidence.

**Current implementation caveat:** the 16 runnable candidate patches are researcher-constructed software prototypes. They support engineering and pilot testing, but the main study cannot call them unmodified agent output. The [candidate provenance protocol](study-system/pilot/CANDIDATE_PROVENANCE.md) requires either a genuine target-agent pool or an explicit constructed-stimulus description before participant use.

## Finalized RQs (verbatim)

**RQ1:** How does alignment between developers’ security confidence and assessed code security differ between acceleration-oriented and exploration-oriented conditions? How does this relate to observed interaction mode?

**RQ2:** How do the two conditions affect whether security vulnerabilities remain in the final submitted code?

*(Exposed vulnerabilities, participant decisions, repairs, and final code security.)*

**RQ3:** How do security verification behaviors before and after provisional retention of agent-generated code differ between acceleration-encouragement and exploration-encouragement conditions, and how are these behaviors associated with removal or retention of known exposed vulnerabilities in the final submission?

**RQ4:** Do these patterns differ between SQL injection and path traversal opportunities?

### Small wording issue to decide with the supervisor

RQ1/RQ2 use “acceleration-oriented and exploration-oriented conditions”; RQ3 uses “acceleration-encouragement and exploration-encouragement.” The protocol will use **randomly assigned encouragement condition** for causal comparisons and **observed interaction mode** for descriptive/associational analysis. The RQs can stay verbatim, but this distinction must be stated wherever results are presented. RQ4 is an effect-modification question about RQ1–RQ3, not a claim that the two vulnerability classes are equally prevalent.

## What changed from the attached proposal

The attached *Understanding Trust Miscalibration Across Developer Cognitive Modes in LLM-Assisted Software Engineering* (February 2026) is an **initial proposal**, not the current protocol. It suggested five broad questions: acceptance speed and checking; confidence and correctness; checking and errors; automatic mode detection from IDE events; and variation by general software-engineering task type. It also suggested familiar algorithm versus unfamiliar library tasks, roughly 30 mixed-experience participants, Python, generic planted errors, and expected calibration error.

| February proposal | Current study | Why the change matters |
| --- | --- | --- |
| General correctness/trust | Security confidence versus assessed SQL/path security | A concrete harm and a defensible oracle replace vague “good code.” |
| Speed/acceptance as main behavior | Provisional keep/reject, repair, final retention | A fast click cannot establish overreliance; the final artifact can be inspected. |
| Automatic cognitive-mode detection RQ | Assigned encouragement plus triangulated observed mode | The literature describes modes but does not validate a clickstream diagnostic. |
| General task-type variation | SQL injection versus path traversal opportunities | Same explicit security outcomes can be compared across two weakness classes. |
| Senior/junior comparison | Defined novice/early-career cohort | Reduces one source of heterogeneity and limits generalization honestly. |
| Generic correctness errors | Controlled exposed secure/insecure agent changes | Both confidence and retention need known, balanced security states. |
| Think-aloud during coding | Primarily retrospective, video-cued interview | Avoids imposing continuous verbalization that could change checking. |

The old proposal's assumption that acceleration necessarily causes weaker security checking is **a hypothesis**, not an established result. Exploration may bring uncertainty and deeper checking, or it may cause reliance on an unfamiliar API. Either outcome is scientifically useful.

## Why security-specific calibration is worth studying

[Perry et al.](https://arxiv.org/abs/2211.03622) experimentally studied AI assistance on security tasks and found an overall security disadvantage for assisted participants while assisted participants more often believed their solutions were secure. In their JavaScript SQL task, 36% of AI-assisted participants versus 7% of controls wrote SQL-injection-vulnerable code. This supports measuring the *confidence–security gap*, but does not predict this study's condition effect.

[Khalid et al.](https://arxiv.org/abs/2609.21020) directly examine whether developers identify insecure AI suggestions, how they evaluate them, and how trust shapes selection. This **narrows the novelty claim**: the present project contributes the within-person condition comparison, exact temporal verification and final-repository trace for two named classes, if carried out successfully. Khalid et al.'s preprint also reports that confidence can track actual security; it would be inaccurate to claim that developers universally overtrust.

[Okamura and Yamada](https://doi.org/10.1371/journal.pone.0229132) show why trust needs to match automation capability in safety-relevant decisions. That work is human-automation theory outside coding; it motivates the concept, not an empirical prediction for SQL injection. Generic satisfaction or overall trust can be high even if a developer misses a concrete vulnerability. This study therefore asks about security confidence in a specified artifact.

## RQ defenses and what would answer them

### RQ1: confidence alignment

**Why valid:** Security confidence and secure code can diverge in AI-assisted programming ([Perry et al.](https://arxiv.org/abs/2211.03622)). Trust is contextual rather than a single enduring attitude; [Wang et al.](https://doi.org/10.1145/3630106.3658984) and [Brown et al.](https://doi.org/10.1145/3664646.3664757) discuss developer, suggestion, and context factors. [Barke et al.](https://arxiv.org/abs/2206.15000) give a grounded distinction between acceleration and exploration intentions.

**Answer with:** A 0–100% confidence judgment for each frozen reviewed snapshot and its independently adjudicated secure/insecure label. Report mean confidence on secure items and on insecure items separately, their separation, and a proper accuracy score such as Brier score. Compare paired task-level summaries by assigned condition. Relate observed mode codes to these outcomes descriptively, with task and order context.

**Defense under questioning:** One or two answers per class do not estimate a person's full calibration curve. Use “alignment” at item and pooled levels; avoid claiming a stable individual psychological trait. Confidence is an explicit judgment, while trust as a wider construct is triangulated with reliance and interview evidence.

### RQ2: final vulnerability retention

**Why valid:** AI-assisted security outcomes can differ ([Perry et al.](https://arxiv.org/abs/2211.03622)), and judging a suggestion is only part of an integration workflow ([Khalid et al.](https://arxiv.org/abs/2609.21020)). Code that is initially vulnerable may be rejected, repaired, or remain. Counting only “accepted suggestions” selects on a post-condition action and hides successful rejection.

Controlled exposure to insecure AI suggestions has direct precedent in [Oh et al.](https://arxiv.org/abs/2312.06227) and a manipulated ChatGPT study by [Serafini et al.](https://doi.org/10.1145/3706598.3713989). These support a deliberate security stimulus as a defensible method; the report must say whether each candidate was raw agent output or edited by the researcher.

**Answer with:** For **every exposed vulnerable opportunity**, record agent exposure, provisional keep/reject, edits, final affected feature, and oracle status. Report the full all-exposed flow, including missing or unassessable final features. Compare target-vulnerability retention among assessable final features and bound how missing features could affect the result. Separately report the all-exposed rate of functional **and** target-secure final features, functionality, and extra security findings. Compare assigned conditions with participant-paired data.

**Defense:** This measures the developer–agent *workflow* under controlled opportunities, not a natural prevalence of agent defects. The agent-produced candidate must be genuinely observed by the participant; a flaw secretly placed in starter code is a different causal source.

### RQ3: verification timing and association

**Why valid:** [Khalid et al.](https://arxiv.org/abs/2609.21020) study evaluation of generated security choices; [Tang et al.](https://arxiv.org/abs/2405.16081) demonstrate that validation and repair behavior can be observed; [Mozannar et al.](https://doi.org/10.1145/3613904.3641936) and [Wu et al.](https://arxiv.org/abs/2604.16393) support combining event traces with screen replay and retrospective labels. None alone answers this exact before/after-provisional-keep security question in the proposed agent workflow.

**Answer with:** Timestamped security-specific checks before a participant provisionally keeps a change, then checks after keep through submission. Examples: inspect data flow, ask the agent about input validation, run an attack test, inspect a diff, run SAST, repair and re-test. Code actions with video plus transcript; do not infer security checking from time spent or ordinary passing tests alone. Compare behaviors by condition. Describe associations with final removal/retention among exposed vulnerable items.

**Defense:** Verification may occur because a participant already suspects a flaw, so association is not a causal effect of checking. Post-keep analysis applies only to kept changes; report the kept denominator and avoid comparing it as if random.

### RQ4: SQL injection versus path traversal

**Why valid:** The [MITRE 2024 CWE Top 25](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html) ranks CWE-89 SQL injection #3 and CWE-22 path traversal #5. Both are high-impact, common enough to justify study, and testable with small JavaScript apps. They exercise different source-to-sink reasoning: database query construction versus filesystem path containment. [CodeQL's JavaScript query help for SQL injection](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/) and [path injection](https://codeql.github.com/codeql-query-help/javascript/js-path-injection/) show the two code-review patterns.

**Answer with:** Balanced secure and vulnerable opportunities for each class in each condition; class-specific confidence, checking, and final retention. Estimate a condition-by-class difference with uncertainty, then inspect qualitative mechanisms. A small study treats this as exploratory, even though it is a named RQ.

**Defense:** MITRE ranks software weaknesses by its own prevalence/severity methodology; it does **not** show these are the two most exposed LLM-generated vulnerabilities. Choose these classes for seriousness, distinct mechanisms, implementation feasibility, and objective tests. Do not claim generality to secrets, XSS, command injection, or other languages.

## Intended contribution

1. A **method** for linking an agent suggestion, the exact reviewed snapshot, confidence, provisional decision, verification actions, and final security outcome.
2. Evidence about whether **assigned workflow orientation** and **observed mode** are associated with different security judgments and behaviors among early-career developers.
3. A small, reproducible **task and oracle set** for two weakness classes, with secure and vulnerable agent candidates and provenance.
4. Design implications for review support: where in the workflow security checks are missed and whether a later check repairs a problem. This is contingent on observed results, not guaranteed.

## How to interpret possible results

- If assigned conditions differ, mode coding shows the intended shift, and project/order controls are credible, report an effect of the **assigned encouragement package** on the named outcomes. Do not automatically identify a pure internal cognitive-state effect.
- If assigned conditions differ but observed mode does not, report a task-context/framing effect and a failed mode manipulation. The mode theory is not confirmed by that contrast.
- If observed modes differ but the security outcomes do not, the study still contributes a bounded null estimate with confidence intervals and a record of security-check practices.
- If people in exploration have more residual vulnerabilities, that is compatible with reliance under unfamiliarity; it would contradict a simple “acceleration is always riskier” story.
- If RQ4 estimates are noisy, give the class-specific counts and intervals and avoid treating a nonsignificant interaction as proof the classes behave identically.

## Claims this study should avoid

- “Acceleration causes insecure code” unless randomization, manipulation, and analysis support the specific assigned-condition effect.
- “Clickstream proves cognitive mode.” Mode inference requires contextual coding and participant explanation.
- “Junior developers are naturally careless.” Measure baseline skills and report variation; errors under uncertain agent output are not a character trait.
- “SonarQube/Snyk/CodeQL detects every vulnerability.” Use tests and human adjudication as the oracle; scanners are supplementary.
- “These two vulnerabilities are the most common AI errors.” No cited source establishes that.
