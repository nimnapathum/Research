> Historical controlled-workflow material. For the current natural task use [NATURAL_SESSION_RUNBOOK.md](NATURAL_SESSION_RUNBOOK.md) and [the current methodology](../../NATURAL_WORKFLOW_METHOD.md). This document is retained for the older prototype.

# Pilot measurement inventory: two coding-agent tasks

> **Protocol distinction:** Most entries below describe the earlier controlled-checkpoint design. For the revised natural agent workflow, use [NATURAL_DATA_COVERAGE.md](NATURAL_DATA_COVERAGE.md) as the operational capture and safety checklist. Checkpoint exposure/decision latencies and old hook upload claims do not apply to the natural ZIP.

**Status: measurement plan, not a claim that every stream is implemented or validated.** This document records what to capture during each participant's acceleration-encouragement and exploration-encouragement tasks. It complements [the RQ evaluation plan](../../MEASURES_AND_EVALUATION.md), [the event contract](../contracts/README.md), and [the capture status](../capture/README.md). The assigned condition is the experimental comparison. An observed acceleration/exploration label is a separately coded description of an *episode*, not a property inferred from a mouse speed or a task card.

## 1. Measurement rules

1. Keep raw evidence, derived events, and analyst judgments in separate files. Give every event a participant ID, task ID, checkpoint ID when relevant, source, actor when known, UTC timestamp, and an evidence reference. Record software versions and a common video/portal clock marker.
2. An opportunity starts when the exact proposal is applied **and meaningfully visible**. The client confirms application; screen video checks visibility. Pair the first keep/reject decision and 0–100% security estimate with that exact frozen proposal hash. Later edits cannot change what the original rating referred to.
3. Record missing and failed streams explicitly. A running client or one hook event proves neither a complete transcript nor complete verification capture.
4. Use event timing to describe behavior; use prompts, context, video and interview to interpret intent. Do not automatically equate short latency, low checking, rapid typing, or mouse speed with acceleration, trust, or cognitive load.
5. Pilot broad capture, then freeze a smaller primary analysis before main recruitment. Do not fit a mode classifier or search many signals for a favorable result using the small pilot.

## 2. Required raw data and derived measures

**A. Participant, assignment and session context**

| Capture | Derived measure / purpose | Source and current state |
| --- | --- | --- |
| Pseudonymous ID; student/junior role; paid experience; JavaScript, SQL and file API familiarity; security training; agent and Antigravity experience; usual review habit | Describe cohort; examine skill and familiarity as alternative explanations | Portal pre-task form: **built**. The two explicit SQL/path baseline questions may prime the target; decide before full pilot whether to retain them. |
| Assigned condition, project, task order, checkpoint order, controlled candidate version and security class | Intention-to-treat comparison; order, project and class checks | Portal reserves the checkpoint service's seeded balanced allocation: **built**. Researcher audits realized balance and any CLI-only or abandoned reservations. |
| Machine/OS, display resolution and scale, input device (mouse/trackpad), Antigravity and model version, agent settings, extension/hook versions, network interruptions | Interpret timing and telemetry variation; reproduce a session | Researcher log: **manual**, not yet a portal form. |
| Consent/recording start and stop, practice completion, breaks, interruptions, accessibility accommodations, participant withdrawal | Define active analysis windows and exclusions | Researcher log and video: **manual**. Compare any new telemetry against approved consent wording. |

**B. Task and agent interaction timeline**

| Capture | Derived measure / purpose | Source and current state |
| --- | --- | --- |
| Task start/end; each checkpoint-sheet opening and start; practice and training completion | Total task time, active time, checkpoint duration, order effects | Checkpoint/portal timestamps: **partial**; researcher/video markers needed for actual reading and active time. |
| Every participant prompt and visible agent reply, with time and conversation ID | Prompt count and turns; code-generation vs explanation vs comparison vs security-question categories; evidence of stated goal | Official Antigravity transcript plus video: **separate collection**, exact-host completeness untested. Hook stores a transcript *path*, not its contents. |
| Agent tool calls: file view/edit, terminal test/scanner command, failure, model, step ID | Agent work sequence and tool use | Workspace hook: **implemented for selected tool names**. It misses other tools, full command output, and manual terminal use. |
| Agent response/patch presented, size and affected files; participant-visible alternatives | Response-to-review sequence, alternatives requested, candidate provenance | Transcript/video and frozen proposal: **mixed**. A controlled proposal is not necessarily generated live by the participant's agent. Preserve honest provenance. |
| File/editor opened, focus, visible range/scroll, selection, saves, diff opened, manual terminal commands, browser/documentation switches | Review/navigation sequence, code versus documentation time, ordinary versus security checks | Video: **available if recorded**. Optional VS Code-compatible extension source exists; these events are **not confirmed in standalone Antigravity**. |
| Code snapshots before controlled reveal, exact proposed state, after decision if feasible, and final state; changed lines and feature lineage | Initial proposal vs later edits; repair/replacement/survival | Baseline, proposal and final snapshots: **built**. Continuous intermediate diff history is **not built**; reconstruct with video/transcript or add an event-based workspace change log after host validation. |

**C. Decision, security confidence and trust**

| Capture | Derived measure / purpose | Source and current state |
| --- | --- | --- |
| Reveal/apply time, exact proposal hash, actual screen visibility, first keep/reject time | Actual exposure; first retention choice | Checkpoint app/client: **built**; meaningful visibility needs video check. |
| 0–100% chance that the *exact proposed state* meets its stated security requirement; optional reason | RQ1 confidence on secure and vulnerable items, Brier score, confidence separation | Checkpoint form: **built**. Brier combines probability accuracy and discrimination; do not call it pure calibration. |
| First-decision latency = first decision timestamp minus confirmed exposure timestamp, for keep and reject separately | Descriptive review/interpretation time; compare with actual checks | **Derivable now** from checkpoint timestamps. Include both outcomes; report wall-clock and, if reliable, active review time. It is an experimental checkpoint latency, not native agent-suggestion acceptance latency. |
| Time from first keep to first meaningful check, first edit, and final submission; whether proposed code survives unchanged, is edited, replaced or removed | Distinguish initial acceptance from later validation; RQ2/RQ3 path | Decision timestamp and final snapshot: **partial**; first check/edit timing and lineage require video/transcript or added workspace events. |
| Planned check text versus observed check; confidence reason versus contemporaneous evidence | Intention-action gap and trust interpretation | Checkpoint form: **built**; observed checks: **manual coding**. A planned check is not a performed check. |
| After-task agent reliance and difficulty; after-both general reliance; replay explanation of why a specific change was trusted/rejected | Self-report alongside actual reliance | Portal forms/interview guide: **built/drafted**. These are study-specific items, not a validated trust scale. |

**D. Security verification before and after first decision**

For each action record onset/end, checkpoint, phase (`before_decision`, `after_keep`, `after_reject`), target, source, result, whether it detected the target flaw, and whether it led to repair. The [codebook](../instruments/CODING_CODEBOOK.md) defines S1 input-to-sink tracing, S2 security question to agent, S3 attack/negative test, S4 scanner with finding inspected, S5 repair and recheck, plus G1 generic review and G2 ordinary functional test. Derive whether any substantive security check occurred, count/type, time to first check, checking duration, test outcome and detection-to-repair path. **Current state:** the hook supplies some agent-initiated file/test/scanner events; transcript and screen video plus human coding are needed to establish participant intent, command result, manual tests, and checks performed in the IDE. A generic test or scanner invocation alone is not evidence that a target vulnerability was checked or detected.

**E. Security and functionality outcomes**

| Capture | Derived measure / purpose | Source and current state |
| --- | --- | --- |
| Candidate target class, expected secure/vulnerable status, ordinary and attack-test results | Controlled-opportunity balance and stimulus validation | Researcher-only manifest/oracles: **built**, independent pre-pilot review pending. |
| Blinded judgment of exact reviewed proposal and final feature: secure, vulnerable, indeterminate, or missing; functionality pass/partial/fail | RQ1 ground truth; RQ2 final retention and secure functional success; RQ4 by class | Blind review bundles and export scripts: **built**; two human reviewer ratings and resolution **not yet done**. |
| New vulnerabilities from live agent or participant outside controlled proposals; scanner findings confirmed manually | Separate safety outcome; avoid missing extra flaws | Independent final review and optional scanner: **planned**. Do not merge extra issues into the controlled-opportunity denominator. |
| Keep/reject → edit/replace/repair → final security, including missing feature and lost artifact | Exposed-to-final flow table and RQ2 denominators | Checkpoint/final snapshots: **partial**; decision-path coding and blind adjudication needed. |

**F. Observed interaction mode and workload**

| Capture | Derived measure / purpose | Source and current state |
| --- | --- | --- |
| Episode boundaries, prompt goal, whether participant already knew next step, asked for options/explanation, compared alternatives or investigated unfamiliar APIs | `acceleration`, `exploration`, `mixed`, or `unclear` episode label; proportion of coded time by mode | Video + prompt/reply transcript + replay interview: **planned human coding** using Barke's distinction. Two coders train on pilot material; no single telemetry feature decides mode. |
| Task familiarity, perceived difficulty, time pressure, known-next-step frequency and option-seeking frequency | Manipulation and confound checks, including whether encouragement changed observed behavior | Portal after-task form: **built**. |
| Optional short validated workload instrument, e.g. NASA-TLX, administered once after each task | Distinguish workload from interaction mode | **Not in current form.** Tang et al. used NASA-TLX; add only if approved wording and participant burden permit. Workload is not the same construct as acceleration/exploration. |
| Replay-cued interview about intentions, uncertainty, specific security estimates, checks and changed decisions; debrief awareness of study purpose | Explain ambiguous episodes and demand effects | Interview guide: **drafted**; audio/video and transcript: **separate collection**. |

**G. Candidate interaction features for the pilot (descriptive, not mode labels)**

| Feature to derive | Exact definition or caution | Capture status |
| --- | --- | --- |
| Prompt and reprompt counts | Distinguish requests to implement, explain, compare, debug or check security; count iterations on the same goal | Transcript/video needed; hook alone is insufficient. |
| Prompt length and detail | Words and references to files/tests/alternatives; preserve original prompt before coding a category | Transcript needed. Length is affected by task and language fluency. |
| Alternatives considered | Number of genuinely different proposed approaches requested, viewed or compared before choosing | Transcript/video coding needed. A repeated failed request is not automatically exploration. |
| Agent waiting time | Prompt sent to first visible response and to completed answer; keep separate from human review | Invocation start/end hooks are **implemented** as metadata; transcript/video still needed for prompt and visible-response times. |
| Navigation and inspection | Files opened, returns to changed file, editor focus switches, diff opens, visible ranges/scrolls and time visible | Video; optional editor extension only after exact-host validation. Visibility does not prove reading. |
| Editing activity | Human versus agent edits when attributable; edit burst count, lines changed, delete/rewrite, undo and post-keep change size | Agent edit hook + snapshots are partial; human editor events need validated extension or video. No raw keystrokes required. |
| Typing cadence | Characters inserted per active editing minute and pause/burst distribution, excluding pasted or agent-inserted code | Optional validated editor telemetry; not built. Prior telemetry studies use this for suggestion receptiveness, not for our mode ground truth. |
| Copy/paste and snippet reuse | Count local code copies/pastes and whether a proposed block remains in final code; avoid collecting clipboard from unrelated apps | Optional editor telemetry or video; not built. Final survival needs code lineage review. |
| Tests and debugging | Normal/attack/scanner runs, outcome inspected, reruns after repair, breakpoint or error inspection | Hook captures selected **agent** commands; manual terminal/debugger actions need video or validated editor/terminal logging. |
| Idle and context switching | Time when study app/IDE is foreground but no recorded action; browser/docs switches; explicit breaks | Video and optional foreground-app telemetry. Inactivity can mean reading or thinking, so do not label it disengagement. |
| Proposal survival | Exact proposal lines/feature unchanged, edited, replaced or removed at final submission; optionally survival at a fixed post-decision time if intermediate snapshots exist | Final snapshot permits feature-level review; a fixed 10-minute survival metric needs new intermediate snapshots. |

## 3. Timing and mouse measurements: what to add for the pilot

**Timing worth collecting.** Preserve exact event times for prompt submission, first visible reply, agent completion, first proposal display in the IDE, each review/check, first keep/reject, first edit/repair and final submission. Derive agent-wait time separately from participant review time; otherwise network/model speed contaminates behavior. Report distributions of first-decision latency, post-keep verification time and proposal survival, rather than one mean. Mozannar et al. specifically show that time until initial acceptance omits verification *after* acceptance. Kuo et al. measure interpretation time from a presented suggestion to Accept/Copy in a different IDE setting. Our checkpoint's first decision is a controlled review event, so call its latency `exposure-to-first-decision time`, not a directly replicated Copilot accept time.

**Mouse data requested for the pilot.** The participant portal can only observe pointer movement on its own web pages; its JavaScript cannot measure the pointer inside Antigravity. The recorded ZIP now contains an **optional** Python `pynput` recorder and pinned requirement for macOS, Windows and Linux/X11. It produces aggregate five-second summaries and the study client uploads them; it stores no raw coordinate stream. The listener is global while explicitly running, so the participant must stop it during breaks. The actual input-device and Antigravity-host behavior remains untested. Linux Wayland is unsupported by this recorder; record missingness, not zero activity. See the [cross-platform guide](CROSS_PLATFORM_CAPTURE.md).

From recorded intervals derive movement-event rate, movement distance, median/upper-quantile speed in screen pixels/second, click and scroll counts, and pauses before an explicit decision. A foreground-only or within-app measure is **not available** from the current recorder; use video to exclude breaks and unrelated-app periods. Record input device, screen resolution/scale and pointer acceleration setting if available. Never compare raw speed across different devices as if it were a standardized psychological score. Do not collect key contents, raw pointer coordinates, global browsing or clipboard contents to obtain these metrics. Treat the mouse stream as **exploratory usability/context evidence**, not as a validated acceleration/exploration or trust measure. Mouse studies address cognitive load in other tasks; they do not establish a one-to-one mapping to Barke's programming intent modes. If the extra recording is outside the approved protocol, amend consent before collecting it.

**Optional eye tracking.** Tang et al. collected gaze and IDE actions for validation/repair. This is a precedent for attention measurement, but equipment, calibration, visual-area mapping and added burden make it an optional separate pilot, not a prerequisite for these RQs. A screen cursor is not an eye tracker.

## 4. Per-RQ minimum complete record

| RQ | Minimum linked evidence | Main missing-data risk |
| --- | --- | --- |
| RQ1 | Assignment; meaningful proposal exposure; frozen proposal hash; first security confidence; blinded proposal security label | A client-applied patch with no confirmed visible review, absent confidence, or indeterminate security label |
| RQ2 | Every actually exposed vulnerable opportunity; first decision; final snapshot; feature lineage and blinded final security/functionality | Final file missing or a rejected proposal incorrectly counted as an automatic secure outcome |
| RQ3 | Exposure/decision/final timestamps; synchronized video and transcript; phase-coded checks; final adjudication | Hook-only logs omit manual checking, security intent and test results |
| RQ4 | The above with class and candidate version for both SQL and path | Too few assessable items for a useful class comparison |
| Observed-mode explanation | Assigned condition; coded prompt/action/video episodes; short after-task account and replay interview | Inferring mode from latency, cursor speed or condition assignment |

## 5. Build and pilot sequence

1. **Rehearse one complete session on the exact Antigravity host.** Confirm the existing client, hook, transcript export, screen recording, clock marker, proposal visibility and final upload. First fix any missing *core* RQ1/RQ2 stream.
2. **Validate timestamp and health coverage.** The checkpoint system now records source and server-received times for hook/pointer rows, evidence hashes, source counts, exposure-to-decision timing and missing-stream warnings in `audit-measurements` and `/admin/audit`. The analysis export includes `exposure_to_first_decision_ms`, `capture_coverage.csv`, and `pointer_windows_exploratory.csv`. Manually log task pauses and check actual transcript/video content; add any additional clock-drift checks after the host rehearsal.
3. **Add interaction detail only where feasible.** Validate whether standalone Antigravity exposes editor focus/visible range and agent transcript. If not, code these from video; do not claim that the VS Code companion extension works in the standalone app.
4. **Rehearse the optional cross-platform mouse recorder** only if approved. Compare its aggregate intervals against video, document unrelated-app periods and device/settings, and estimate how often the mouse is inactive because the participant uses the keyboard. Run separate host checks on macOS, Windows and Linux/X11. Keep it exploratory for the pilot.
5. **Code 2–4 pilot sessions twice.** Two coders independently mark observed-mode episodes and security checks. Compare disagreements and whether timing/navigation/mouse signals add useful, reproducible context beyond prompt/video evidence. Revise the codebook rather than force ambiguous episodes into a mode.
6. **Freeze main-study measures and software versions.** Primary RQ1/RQ2 outcomes remain those in the evaluation plan. Predeclare which additional telemetry summaries will be reported; put other signals in a clearly labeled exploratory appendix. Report collection coverage and missingness before behavioral results.

## 6. Source basis and limits

- [Barke et al., *Grounded Copilot*](https://arxiv.org/abs/2206.15000): observed acceleration/exploration as programmer intentions and behavior. It does not validate a mouse or latency classifier.
- [Mozannar et al., *Reading Between the Lines*](https://dspace.mit.edu/entities/publication/b07fa80a-16c5-459c-8e1b-1dbab6e168a2): telemetry plus retrospective activity labels; verification after initial acceptance and proposal survival matter.
- [Tang et al., *Developer Behaviors in Validating and Repairing LLM-Generated Code*](https://www.nztang.com/assets/files/papers/tang_vlhcc24.pdf): IDE actions, gaze, screen recording, NASA-TLX and interview in a lab study; different tasks and outcomes.
- [Kuo et al., *Developer Interaction Patterns with Proactive AI*](https://arxiv.org/abs/2601.10253): timed suggestion interpretation and telemetry plus survey; its Accept/Copy action differs from our controlled keep/reject checkpoint.
- [Basha et al., *CodeWatcher*](https://arxiv.org/abs/2510.11536) and [Awad et al., *Pre-Filtering Code Suggestions*](https://arxiv.org/abs/2511.18849): editor event and timing telemetry can characterize usage or predict suggestion uptake; they do not establish security trust calibration or Barke mode labels.
- [Rheem et al., *Use of Mouse-tracking Method to Measure Cognitive Load*](https://journals.sagepub.com/doi/10.1177/1541931218621449): mouse tracking may be useful for cognitive-load research in another setting. It is not validation for developer mode, trust, or security judgment here.
- [Antigravity hooks](https://www.antigravity.google/docs/hooks/), [VS Code extension API](https://code.visualstudio.com/api/references/vscode-api), and [`pynput` platform limitations](https://pynput.readthedocs.io/en/latest/limitations.html): technical possibilities, all subject to exact-host verification.
