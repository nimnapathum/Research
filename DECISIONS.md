# Design decisions and questions to settle

**Rule:** “Fixed” means supplied by the researcher as the current aim/RQs or fundamental scope. “Proposed” means a recommended choice supported by relevant prior research or technical guidance, but not yet validated for this task. “Pilot gate” means the study should not recruit a main sample until that choice works in the actual setup.

| Choice | Status | Defense / evidence | Gate or next action |
| --- | --- | --- | --- |
| Aim and RQ1–RQ4 as worded in [RQ.md](RQ.md) | Fixed | Researcher's latest instruction; change history in RQ.md | Supervisor checks coherence and names primary outcomes |
| Security-specific confidence rather than generic AI trust as main outcome | Fixed | [Perry](https://arxiv.org/abs/2211.03622) security-belief gap; [Khalid](https://arxiv.org/abs/2609.21020) security evaluation | Use exact proposal snapshot and target requirement |
| Two episodes per participant, one per assigned encouragement | Fixed scope; protocol proposed | [Barke](https://arxiv.org/abs/2206.15000) mode concepts; within-person design reduces between-person variation | Pilot whether encouragement actually changes intention/mode |
| Randomize project-condition mapping and order | Proposed | Avoid condition being identical to one project or to first-task learning | Freeze four-sequence schedule |
| Use early-career cohort; measure rather than assume skill | Fixed scope; screening proposed | [Danilova](https://arxiv.org/abs/2103.04429), [Kaur](https://www.usenix.org/conference/usenixsecurity22/presentation/kaur), [Khalid](https://arxiv.org/abs/2609.21020) | Final eligibility rule and baseline instrument |
| Decide whether “new to AI-led SE” is an eligibility condition | Open | Junior status does not imply low agent experience; prior use could affect both mode and checking | Prespecify a frequency/window threshold or remove the “new” claim |
| Use JavaScript/Node with SQLite and local files | Proposed | [Perry](https://arxiv.org/abs/2211.03622) used a JavaScript SQL task; SQL and path have small objective sinks | Pilot dependencies, familiarity, task length |
| SQL injection and path traversal only | Fixed scope | [MITRE 2024](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html) ranks CWE-89 #3 and CWE-22 #5; different testable data flows | Do not claim LLM-specific prevalence or broad class generality |
| Four checkpoints per task: one secure and one vulnerable per class | Proposed | Need both security states for confidence separation; [Khalid](https://arxiv.org/abs/2609.21020) used security-varying suggestions | Pilot eight decisions per participant within time |
| Pre-generate and select agent candidates; keep raw provenance | Proposed; constructed pipeline prototypes exist | [Khalid](https://arxiv.org/abs/2609.21020) controlled suggestions; [Oh](https://arxiv.org/abs/2312.06227) and [Serafini](https://doi.org/10.1145/3706598.3713989) used manipulated insecure AI assistance | Collect genuine target-agent pool or explicitly label constructed stimuli; pilot authenticity, availability, functional matching |
| Agent interaction before the controlled reveal | Structured workflow built | Prevents early target edits from changing the known proposal; same rule in both conditions | Pilot whether participants can use agent mode naturally while discussing/inspecting before reveal |
| Let participant inspect/test candidate before decision; freeze it until first decision/rating | Proposed | Makes exposure and exact confidence-to-security pairing interpretable | Check this gate does not dominate natural workflow |
| Record provisional decision, then confidence about the same frozen proposal | Proposed | Distinguishes reliance action from stated judgment and handles rejection | Cognitive interview the form; inspect prompting reactivity |
| Allow post-decision agent use, repair, and final submission | Proposed | [Khalid](https://arxiv.org/abs/2609.21020) traced selection to submission; [Tang](https://arxiv.org/abs/2405.16081) studied repair | Ensure final feature maps to original opportunity |
| Treat observed mode as coded, not a clickstream classifier | Fixed interpretation | [Barke](https://arxiv.org/abs/2206.15000) definitions; [Mozannar](https://doi.org/10.1145/3613904.3641936) and [Wu](https://arxiv.org/abs/2604.16393) combine replay/intent | Freeze codebook and rater training |
| Antigravity agent mode + companion extension | Source and synthetic app dry run built; host feasibility open | [Official hooks](https://www.antigravity.google/docs/hooks/) and [VS Code API](https://code.visualstudio.com/api/references/vscode-api) | Install on exact host, link prompt/reply, edits, video and app markers; perform field-by-field coverage audit |
| Use video and retrospective interview | Fixed scope; instrument proposed | [Wang](https://doi.org/10.1145/3630106.3658984), [Mozannar](https://doi.org/10.1145/3613904.3641936), [Wu](https://arxiv.org/abs/2604.16393) | Consent, clip sampling, non-leading script |
| Use exploit/normal tests plus blinded manual review; scanner supplemental | Proposed | [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html), [CodeQL SQL](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/), [CodeQL path](https://codeql.github.com/codeql-query-help/javascript/js-path-injection/) | Verify known candidates and two-reviewer rubric |
| Brier plus secure/insecure confidence separately | Proposed | Proper probability scoring avoids a vague trust Likert; separate strata expose over/underconfidence | Freeze primary contrast after pilot; avoid claiming individual calibration curves |
| Analyze assignment first; observed mode/checks associational | Proposed | Random assignment supports a condition effect; mode and checking are post-assignment behaviors | Preregister estimands, missingness, and order controls |
| Hidden Markdown/rule-file vulnerability injection | **Not in core protocol** | Final RQs do not ask about file influence; source attribution would differ | Separate future experiment only, with ethics and exposure controls |

## Go/no-go questions for the pilot

1. Are both project-condition combinations completable in the allotted time without the researcher explaining solutions?
2. Does the assigned encouragement visibly shift plan-execution versus option-seeking episodes, without an extreme task-difficulty or security-knowledge difference?
3. Does every intended vulnerable/secure candidate render to the participant, with raw provenance and a reproducible frozen hash?
4. Can the extension/transcript/video together reconstruct prompts, proposal visibility, decision, testing, edits, and submission? If not, which RQ is affected?
5. Do all target candidates pass normal functional tests, and do the security oracles reliably distinguish their intended status?
6. Do participants understand the 0–100 security question and the distinction between proposal rating and final code?
7. Is the number of judgments enough for a paired group-level comparison, and what main-sample size gives useful interval precision?

Record answers and any changed wording here **before** recruiting the main sample. A failed pilot gate is a reason to revise the instrument, not to force a positive hypothesis.
