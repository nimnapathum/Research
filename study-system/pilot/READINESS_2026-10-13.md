# Readiness decision — 13 October 2026

> **Historical decision record.** Its seven-file upload counts and earlier hosted status are superseded. See [pilot readiness audit, 18 October](../../PILOT_READINESS_AUDIT_2026-10-18.md) and [hosted rehearsal status](../../research-portal/HOSTED_REHEARSAL_STATUS.md) before planning a new natural pilot.

## Decision

**Current decision:** The local portal serves natural-task ZIPs and receives seven evidence files per task. A synthetic end-to-end portal check passed on this Mac. A real participant pilot is not yet cleared: the actual Antigravity transcript, playable video, code evidence, security adjudication, and access from a participant-owned computer still require manual verification. The controlled-checkpoint mode remains a separate older protocol.

The current working version is **natural-2026-10-13-r3**. Source-to-method refinements and remaining work are in [RESEARCH_AUDIT.md](../../RESEARCH_AUDIT.md). The local restart script selects `STUDY_PROTOCOL=natural`. Its task page has no proposal-reveal gate; downloaded filenames end in `-natural.zip`. It stores seven files with SHA-256 receipts and requires matching final-manifest/rating hashes before submission. Follow [the current local rehearsal guide](../../research-portal/LOCAL_NATURAL_REHEARSAL.md). The `-study.zip` package belongs to the older controlled mode.

See [NATURAL_DATA_COVERAGE.md](NATURAL_DATA_COVERAGE.md) for raw streams, derived measures, privacy controls, missingness codes and the receipt gate. The watcher excludes likely secrets and symlinks, limits volume, and records `CAPTURE_HEALTH.json`. A portal receipt proves transfer and hash identity, not evidence quality.

The manual CLI alternative remains in [NATURAL_REHEARSAL_TODAY.md](NATURAL_REHEARSAL_TODAY.md), which describes the pre-portal kit. For the local portal, use the current guide above. Do not distribute the old instrumented ZIP or `PARTICIPANT_WORKFLOW.md` for a natural session.

## Evidence checked today

| Component | Result | Meaning |
| --- | --- | --- |
| Existing portal API, web login and checkpoint collector | All three local health checks responded successfully outside the sandbox (`:4000`, `:3000`, `:4175`). | Services are running locally; remote access, login and privacy controls were not exercised today. |
| Portal API/web typecheck | Passed. | Source types are consistent; does not prove participant flow. |
| Participant material and checkpoint bridge tests | Passed. | Old ZIP, assignment and form gate behave as coded. |
| Portal/client synthetic two-task dry run | Passed with two ZIPs, eight controlled reviews, rejection restoration, changed-code refusal, two finals and remote skip. | Engineering evidence for the **old controlled** workflow only. Initial sandbox run could not bind a local port; the approved outside-sandbox rerun passed. |
| Constructed candidate oracles | All 16 passed normal functional checks and their intended target secure/vulnerable labels. | Candidate prototypes for controlled review; they are not naturally generated agent outputs and do not validate free-task final code. |
| Natural kit generation | Passed Node syntax check; generated both task assignments for sequence 0 and 1. | The two projects have no reveal/no-edit instruction in the generated task cards or replacement `AGENTS.md`. |
| Natural starter health | Both projects' baseline HTTP tests passed under Node 24.21.0. | Their original endpoints work before coding; Q1/F1 features remain to be implemented by the researcher/participant. |
| Natural code watcher | Created an initial and a second snapshot after a file edit; final snapshot command produced a hash and copied files. | Code evolution can be captured locally. It checks every two seconds, so very brief transient edits can be missed; screen/transcript are still needed. |
| Portable natural ZIP and rating | A generated task ZIP passed archive integrity, omitted hidden stimuli/oracles and old workflow files, and included local capture plus a final-snapshot rating command. The rating smoke test saved a JSON response tied to the final hash. | The local portal now delivers and receives these files. Windows/Linux execution is untested. |
| Antigravity desktop state | App is open at its home screen with no study project selected; the UI shows an available restart/update. | No hook, transcript, agent edit, test, or recording was verified on the actual study workspace today. Pin and record the version used; avoid changing it between participants without a new host check. |

## Remaining gates for a real natural-workflow pilot

1. **Ethics wording:** the researcher confirmed that institutional approval explicitly covers the revised free-coding procedure and screen, agent-transcript, code-snapshot and interview recording. The approved files were not available to inspect here. Use their approved wording, not the local draft that still describes preselected proposals.
2. **Exact-host capture:** open one generated natural workspace in Antigravity, make a prompt that changes code, run a test, and confirm a readable agent transcript, a screen recording, synchronized times, and watcher snapshots of the same change. Record host/model/version and missing fields. The natural kit does not automatically upload a transcript or video to the portal.
3. **Access isolation:** on the intended participant account/OS, verify the agent cannot read hidden `stimuli/`, researcher database, status mapping or unrelated personal files. Opening a `/private/tmp` workspace alone is not proof of sandboxing.
4. **Natural forms and evidence storage:** the portal hides direct SQL/path recognition questions before a natural task. The final-snapshot security probabilities are collected by `study/rate.mjs` and uploaded with the snapshot hash. Verify the participant understands both questions and that researcher analysis can join the stored rating to the reviewed code.
5. **Participant-owned OS and evidence quality — current blocker:** a synthetic local check passed for the page, ZIP, upload receipts, researcher retrieval of the same file, hash linkage and submission gate. It used mock text for transcript/video, so actual Antigravity export, playable video, code ZIP inspection, withdrawal/deletion operation and hosted researcher access remain untested. The local app is bound to `127.0.0.1`; participants on other computers cannot reach it without a tested deployment. Rehearse extraction, Node, recording and upload on each actual OS. Do not substitute a passing Mac test for Windows/Linux evidence.
6. **Task timing and interpretation:** rehearse both Q1/F1 feature pairs within the proposed cap, check whether the two orientations produce distinguishable episodes, and verify that final security confidence is understood as confidence about the final code. If no agent-origin vulnerable changes occur, report that honestly and keep RQ2 agent-retention analysis descriptive or unestimable.
7. **Security adjudication:** build/run target attack tests against each **actual final submission** and have blinded reviewers confirm results. The 16-candidate verifier is for controlled stimuli only; it is not a final-code oracle for the free task.

**Go/no-go:** Your own synthetic rehearsal can begin through the local natural-mode portal. The user confirmed ethics coverage, but participant-owned-computer connectivity and evidence-quality checks in gate 5 remain unresolved. The supervised feasibility pilot can begin after the intended host/capture/transfer/retrieval route passes, approved materials are used, and a trial security assessment is demonstrated. Condition separation and insecure-output frequency are pilot questions, not prerequisites for a favourable result. Freeze the main-study wording and analysis afterward; no study effect should be inferred from the rehearsal or 4–6 pilots. Sessions run through the checkpoint mode remain separate controlled-review feasibility tests.

## r2 verification

Typechecks pass. Five capture tests pass, including renamed extraction and neutral agent context. Two analysis-tool tests pass, including tampered-code rejection and rating-hash exclusion. A synthetic local flow passed for natural mode, exact commands, frozen downloads, early after-task form, seven receipts, received archive/hash audit and submission gating. Research-library access checks pass. This uses mock transcript/video and does not validate their real capture or playback.

## r3 observer status

New task packages include the scoped conversation observer and the portal shows setup/watch/status steps. Six synthetic observer tests pass for scope, inert hooks, record/timestamp preservation, partial lines, duplicate prevention, rewrites and missing capture. The code watcher CLI now also resolves filesystem path aliases. The portal validates observer export task/version/footer/counts and shows coverage warnings. Native Antigravity prompt/response content, exact source timestamp meanings and OS compatibility remain an actual-host rehearsal requirement. Old r2 packages remain frozen; use a new participant assignment for r3.

The r3 synthetic portal check also passed for observer-script delivery, setup/watch instructions, rejection of an incomplete observer export, capture-status receipt metadata, researcher-only retrieval of the original uploaded file, final archive audit and Task 2 gating. This is transport/engineering evidence using synthetic transcript records and mock video, not a real Antigravity capture.
