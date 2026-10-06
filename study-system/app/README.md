# Local study app and checkpoint workflow

**Status: runnable engineering prototype; no participant deployment or ethics approval implied.** The app binds to `127.0.0.1:4175`, uses Node 24.21.0 LTS's built-in SQLite, and keeps data under `.study-data/` unless `STUDY_DATA_DIR` is set. It has no remote service or npm dependencies. Run it only on a dedicated study machine and use a separate, access-controlled data directory for real participants.

## What it does

- Generates balanced, shuffled two-task assignments across project, condition, candidate status and checkpoint order; stores the random seed.
- Renders the [forms](../instruments/QUESTIONNAIRES.md) and a controlled proposal review page.
- Lets a researcher prepare one selected, neutral-ID prototype patch from a participant-only workspace, saves the **before file** and a complete proposed snapshot, then restores the workspace until reveal.
- Applies the patch in the IDE workspace and records candidate exposure when the participant clicks **Show proposed change**. Decision and security confidence refer to the frozen proposal hash. It refuses a decision if the workspace changed during review. On reject, it restores the pre-proposal file after recording the rating.
- Stores immutable final workspace copies, indexed events, raw JSONL, form answers, and attached video/transcript/audio files. It never serves researcher-only vulnerability labels to the participant page.
- Provides an `audit` command that compares indexed and raw event counts and lists incomplete reviews.

This review gate is an **experimental checkpoint**. It changes the ordinary agent workflow and may affect verification. Apply it identically in both conditions, pilot for naturalness, and report it in the method. The prototype patches in `stimuli/` are constructed; the main study needs documented agent provenance or honest description of constructed stimuli.

## Researcher sequence for an engineering dry run

1. Set `STUDY_DATA_DIR` to a dedicated local directory. Start the app with `node server.mjs` in this folder. Keep that terminal running.
2. `node cli.mjs create P001` prints a private session token and two assigned tasks. **Do not show the printed candidate-status mapping to the participant.**
3. Export each assigned project with `node ../pilot/export_participant.mjs A acceleration NEW_DIRECTORY Q1,Q2,F1,F2`, changing project, condition and order to match the assignment. Use a distinct new directory for each task. The export contains no answer key.
4. `node cli.mjs configure-capture P001-T1 WORKSPACE` installs the hook and writes the local capture config. Open only that participant workspace in Antigravity. Install/activate the companion extension only if the chosen host supports it.
5. Give the private pre-task form URL from `create`. Provide the same neutral tool training to everyone. Present `study/WORK_ORIENTATION.md` and the task sheets in the assigned order.
6. Pause the participant at the checkpoint. Run `node cli.mjs prepare P001-T1 Q1 WORKSPACE`; the candidate is stored outside the workspace until reveal. Give the printed review URL. The participant clicks **Show proposed change**, which applies and displays the patch, then may inspect, ask questions and test before recording keep/reject plus 0–100% security confidence. The app checks that the proposal has not been edited before the first decision. Video spot-checking must confirm meaningful visibility.
7. After the form, let the participant repair/revise/reimplement freely. Repeat the next assigned checkpoint. Do not assume a kept vulnerable proposal remains vulnerable at the end.
8. `node cli.mjs finalize P001-T1 WORKSPACE` freezes the final repository. Give `/form/after-task?token=TOKEN&task_id=P001-T1`. Repeat Task 2, then give `/form/after-both?token=TOKEN` and conduct the replay interview before debrief.
9. Attach consented evidence using `node cli.mjs attach TASK_ID video FILE`, `agent-transcript`, `interview-audio`, or `interview-transcript`. Run `node cli.mjs audit` and record missing streams. Keep the identity key, consent forms and deletion schedule outside this app.

## Data directories

~~~text
.study-data/
  study.sqlite                   assignment, forms, reviews, event index, evidence index
  raw/events.jsonl              append-only normalized event stream
  raw/evidence/                 copied recordings/transcripts with hashes
  snapshots/<review-id>/        before file and frozen proposed repository
  snapshots/final-<id>/         final repository copy
~~~

The main security ground truth stays in researcher-only manifests and blinded adjudication files, **not** in the participant app or workspace. `candidate_exposed` means the patch was revealed in the local page; a video sample must still confirm meaningful visibility. The hook/extension events are supplemental. A missing agent transcript, failed extension or interrupted video is reported as missing data, not silently filled in.

## Limits to resolve before recruitment

- The exact Antigravity host, extension installation, hook behaviour and transcript export have not been tested on the participant machine.
- The prototype candidate set needs target-agent provenance, independent review and salience matching. Use the real selected candidate pool in the same review workflow before collecting main data.
- The local app has a private session token but no researcher login or encryption at rest. Use institutional storage controls and an approved retention plan; add stronger access control if it runs on a shared machine or network.
- Screen recording and interview collection are external tools; `attach` centralizes their files and hashes after recording.
- An app/agent crash can leave a prepared proposal in the workspace. The audit flags the incomplete review, and the researcher must resolve it without inventing a decision.
- Scoring and RQ exports are implemented in the separate [analysis pipeline](../analysis/README.md); they still require independent adjudication and behavioural coding for real sessions.
