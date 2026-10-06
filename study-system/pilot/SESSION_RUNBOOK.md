# Researcher session runbook — draft

Use this after ethics approval on a dedicated study machine. The current candidates are constructed engineering prototypes; replace or explicitly label them before a human pilot. Keep `study-system/stimuli/`, app data, review maps and hidden oracles **outside** every participant workspace. Never open the research repository as the participant's Antigravity workspace.

## Before the participant arrives

1. Record the Node, Antigravity, agent/model/account, OS, extension and hook versions in a researcher log. Verify Node 24.21.0, local app health, microphone/screen recording, storage quota and consented data directory.
2. Set `STUDY_DATA_DIR` to a private local directory and start `node study-system/app/server.mjs`. Confirm `http://127.0.0.1:4175/health` responds.
3. Create only a pseudonymous ID, for example `node study-system/app/cli.mjs create P001`. Save the private token and assignment in the restricted researcher log. Do not show the candidate-status mapping to the participant.
4. Export the two assigned workspaces into fresh, separate directories using `node study-system/pilot/export_participant.mjs PROJECT CONDITION NEW_DIRECTORY CHECKPOINT_ORDER`, where `PROJECT` is `A` or `B` and the last value resembles `Q1,Q2,F1,F2`. Match the order printed by `create` exactly. Run `node study-system/app/cli.mjs configure-capture TASK_ID WORKSPACE` for each. Check exported folders contain no `stimuli/` or oracle answer key.

## During each task

1. After consent, give the private pre-task form URL. Provide the same neutral agent-mode orientation to everyone. Show `study/START_HERE.md`, `WORK_ORIENTATION.md` and `PARTICIPANT_WORKFLOW.md`. Start and mark the consented screen recording. Open only the current participant workspace.
2. Give the next task sheet in the assigned order. The participant may inspect the project and use the coding agent to discuss or inspect the step, but asks it not to edit the target feature before the controlled proposal. Record any early edit as a protocol deviation; do not silently overwrite it.
3. Pause at the checkpoint and run `node study-system/app/cli.mjs prepare TASK_ID CHECKPOINT WORKSPACE`. If patch application fails, record the failure and stop that opportunity; do not present a different candidate under the same ID. Give the printed review URL.
4. The participant clicks **Show proposed change**. The patch is applied to the IDE workspace at reveal. They may inspect the diff, ask the agent, run tests or a scanner, and then record their first keep/reject decision and 0–100% security probability. Do not instruct them to pass or fail a specific security test.
5. After the rating, they can freely ask the agent to repair or replace code and run checks. Record the full trace. Repeat until all four checkpoints are done. The first decision and the final submission are separate outcomes.
6. Run `node study-system/app/cli.mjs finalize TASK_ID WORKSPACE`, then give the after-task form URL. Repeat for the second assigned project and condition. After both, give the final form, conduct the replay interview with selected video moments, then debrief according to the approved script.

## After the participant leaves

1. Attach consented files with `node study-system/app/cli.mjs attach TASK_ID video FILE` and `agent-transcript`, `interview-audio`, or `interview-transcript` as available. Import local capture fallback with `node study-system/app/cli.mjs ingest-fallback TASK_ID WORKSPACE` if the collector was unavailable.
2. Run `node study-system/app/cli.mjs audit`. Record incomplete reviews, missing forms, final snapshots, video and transcript. Preserve raw material; do not fill missing fields by recollection.
3. Lock the participant workspace and back up the pseudonymous data under the approved retention/access plan. Keep consent forms and the name-to-ID key in a different restricted location.
4. Later, run the [blind review and analysis sequence](../analysis/README.md). Reviewers receive only the generated `give-to-reviewers/` bundle. They must not see assignment, confidence, interview or the researcher map.

## Interruptions

If the agent edits a target before `prepare`, or the participant edits during frozen review, stop and document what happened. The app refuses a mismatched proposal hash. Do not reset and pretend the original exposure occurred. If the participant withdraws, follow the approved withdrawal procedure; retain or delete data exactly as consent and institutional policy specify.
