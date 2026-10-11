# Study app and checkpoint workflow

**Status: runnable engineering prototype; no human host validation implied.** The researcher reports ethics approval, but the approved wording still needs reconciliation with these local drafts. The app binds to `127.0.0.1:4175`, targets Node 24.21.0 LTS's built-in SQLite, and keeps data under `.study-data/` unless `STUDY_DATA_DIR` is set. It has no npm dependencies. For real participants, use an access-controlled data directory and an approved deployment.

The app now has a participant portal with a private session link, task sheets, codebase ZIP downloads, setup status, checkpoint progression, decisions and final submission. The [participant portal runbook](../pilot/PARTICIPANT_PORTAL_RUNBOOK.md) describes that route. The older researcher-operated CLI route below remains available. The remote client route has passed a synthetic two-task test, but not an actual Antigravity or human pilot.

The password-based `research-portal` uses `app/portal-bridge.mjs` to reserve the checkpoint service's next seeded balanced assignment, mirror questionnaires, serve the instrumented ZIP, and show client/hook/optional-pointer status. Create password-portal participants in its **Participants** page; it generates their pseudonymous ID and saves the exact returned task sequence. The CLI remains available for researcher-operated sessions outside the portal. The bridge refuses a participant code whose existing checkpoint assignment differs. On this Mac, `research-portal/scripts/restart-local.sh` starts both apps with a shared checkpoint data directory. The checkpoint app still controls proposal exposure, decisions and final snapshots; do not place its SQLite file or `stimuli/` inside a participant workspace.

Set `STUDY_ADMIN_PASSWORD` to enable `/admin` for researcher creation of pseudonymous participants and `/admin/audit` for per-task capture checks. It uses HTTP Basic authentication and requires HTTPS if accessed across a network. `STUDY_PUBLIC_URL` must be the externally reachable HTTPS origin when a participant uses another computer; the app listens on loopback behind a separately configured reverse proxy. Neither hosting nor TLS is provisioned by this repository.

## What it does

- Generates balanced, shuffled two-task assignments across project, condition, candidate status and checkpoint order; stores the random seed.
- Renders the [forms](../instruments/QUESTIONNAIRES.md) and a controlled proposal review page.
- Lets a researcher prepare one selected, neutral-ID prototype patch from a participant-only workspace, saves the **before file** and a complete proposed snapshot, then restores the workspace until reveal.
- Applies the patch in the IDE workspace after the participant clicks **Show proposed change**; in the remote route, exposure is recorded when the client confirms the applied hash. Decision and security confidence refer to the frozen proposal hash. It refuses a decision if the workspace changed during review. On reject, it restores the pre-proposal file after recording the rating. Video must confirm meaningful visibility.
- Stores immutable final workspace copies, indexed events, raw JSONL, form answers, and attached video/transcript/audio files. It never serves researcher-only vulnerability labels to the participant page.
- Provides an unscored `/practice` page, a documented `skip` command for interrupted checkpoints, an `audit` for raw/index consistency, and `audit-measurements` for per-task sources, first-decision latency, evidence hashes and missing-stream warnings. The optional pointer recorder is documented in [cross-platform capture](../pilot/CROSS_PLATFORM_CAPTURE.md).

This review gate is an **experimental checkpoint**. It changes the ordinary agent workflow and may affect verification. Apply it identically in both conditions, pilot for naturalness, and report it in the method. The prototype patches in `stimuli/` are constructed; the main study needs documented agent provenance or honest description of constructed stimuli.

## Researcher sequence for an engineering dry run

1. Set `STUDY_DATA_DIR` to a dedicated local directory. Start the app with `node server.mjs` in this folder. Keep that terminal running.
2. `node cli.mjs create P001` prints a private session token and two assigned tasks. **Do not show the printed candidate-status mapping to the participant.**
3. Export each assigned project with `node ../pilot/export_participant.mjs A acceleration NEW_DIRECTORY Q1,Q2,F1,F2`, changing project, condition and order to match the assignment. Use a distinct new directory for each task. The export contains no answer key.
4. `node cli.mjs configure-capture P001-T1 WORKSPACE` installs the hook and writes the local capture config. Open only that participant workspace in Antigravity. Install/activate the companion extension only if the chosen host supports it.
5. Give the private session URL from `create`; its first action is the pre-task form. Provide the same neutral tool training to everyone. Present `study/WORK_ORIENTATION.md` and the task sheets in the assigned order.
6. Give the unscored `/practice` page before measured tasks. Pause the participant at the checkpoint. Run `node cli.mjs prepare P001-T1 Q1 WORKSPACE`; the candidate is stored outside the workspace until reveal. Give the printed review URL. The participant clicks **Show proposed change**, which applies and displays the patch, then may inspect, ask questions and test before recording keep/reject plus 0–100% security confidence. The app checks that the proposal has not been edited before the first decision. Video spot-checking must confirm meaningful visibility.
7. After the form, let the participant repair/revise/reimplement freely. Repeat the next assigned checkpoint. Do not assume a kept vulnerable proposal remains vulnerable at the end.
8. If a checkpoint cannot finish, run `node cli.mjs skip P001-T1 CHECKPOINT WORKSPACE REASON_CODE "factual note"` and preserve the actual workspace state. `node cli.mjs finalize P001-T1 WORKSPACE` freezes the final repository after every checkpoint has a decision or documented skip. Give `/form/after-task?token=TOKEN&task_id=P001-T1`. Repeat Task 2, then give `/form/after-both?token=TOKEN` and conduct the replay interview before debrief.
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

The main security ground truth stays in researcher-only manifests and blinded adjudication files, **not** in the participant app or workspace. In the remote client route, `candidate_exposed` is recorded when the client confirms that the exact patch reached the IDE workspace; video must still confirm meaningful visibility. The hook/extension events are supplemental. A missing agent transcript, failed extension or interrupted video is reported as missing data, not silently filled in.

## Limits to resolve before recruitment

- The exact Antigravity host, workspace-hook behaviour, official transcript export and video have not been tested on each participant OS. The VS Code companion extension is not part of the standalone desktop route.
- The prototype candidate set needs target-agent provenance, independent review and salience matching. Use the real selected candidate pool in the same review workflow before collecting main data.
- The app has private participant links and optional researcher Basic authentication, but no encryption at rest, rate limiting, or institutional access-control integration. Use approved storage, a retention plan, HTTPS and access controls before networked use.
- Screen recording and interview collection are external tools; `attach` centralizes their files and hashes after recording.
- An app/agent crash can leave a prepared proposal in the workspace. The researcher documents the interruption and uses `skip` if the checkpoint cannot continue; no exposure or decision is invented. The recovery dry run covers both pre- and post-reveal skips.
- Scoring and RQ exports are implemented in the separate [analysis pipeline](../analysis/README.md); they still require independent adjudication and behavioural coding for real sessions.
