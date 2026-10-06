# Artifact status and next gates — 6 October 2026

This is the current inventory for the security trust study. **Built** means a file or program exists and passed the stated engineering check; it does not mean that the research design has been validated with people. The [aim and RQs](../RQ.md) remain the governing scope.

## Iteration record

| Iteration | Completed artifact | Engineering evidence | What remained after it |
| --- | --- | --- | --- |
| 1. Tasks and controlled opportunities | Two standalone JavaScript/Node projects; eight task sheets; condition cards; neutral agent Markdown; 16 constructed candidate patches; hidden normal and attack oracles. | `node stimuli/verify_all.mjs`: all 16 candidates passed requested normal behaviour and their expected SQL/path oracle classification. | Forms, capture, app, analysis, human pilot. |
| 2. Participant instruments | Versioned pre-task, checkpoint, after-task and after-both forms; replay interview guide; observed-mode and verification codebook. | Machine-readable `forms.json` renders in the local app and validates answers during the synthetic run. | Capture, app, analysis, cognitive interviews. |
| 3. Collection | Balanced assignment; participant-only export; local checkpoint app; frozen proposal/final snapshots; metadata hook; companion extension source; fallback import and audit. | A local one-task smoke test and the two-task synthetic run recovered eight exposure/decision/confidence links; reveal-time patch was absent from the workspace until clicked. | Analysis, exact-host capture feasibility and human pilot. |
| 4. Analysis and integration | Blind review bundles; two-reviewer resolution; mode/check/decision-path coding sheets; opportunity/task/summary export; full dry-run script. | `node pilot/full_dry_run.mjs`: two tasks, eight controlled exposures, eight decisions, final snapshots, form joins and analysis joins passed. The audit correctly flagged absent video/transcript in this synthetic run. | Independent reviewers, Antigravity host test, ethics, human pilot and protocol freeze. |

## Artifact map

| Need | Current file or component | State |
| --- | --- | --- |
| Aim, RQs, rationale and scope | [RQ.md](../RQ.md), [METHODOLOGY.md](../METHODOLOGY.md), [REFERENCES.md](../REFERENCES.md) | Working research protocol; supervisor review pending. |
| Participant task projects | [Resource catalogue](projects/resource-catalogue/README.md), [support archive](projects/support-archive/README.md) | Runnable prototypes; exact Node 24.21.0/Antigravity setup pending. |
| Task sheets and agent-facing Markdown | [instruments](instruments/) and project `AGENTS.md` files | Built. Instructions are neutral and visible. No hidden instruction-file attack is part of RQ1–RQ4. |
| Controlled secure/vulnerable proposals | [stimuli](stimuli/) | 16 **researcher-constructed** prototypes. They cannot be called naturally generated agent failures. Genuine-agent provenance or explicit constructed-stimulus framing is pending. |
| Questionnaires and interview | [forms.json](instruments/forms.json), [QUESTIONNAIRES.md](instruments/QUESTIONNAIRES.md), [INTERVIEW_GUIDE.md](instruments/INTERVIEW_GUIDE.md) | Built, wording not psychometrically validated; cognitive pilot pending. |
| IDE/agent capture | [capture](capture/README.md) | Hook and VS Code-compatible extension source built and syntax-checked; not installed or verified in the chosen Antigravity host. Prompt/response completeness unknown. |
| Central storage and checkpoint interface | [app](app/README.md) | Local runnable prototype. No production authentication, encryption at rest, or institutional data controls. |
| Security adjudication and statistics | [analysis](analysis/README.md), [codebook](instruments/CODING_CODEBOOK.md) | Pipeline works on synthetic rows; no real independent labels or behavioural coding yet. |
| Session operation and provenance | [runbook](pilot/SESSION_RUNBOOK.md), [pilot protocol](pilot/PILOT_PROTOCOL.md), [candidate collection](pilot/CANDIDATE_PROVENANCE.md), [participant information draft](pilot/PARTICIPANT_INFORMATION_DRAFT.md), [pilot log](pilot/PILOT_LOG_TEMPLATE.md) | Drafts for supervisor, ethics and host review. |

## Required before the first recorded participant

1. Obtain institutional ethics approval and finalize consent, recording, retention, access and withdrawal procedures. Keep the name-to-ID key outside the app.
2. Test Node 24.21.0, the chosen Antigravity version/account/model, hook and companion extension on the exact participant machine. Confirm a visible prompt/response, tool event, code edit, proposal reveal, video marker and final snapshot can be linked. Record missing streams honestly.
3. Decide the candidate provenance claim. Collect raw target-agent outputs with prompts, model/settings, replies, tool traces and original diffs, **or** describe the selected patches as constructed proposals. Independently adjudicate every final candidate and compare salience, function and difficulty.
4. Cognitive-pilot the forms and condition cards with target-population developers; check understanding and whether security recognition items prime the tasks.

## Required before the main sample

5. Run 4–6 consented target-population pilot sessions; inspect time, completion, actual exposure, condition-to-observed-mode separation, order effects, workload, video/transcript completeness and interview recall. The pilot is for feasibility and revision, not an RQ result.
6. Train two blind security reviewers and behavioural coders; resolve disagreements and document missingness rules. Pilot the independent adjudication and optional scanner evidence.
7. Freeze tasks, candidate manifest, instruments, software/agent versions, sample target, primary RQ1 summary, analysis hierarchy and data-retention plan before main recruitment. Record every later deviation.

**Current evidence limit:** No participant has completed this protocol in this workspace. There are no empirical trust, cognitive-mode, security-acceptance or condition results yet.
