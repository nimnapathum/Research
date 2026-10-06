# Researcher session runbook — draft

Use this with the institution-approved materials on a dedicated study machine. Ethics approval has been reported by the researcher; reconcile the exact approved recording, disclosure and retention wording before using the local drafts. The current candidates are constructed engineering prototypes; replace or explicitly label them before a human pilot. Keep `study-system/stimuli/`, app data, review maps and hidden oracles **outside** every participant workspace. Never open the research repository as the participant's Antigravity workspace. Use the [facilitator script](FACILITATOR_SCRIPT.md), [practice](PRACTICE_TASK.md) and [host checklist](HOST_REHEARSAL_CHECKLIST.md).

## Before the participant arrives

1. Record the Node, Antigravity, agent/model/account, OS, extension and hook versions in a researcher log. On this Mac, prefix the study shell PATH with `/opt/homebrew/opt/node@24/bin`; verify `node --version` reports `v24.21.0` before starting the app or configuring hooks. Verify local app health, microphone/screen recording, storage quota and consented data directory.
2. Set `STUDY_DATA_DIR` to a private local directory and start `node study-system/app/server.mjs`. Confirm `http://127.0.0.1:4175/health` responds.
3. Create only a pseudonymous ID, for example `node study-system/app/cli.mjs create P001`. Save the private token and assignment in the restricted researcher log. Do not show the candidate-status mapping to the participant.
4. Export the two assigned workspaces into fresh, separate directories using `node study-system/pilot/export_participant.mjs PROJECT CONDITION NEW_DIRECTORY CHECKPOINT_ORDER`, where `PROJECT` is `A` or `B` and the last value resembles `Q1,Q2,F1,F2`. Match the order printed by `create` exactly. Run `node study-system/app/cli.mjs configure-capture TASK_ID WORKSPACE` for each. Check exported folders contain no `stimuli/` or oracle answer key.

## During each task

1. After consent, give the private pre-task form URL **before tool training**, as specified in `forms.json`. Then give the same neutral agent-mode orientation and the unscored `/practice` page to everyone. Show `study/START_HERE.md`, `WORK_ORIENTATION.md` and `PARTICIPANT_WORKFLOW.md`. Start and mark the consented screen recording at the consented point. Open only the current participant workspace.
2. Give the next task sheet in the assigned order. The participant may inspect the project and use the coding agent to discuss or inspect the step, but asks it not to edit the target feature before the controlled proposal. Record any early edit as a protocol deviation; do not silently overwrite it.
3. Pause at the checkpoint and run `node study-system/app/cli.mjs prepare TASK_ID CHECKPOINT WORKSPACE`. If patch application fails, record the failure and stop that opportunity; do not present a different candidate under the same ID. Give the printed review URL.
4. The participant clicks **Show proposed change**. The patch is applied to the IDE workspace at reveal. They may inspect the diff, ask the agent, run tests or a scanner, and then record their first keep/reject decision and 0–100% security probability. Do not instruct them to pass or fail a specific security test.
5. After the rating, they can freely ask the agent to repair or replace code and run checks. Record the full trace. Repeat until all four checkpoints are decided or documented as skipped. The first decision and the final submission are separate outcomes.
6. Run `node study-system/app/cli.mjs finalize TASK_ID WORKSPACE`, then give the after-task form URL. Repeat for the second assigned project and condition. After both, give the final form, conduct the replay interview with selected video moments, then use the [debrief script](DEBRIEF_SCRIPT.md) only after reconciling it with ethics-approved wording.

## After the participant leaves

1. Attach consented files with `node study-system/app/cli.mjs attach TASK_ID video FILE` and `agent-transcript`, `interview-audio`, or `interview-transcript` as available. Import local capture fallback with `node study-system/app/cli.mjs ingest-fallback TASK_ID WORKSPACE` if the collector was unavailable.
2. Run `node study-system/app/cli.mjs audit`. Record incomplete reviews, missing forms, final snapshots, video and transcript. Preserve raw material; do not fill missing fields by recollection.
3. Lock the participant workspace and back up the pseudonymous data under the approved retention/access plan. Keep consent forms and the name-to-ID key in a different restricted location.
4. Later, run the [blind review and analysis sequence](../analysis/README.md). Reviewers receive only the generated `give-to-reviewers/` bundle. They must not see assignment, confidence, interview or the researcher map.

## Interruptions

If the agent edits a target before `prepare`, the patch fails, recording stops, or the participant edits during a frozen review, pause and describe the actual workspace state in the researcher log. Do not silently restore it. The app refuses a mismatched proposal hash. For an opportunity that cannot be completed, run `node study-system/app/cli.mjs skip TASK_ID CHECKPOINT WORKSPACE REASON_CODE "factual note"`; allowed reasons are `early_edit`, `patch_failure`, `capture_failure`, `participant_declined`, `time_limit`, `other`. A skip may occur before or after reveal; the app preserves any real exposure and the current workspace, but records no invented decision or confidence. A skipped review link is closed. Check the next checkpoint against the changed workspace before preparing it; if the project is no longer workable, document and skip the remaining checkpoints. `finalize` is allowed once every assigned checkpoint is decided or skipped. The analysis lists skips separately and uses actual exposure as the denominator. If the participant withdraws, follow the approved withdrawal procedure; retain or delete data exactly as consent and institutional policy specify.
