> Historical controlled-workflow material. For the current natural task use [NATURAL_SESSION_RUNBOOK.md](NATURAL_SESSION_RUNBOOK.md) and [the current methodology](../../NATURAL_WORKFLOW_METHOD.md). This document is retained for the older prototype.

# Participant-facing study flow and system boundary

**Design decision:** participants should use a study web page for instructions and answers, plus Antigravity for coding. They should **never receive the whole `study-system/` repository**. This file distinguishes that intended flow from the current engineering prototype.

## Assignment and codebase delivery

The new `/session` route creates the intended portal after a participant is assigned. It provides task sheets and participant-only codebase ZIPs. The downloaded package includes a setup script for the workspace hook and a participant client for checkpoint handoff. The older `pilot/export_participant.mjs` and `configure-capture` commands remain available for researcher-operated local sessions.

For a participant on their own computer, the portal provides a **participant-only ZIP** and setup instructions. The participant downloads it, opens it in Antigravity and runs the included setup and client scripts. The full researcher repository remains private. The in-app practice page teaches review controls; a real capture practice check on Antigravity is still a pilot requirement.

A browser page alone cannot write a proposal into a participant's local IDE workspace. The new `study/client.mjs` helper polls the web app, uploads the current workspace at a checkpoint, applies the proposal locally after reveal, and confirms the resulting hash. This bridge passed a synthetic two-task loopback test. It still needs a deployed HTTPS service and exact-host rehearsal before use across computers.

## Who gets what

| Component | Participant sees or uses | Researcher keeps private |
| --- | --- | --- |
| Study web app | Session link, forms, current task and condition, checkpoint review, decision and confidence | Assignment, candidate mapping, security labels, event store, admin controls |
| Coding workspace | One exported JavaScript project at a time, neutral `AGENTS.md`, the current task information needed by the coding agent, capture configuration | `stimuli/`, vulnerability oracles, answer keys, adjudication and other participants' data |
| Capture | Preconfigured Antigravity workspace hook; screen recording with consent | Collector, transcript/video storage and audit |

The code in `capture/extension/` is currently **VS Code-compatible extension source**, not an installable extension for the standalone Antigravity desktop app. For standalone Antigravity, the downloaded package includes `study/setup.mjs`, which writes `.agents/hooks.json`; [Google documents workspace hooks for Antigravity](https://www.antigravity.google/docs/hooks/). The present capture path is that hook plus a separately retained transcript and screen recording. Whether those streams work together on the exact pilot host still needs a complete rehearsal. If the study truly requires a participant-installed IDE extension, choose and validate a supported host such as VS Code with Antigravity's IDE extension, then package and test the study companion extension there; [Google lists the supported editor surfaces separately](https://www.antigravity.google/docs/ide/extensions/).

## Participant journey

1. **Researcher setup:** the researcher creates a pseudonymous assignment and prepares two participant-only project packages. The researcher keeps the candidate status mapping and data folder inaccessible to participants.
2. **Participant setup:** after the separately administered approved consent process, the participant opens a private study link, completes the pre-task form, signs in to Antigravity, downloads the first project package and starts the study client. On a prepared lab computer installation can be done beforehand.
3. **Task 1:** the web page shows the assigned task, condition card and current step. The participant opens the matching codebase in Antigravity and uses its coding agent. The task text or a neutral copy-to-agent prompt must also be available inside the workspace or copied into the agent chat; a browser-only instruction would not automatically reach the agent.
4. **Checkpoint:** after the step is attempted, the web page reveals the controlled proposed change in the workspace. The participant can inspect it in the IDE, question the agent and run checks. They record a provisional keep/reject decision and security confidence for that **exact** proposal. They may then repair or replace code. This sequence repeats for each assigned step.
5. **Task 2:** the participant opens the second project package and repeats the process under the other assigned condition. The web page administers the after-task and final questionnaires.
6. **Finish:** the app stores both final code snapshots. The researcher checks capture completeness and conducts the recorded replay interview and debrief under the approved protocol.

The web page controls instruction release and decisions; the IDE is where coding and verification happen. Capture runs in the background. The participant should not run researcher CLI commands or inspect private study files.

## What exists now and what is missing

| Part | Current state | Needed for the intended flow |
| --- | --- | --- |
| Participant workspaces | Exporter creates sanitized projects and task sheets; all four sheets for a task are presently present at export. | Decide whether read-ahead is allowed. If strict staged instructions matter, release each sheet through the web app and expose to the agent only at that step. |
| Web app | `/session` and `/task` show setup, current sheet, progress, codebase download and the next review; questionnaires remain separate pages. | Human usability and wording pilot; project ZIP still contains all four sheets. |
| Checkpoint operation | Participant page and local helper prepare, reveal, decide and submit final code; CLI path remains available. Researcher has `skip-remote` for interrupted remote checkpoints. | Exact-host rehearsal, facilitator recovery practice and real capture audit. |
| IDE capture | Hook source and configuration command exist; no full desktop rehearsal yet. Companion extension is source only. | Verify hook installation, collector delivery, official transcript and screen video on the actual Antigravity host. Package and test an extension only if a compatible IDE host is chosen and that extension is needed. |
| Remote access | The app accepts participant client uploads and can advertise an HTTPS `STUDY_PUBLIC_URL`; it still listens on loopback for a reverse proxy. | Deploy/validate TLS, access controls, storage, capture and approved data handling. No public deployment exists. |

## Pilot deployment choice

For the **first supervised pilot on a prepared study computer**, the researcher can install/configure everything beforehand. The participant uses only the web link and Antigravity workspace. This tests the research procedure without asking participants to install the study system.

For **participants' own computers**, use the participant ZIP and helper, and first deploy the app behind an approved HTTPS origin. A local web app at `127.0.0.1` on the researcher's computer cannot serve remote participants by itself.

## Immediate build order

1. Reconcile the participant-facing wording and proposal provenance with the approved protocol.
2. Rehearse the current hook, transcript, browser review and video together on the exact Antigravity desktop host.
3. Decide whether all four sheets may be present in the ZIP. If not, implement staged agent-facing sheet delivery before the main sample.
4. If participants use their own computers, deploy the HTTPS service and test the included local capture/proposal bridge and privacy controls on a clean participant machine.
5. Run a researcher-only end-to-end session, then a consented feasibility pilot. Audit every missing stream and interruption before expanding recruitment.
