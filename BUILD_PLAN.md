# Build plan for the security-trust participant study

**Status: engineering build complete for a synthetic dry run, 6 October 2026.** This file links the runnable materials to the current [RQs](RQ.md), [methodology](METHODOLOGY.md), [task design](TASK_DESIGN.md), [evaluation measures](MEASURES_AND_EVALUATION.md), and [artifact status](study-system/STATUS.md). Nothing below is participant data or a preliminary result.

## What the finished system must answer

Each participant completes **two agent-assisted JavaScript tasks**, one with acceleration encouragement and one with exploration encouragement. Each task exposes four controlled code proposals: secure and vulnerable SQL-query changes, and secure and vulnerable file-path changes. The system must connect **what was shown**, **what the participant did and believed**, and **what remained in the final code**. The assigned condition and observed interaction mode stay separate variables.

~~~text
assignment + task package + candidate manifest
       |                 |
       v                 v
participant IDE <--> checkpoint form --> event log + frozen proposal
       |                                      |
       +--> final repository + video --------+--> blinded security coding
                                              |
                                     analysis tables for RQ1–RQ4
~~~

## Build iterations and remaining gates

| Step | Current state | Remaining validation |
| --- | --- | --- |
| **1. Contract** | Event IDs, proposal hashes and source labels exist in [contracts](study-system/contracts/README.md). | Spot-check schema coverage with real hook and extension events. |
| **2. Tasks and oracles** | Two runnable projects, eight task sheets and 16 constructed candidates exist. All candidates passed normal-function and target-security oracle checks. | Independent security review; real-agent candidate provenance; difficulty and salience pilot. |
| **3. Forms and interview** | Pre-task, checkpoint, after-task and final forms plus replay guide and coding book exist. | Cognitive interviews and wording revisions before main recruitment. |
| **4. Capture and app** | Local app, hook, companion extension source, fallback import and evidence attachment exist. The two-task synthetic dry run recovered eight exposure/decision/hash joins. | Test installation and prompt/response capture on the exact Antigravity host; attach real consented video and transcript. |
| **5. Adjudication and analysis** | Blind review queue, two-reviewer resolution, manual mode/check/repair coding templates and RQ exports exist. The synthetic dry run joined them. | Train independent coders, resolve real disagreements, pre-register final estimands and sample plan. |
| **6. Human pilot and freeze** | [Pilot protocol](study-system/pilot/PILOT_PROTOCOL.md) and [session runbook](study-system/pilot/SESSION_RUNBOOK.md) are ready for review. | Ethics approval, 4–6 target-population pilots, changes recorded, then final materials frozen. |

The constructed candidates are **not** unmodified Antigravity output and cannot be used to estimate natural agent vulnerability rates. The end-to-end pass verifies plumbing only; it says nothing about developer behaviour or condition validity.

## Proposed repository layout

~~~text
study-system/
  contracts/             event schema, ID rules, fixture events
  projects/
    resource-catalogue/   participant project A
    support-archive/      participant project B
  stimuli/               researcher-only candidate patches and provenance
  instruments/           participant sheets, cards, forms, interview guide
  capture/               companion extension and Antigravity hook
  app/                   local researcher/participant checkpoint app
  analysis/              coding book, adjudication, exports, scripts
  pilot/                 pilot checklist and revision log
~~~

Keep researcher-only vulnerability labels, hidden oracle tests and assignment secrets **outside the participant copy and machine-accessible workspace**. Package the participant project as its own directory, never open the whole research repository in Antigravity during a session, and verify the agent cannot read sibling researcher files. Participant-facing agent Markdown should state ordinary project facts and the same security requirements in both conditions. The controlled candidate proposal supplies the known secure/vulnerable opportunity. A hidden instruction-file vulnerability would be another experiment and is outside the current RQs; see [methodology §5](METHODOLOGY.md).

## Task and form design decisions

**Projects.** Two small offline Node/JavaScript APIs with SQLite and local fixture files are built. Project A is a resource catalogue; B is a support archive. Each has two SQL and two file-path checkpoints. Each project can appear in either condition, so task identity does not become the condition. All feature and security criteria are visible to participants. The acceleration card encourages a known next step; the exploration card encourages explanation and option seeking. Match task length and pilot perceived difficulty.

**Candidate presentation.** Prefer agent-generated candidate code with recorded model, prompt, reply and exact patch. If a candidate was edited or constructed by the researcher, mark that in the manifest and study description. Before reveal, the participant may ask the live agent to discuss but not edit the target feature. The review page then applies and displays a frozen proposal. Record provisional keep/reject and 0–100% security confidence about that **same proposal**, including rejected proposals. Afterward the participant can repair, replace or discard code with the agent. Score the final repository separately. See [participant workflow](study-system/instruments/PARTICIPANT_WORKFLOW.md) and [methodology §6](METHODOLOGY.md).

**Pre-task instrument.** Ask about role and experience, JavaScript/Node, SQL/file APIs, security training, coding-agent use, Antigravity familiarity, and one short recognition item per target vulnerability. Record prior experience as a measured covariate; do not assume a junior developer's miss means overtrust. Use equal neutral tool training before both tasks.

**After each task.** Use a short manipulation check: known-next-step, option seeking/learning, familiarity, difficulty and time pressure. After both tasks, use a short overall reliance/trust and workload/context form plus a video-cued interview about selected decisions and checks. The broad trust item is descriptive; the primary calibration measure is confidence about each exact proposal.

## What the IDE extension can and cannot establish

The **authoritative** decision, confidence, candidate exposure and code snapshot should be captured by our controlled checkpoint interface. The extension can add task markers and editor/workspace observations if the installed host exposes those APIs. Antigravity's official [hooks documentation](https://www.antigravity.google/docs/hooks/) describes tool/invocation hooks and a transcript path for the standalone IDE. It does **not** prove a separate extension can read all private chat or review events. Antigravity also has an [official VS Code extension](https://antigravity.google/docs/ide/extensions/vscode/); that is a different host choice from the standalone IDE and must not be silently substituted during the main study.

Therefore first run a **capture feasibility spike on the exact participant setup**. Try to recover: visible user prompt and agent reply, tool activity, changed files, proposal visibility, checkpoint form, tests, final snapshot and synchronized video marker. Mark each as direct, inferred, manually coded or missing. If standalone Antigravity cannot run the companion extension reliably, keep the checkpoint app and official hooks/video; evaluate a fixed VS Code + Antigravity-extension setup **before** freezing the study. Do not infer a person's cognitive mode from click timing alone; combine trace evidence with replay interview coding as specified in [IDE_TELEMETRY.md](IDE_TELEMETRY.md).

## Local app and storage plan

The built prototype is a **local-only** app using pseudonymous participant IDs. Its SQLite database holds assignments, form responses, candidate IDs and event indices; the analysis pipeline holds adjudication outcomes. Raw JSONL, proposal/final snapshots, transcript exports and consented videos are immutable files referenced by ID. Keep the name/contact-to-ID key separately with restricted access. The app supports:

1. Create balanced project-condition-order assignments and launch a session.
2. Show participant task sheets and checkpoint forms without exposing oracle labels.
3. Record candidate exposure, decision, exact proposal hash and confidence.
4. Ingest extension/hook exports and video references, and report capture gaps.
5. Store two independent blinded security reviews and resolved outcomes.
6. Export one row per exposed opportunity plus one row per final task for analysis.

Institutional ethics approval, consent wording, retention dates and access controls must be fixed before recording participants. A local design minimizes external data transfer and keeps the initial pilot simple; it is an implementation default, not an ethics approval.

## Analysis that the system must support

| RQ | Main row and outcome | Essential link |
| --- | --- | --- |
| RQ1 | Candidate opportunity: 0–100 confidence and adjudicated security; report secure and vulnerable items separately. | Candidate ID + frozen proposal hash. |
| RQ2 | Actually exposed vulnerable opportunity: rejected, kept, repaired/replaced, and target flaw in final code. | Exposure record + candidate + final feature mapping. |
| RQ3 | Security-specific checks before/after provisional decision; association with final retention, stated as association. | Time-stamped events/video code + decision time + final oracle. |
| RQ4 | Same outcomes split by SQL injection and path traversal, exploratory with uncertainty. | Prespecified weakness class in researcher manifest. |

Use structural code review plus local attack and normal-function tests as the security oracle. A scanner such as CodeQL, SonarQube or Snyk can supply additional evidence but is not the sole truth source. See [measures and evaluation](MEASURES_AND_EVALUATION.md) and [stimulus manifest](tasks/STIMULUS_AND_ORACLE_MANIFEST.md).

## Decisions to freeze at each gate

1. **Host gate:** install Node 24.21.0 and the chosen Antigravity build; verify hook, extension, transcript, recording and candidate-reveal workflow on that exact setup.
2. **Stimulus gate:** collect a genuine agent candidate pool or explicitly classify controlled patches as constructed; complete two independent security reviews and salience matching.
3. **Participant pilot gate:** verify four checkpoints per task are feasible, the conditions differ in observed orientation without a large difficulty gap, and all data streams are complete.
4. **Main-study freeze:** finalize wording, candidate set, sample target, analysis specification and retention plan before recruitment. Preserve pilot changes in a dated log.
