# Natural-task behaviour codebook

Version natural-2026-10-13-r3. Pilot these rules before freezing main-study coding. Code episodes and changes; do not assign a permanent mode or trust score to a person.

## Mode and boundaries

Start an episode when the participant changes implementation goal or purpose of agent use; end it when that purpose changes. Split waiting and recording gaps into separate intervals. Preserve start/end times, task ID, coder, evidence reference and uncertainty. Boundary disagreements are resolved before comparing labels on common intervals.

| Label | Required evidence of intent | Example |
| --- | --- | --- |
| Acceleration | A next implementation step is specified before the agent supplies it; the agent is used to execute that step. | “Add a filter using this existing query function.” |
| Exploration | The participant uses the agent to work out an approach or understand unfamiliar implementation choices. | “Which file API should this use, and why?” |
| Mixed | Both intentions are supported in the interval and cannot reasonably be separated. | Execution request develops into explicit option-seeking. |
| Unclear | Available evidence does not establish implementation intent. | “Do the task” with no explanation or useful later recall. |

Do not define exploration through security checking, or acceleration through speed. Those are outcomes/context that may be compared after the mode is coded. A participant can know the implementation approach but still carefully verify security. Asking “is this secure?” alone is a security check, not proof of exploration. The assigned card is not evidence of observed mode. Keep initial trace-only labels and replay-informed labels separately.

## Change and human behaviour

Assign each material agent change a stable `change_id`. Record agent message/tool reference, earliest reliable code snapshot and whether origin is `confirmed_agent`, `mixed`, `participant`, or `unknown`. Never infer origin solely from code style.

Record these as distinct events: `agent_applied`, `human_inspected`, `human_explicitly_endorsed`, `continued_with_change`, `rejected_or_overwritten`, `intentional_security_repair`, and `final_survival`. Inspection means visible review with evidence of what was inspected; an open file alone is not enough. An explicit endorsement needs a statement or supported interface action. Continuation is a behavioural proxy, and may precede understanding. If timing falls between two snapshots, record a time interval; do not invent millisecond acceptance latency.

The r3 observer adds raw conversation records and hook events. Its `observed_at_utc` is collection time; source timestamps remain in `raw` and require host/schema validation. Invocation or transcript-record counts do not equal human prompt counts. Preserve source order/offsets and use video to establish what the participant saw. Internal transcript material is not evidence of human awareness.

## Verification

| Category | Evidence |
| --- | --- |
| `security_dataflow` | A named input and sink/containment issue are traced in prompt, code or a replay explanation tied to an observed inspection. |
| `security_agent_question` | Security-directed prompt and response; record whether the participant reviewed or used the answer. |
| `attack_test` | Security-relevant input/assertion, execution and observed result. |
| `scanner_review` | Tool ran and a relevant finding was inspected; an unseen alert is a separate tool event. |
| `security_repair` | Change directed at an identified security issue; rechecking is a separate row. |
| `generic_review` | Diff/code inspection without evidence of a security-specific purpose. |
| `functional_test` | Ordinary behaviour check. |
| `documentation_consulted` | A documentation/source page is visibly consulted; record the source, purpose and whether it concerns the target security requirement. Browser navigation alone is insufficient. |

For each check record target class, change ID if known, time, result visibility, issue identified and timing relative to agent application, first human inspection and explicit endorsement/continuation. An agent autonomously running a test is an **agent check**; a developer reading its result is a separate human action. A suggested or promised check is not a performed check. Removal without evidence of identifying the weakness is not automatically detection or intentional repair.

Documentation consultation can support understanding, generic validation or security-specific validation. Preserve that purpose separately; do not count every page visit as a security check. For agent prompts, optionally code known-step execution, approach seeking, API explanation, debugging, security verification, other or unclear, with a transcript/video reference. These are descriptive agent-mode adaptations; Copilot's inline/comment/context/multi-suggestion categories do not map directly to this interface. See [GROUNDED_COPILOT_ALIGNMENT.md](../../GROUNDED_COPILOT_ALIGNMENT.md).

## Replay questions

After both tasks, before hidden security feedback, replay the first material agent change, the first check if any, and one revision or uncertain-intent moment. If a category does not occur, record its absence and choose the next material change; do not select only successful repairs.

Ask: “What were you trying to do here?”; “Did you already have an approach in mind?”; “What did you understand about this change?”; “When did you decide to continue with it?”; “What did you check, and what did that result mean to you?”; “Did the task guidance match how you worked?” Explain that documentation, tools and help are permitted. Do not name a flaw or imply the correct mode before the answer.

## Coding quality

Two coders independently code all pilot sessions, compare boundaries and labels, and revise rules with examples. For main data, double-code at least a prespecified 25% spanning all four sequences and no-check/repair cases; double-code more if rules remain ambiguous. The percentage is our resource decision, not a validated universal threshold. Report raw agreement, label prevalence, a suitable chance-corrected measure where meaningful, and unresolved uncertainty. Keep raw labels and the adjudicated result; do not report only agreement after reconciliation.

The mode concept is adapted from [Barke et al.](https://arxiv.org/abs/2206.15000); screen replay is informed by [Mozannar et al.](https://arxiv.org/abs/2210.14306). These rules are an original instrument for agents that edit files and require pilot evidence.
