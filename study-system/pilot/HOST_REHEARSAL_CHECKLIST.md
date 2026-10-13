> Historical controlled-workflow material. For the current natural task use [NATURAL_SESSION_RUNBOOK.md](NATURAL_SESSION_RUNBOOK.md) and [the current methodology](../../NATURAL_WORKFLOW_METHOD.md). This document is retained for the older prototype.

# Exact-host researcher rehearsal

Complete and date this on the actual participant machine before recording a person. This is a manual acceptance test, because an export script cannot prove Antigravity, screen recording or OS permissions work.

| Item to record | Acceptance observation |
| --- | --- |
| OS and desktop session, Node, Git, Antigravity build, model/account, settings, hook and optional extension versions | Exact versions/settings written in private researcher log; Node is 24 or later; record any difference from the declared study pin. On Linux record X11 versus Wayland. |
| Participant workspace and private data separation | Antigravity opens only an exported workspace; agent tools cannot list or read `stimuli/`, hidden oracles, SQLite data or researcher status mapping. Test access explicitly with a harmless path outside the workspace. |
| Agent-mode practice | Visible participant prompt and reply; tool action appears in hook/transcript or recorded video; timestamps align with the participant code marker. Do not infer complete prompt capture from an IDE file-event stream. |
| Participant ZIP and local client | Extract the ZIP using the host OS, run `node study/setup.mjs` and `node study/client.mjs`, and observe client connection plus a hook event in the portal. Confirm the package contains no researcher-only files. |
| Transcript transfer | Export or locate a readable official agent transcript containing the visible prompt and reply. If approved, run `node study/upload-transcript.mjs PATH_TO_TRANSCRIPT`; verify its hash and presence in the measurement audit. |
| Proposal gate | Prepared patch is absent before reveal, then appears in the IDE and review page; exact proposal hash and candidate-exposed event are logged. |
| Review decision | Keep/reject and 0–100% rating attach to the same review ID; editing before first decision is rejected; reject restores the before file. |
| Repair and final | Agent can repair after the first decision; final snapshot contains the actual submitted code; both task forms work. |
| Recording | Screen video includes code inspection, agent conversation, reveal and checks; microphone/interview setup matches consent. Close personal notifications. Mark every recording gap. |
| Optional pointer stream | If covered by approval, run the `--probe` and `--run` commands on this OS, move/click/scroll during a synthetic task, and verify nonzero summary data and server receipt. Stop with Ctrl+C during breaks. If probe fails or Linux uses Wayland, record pointer data as unavailable. |
| Failure recovery | Deliberately stop a checkpoint before reveal and another after reveal on a synthetic session; `skip` records factual reason and keeps the actual workspace; finalization and export preserve missingness. |
| Review/export | `audit` exposes missing evidence, blinded reviewer bundle omits assignment/confidence, analysis includes skipped checkpoints and correct exposure denominator. |

Record pass/fail, observed file or timestamp, and any deviation for each row. The host is not ready for a recorded participant if private files are reachable, proposal provenance is incorrectly described, consent wording differs from the approved version, or the core exposure/recording streams fail. Antigravity desktop hooks and transcript paths are documented by the [vendor](https://www.antigravity.google/docs/hooks/), but their behavior on this installed build must be observed here.

Run this checklist once for **each actual OS/Antigravity version combination** used in the pilot. Copy [HOST_REHEARSAL_LOG_TEMPLATE.csv](HOST_REHEARSAL_LOG_TEMPLATE.csv) to the approved private researcher log location and fill one row per host/Antigravity version. The [cross-platform guide](CROSS_PLATFORM_CAPTURE.md) gives the platform-specific commands and limitations. A CI package check is useful evidence for extraction and setup only; it does not replace this host log.
