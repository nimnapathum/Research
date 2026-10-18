# Researcher runbook for natural tasks

Protocol natural-2026-10-13-r3. Follow the institution-approved consent, compensation, retention and withdrawal terms. Ethics coverage has been confirmed by the researcher. This file implements the [current method](../../NATURAL_WORKFLOW_METHOD.md); old checkpoint runbooks do not govern this session.

## Before recruitment

1. Complete one synthetic session on the actual route: log in, download/extract, prompt the agent to edit, run a check, make final snapshot/rating, export conversation, upload, retrieve and replay the evidence. Confirm code hashes and conversation/video coverage. Test each intended OS and document unsupported fields.
2. Rehearse a final-code security assessment on one secure and one vulnerable reference implementation of each class, then an actual rehearsal output. Keep attack fixtures outside participant packages. Record false positives, missed cases and unsupported symlink checks.
3. Freeze the pilot task/card/interface/form versions, including `orientation_revision` and `stimulus_revision`. Separate pilot allocation/data from rehearsal and main data; real participant IDs must not reuse synthetic accounts. Pin the tested Node/model/IDE/settings and document permitted variation.
4. Test participant reachability, authentication and isolation from researcher documents/evidence. Local `127.0.0.1` works only on the same machine. Prepare the approved recovery and withdrawal procedure; do not improvise email or third-party transfers.

## Before each session

Record consent reference, participant eligibility, assigned sequence, OS, versions/model, global agent rules, review permissions, input device, screen scale, start time, and researcher. No personally identifying details belong in code or analysis tables. Explain: “You may use documentation and tools, inspect or change code, and ask the agent anything. We are studying the process, not grading your ability.”

Use [NATURAL_PRACTICE.md](NATURAL_PRACTICE.md) to check running a command and asking the agent to edit a simple feature. It must not teach the target security defences. Verify a short readable video and transcript sample, then clear the practice conversation. Start the task recording with a visible task ID and local clock; compare its time with the watcher health timestamp. Do not assume every media player preserves absolute clock time.

## During each task

Participant reads the encouragement on the portal and opens a fresh project/conversation. Do not attach the condition card to the agent. Follow [AGENT_OBSERVER_GUIDE.md](AGENT_OBSERVER_GUIDE.md), confirm study-natural-observer is enabled, and start both watchers and recording before prompting. After the first response, inspect the captured raw prompt/reply and health; nonzero record counts alone do not establish coverage. Verify the initial snapshot once without adding a coding checkpoint. Record actual first prompt/last coding time separately from portal progress timestamps.

Use the same provisional 30-minute cap for both tasks. Announce the same remaining-time notice if used. Help only with setup failures. If asked “is this secure?”, say “Use whichever checks you would normally use; I will discuss the assessment after the tasks.” Log technical interruptions and facilitator assistance. Pause the active timer for substantial setup failure under a fixed rule; do not extend time because one condition appears less successful.

If capture fails after coding starts, preserve what exists and log exact gap/time. Avoid forcing the participant to recreate actions as though original data. A corrected recording is a new file/version. Stop for consent/privacy concerns. A session can be usable for final-code outcomes yet unusable for temporal verification; record eligibility per analysis rather than excluding everything silently.

## Finish and next task

At the finishing point, participant freezes code and rates the exact final hash. Their own coding checks are allowed; no researcher oracle results or debrief are shown. Record whether finishing was voluntary or cap-driven. Wait for agent idle and stop both collectors after rating. Retain the agent folder and upload its AGENT_TRANSCRIPT.jsonl. Upload manifest/rating and complete the after-task form promptly before larger transfers. If an upload is wrong or missing, log it and ask the researcher to resolve; the present portal does not offer a fully audited replacement/waiver flow. Never use synthetic media as a substitute.

After the six evidence receipts and form, take the common break and repeat in the other condition/project, with fresh conversation. Collect after-both questions and conduct replay before feedback. Ask about carryover. Select replay moments by the [natural codebook](../instruments/NATURAL_CODEBOOK.md), including no-check cases. Record interview audio/video under the approved procedure and link its filename/hash to both task IDs; the six task uploads do not include a separate interview receipt.

## Session closure

For each task check:

- Stable task ID, protocol version, assignment and final hash agree across records.
- Initial and changed snapshots exist when code changes occurred; final snapshot coverage matches the visible project; capture health is inspected.
- Video opens, is readable and covers prompts, edits and checks; transcript contains the expected conversation/tool actions. Mark any omissions.
- Rating precedes researcher feedback and refers to the assessed final snapshot; after-task answers are saved.
- Raw files are retrievable, hashes match and approved retention/deletion dates are logged.

Run `python3 study-system/analysis/audit_natural_evidence.py EVIDENCE_TASK_FOLDER` from the research root. Its automatic checks do not replace playback or manual code coverage review. Save its result and manual quality notes. Create anonymised review copies; assess actual final code independently. Export forms and fill the natural analysis tables with preserved coder/provenance evidence.

## Pilot decision record

After 4–6 target-cohort sessions, record task completion/timing; perceived difficulty and familiarity by condition; participant misunderstandings; setup and missing-data rates by host; observed modes and coding disagreements; secure/vulnerable final counts; actual insecure agent exposures; rating comprehension; and workload for review/coding. Revise instruments before the main sample. The pilot may show that natural retention cannot be estimated, that the assigned work structures do not distinguish observed mode, or that the exploration interface mainly increases workload. Report that finding and narrow claims or revise the task before freezing the main study. Do not force a favourable security result by selecting participants or deleting inconvenient sessions.

The durations, pilot count and release checklist are study-specific operational choices. Prior-study support and its limits are in [the research audit](../../RESEARCH_AUDIT.md) and [source ledger](../../REFERENCES.md).
