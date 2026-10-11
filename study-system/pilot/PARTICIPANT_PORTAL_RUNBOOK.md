# Participant portal and Antigravity setup — pilot runbook

This is the implemented participant-facing route. It uses a private web session for forms and task sheets, a downloadable project ZIP for coding, and a Node helper in that project to connect the IDE workspace to the web app. Do not give participants the `study-system/` repository.

For the password-based `research-portal` used on the local Mac, its task page now serves the same instrumented ZIP through `app/portal-bridge.mjs` when the checkpoint bridge is enabled. It shows the private checkpoint page link and live client/hook status. The portal handles the pre-task, after-task and after-both forms for these bridged sessions; this checkpoint app suppresses duplicate forms. The local restart script starts the checkpoint service as well as the portal API and web app. An existing checkpoint session with a different assignment is blocked for researcher reconciliation.

## Researcher setup

1. Use Node 24, an approved private `STUDY_DATA_DIR`, and a long `STUDY_ADMIN_PASSWORD` (at least 16 characters). Start `node app/server.mjs` and the password portal with `CHECKPOINT_BRIDGE_ENABLED=1`. In **Add participant**, click **Create participant and tasks**. The portal generates the pseudonymous ID and reserves the checkpoint service's next seeded balanced two-task assignment. Give the generated username and one-time password privately. Keep hidden candidate statuses and private checkpoint tokens out of participant materials. Check the server log if creation reports a reservation reconciliation problem.
2. Give the participant only their password-portal credentials and task page, or the checkpoint service's private `/session?token=...` link when using that route directly. Treat any link token and the downloaded ZIP as private. Keep the researcher console, `stimuli/`, data directory and status mapping inaccessible to the participant and the coding agent.
3. For a supervised pilot on one prepared computer, the default `http://127.0.0.1:4175` works. For a participant on another computer, deploy the app behind an institution-approved **HTTPS reverse proxy**, set `STUDY_PUBLIC_URL=https://your-study-host`, and ensure the Node app remains bound to loopback behind that proxy. The app does not itself provision hosting, TLS certificates or institutional storage controls. Reconcile this data flow with the approved protocol before use.
4. Record screen video separately with the approved procedure. The workspace hook sends selected tool events; it does not record the full chat or video. Preserve the Antigravity transcript separately and attach it after the session.

## Participant steps shown in the app

1. Open the session link and complete the pre-task form. The first task codebase and sheet unlock after this form.
2. Download Task 1 ZIP, extract it into a new directory, and open that directory in Antigravity. Do not open the private research repository.
3. In the project terminal, run `node study/setup.mjs`. This writes `.agents/hooks.json` with the actual local Node path. Confirm `study-observer` is enabled in Antigravity's Hooks view. Then run `node study/client.mjs` in a second terminal and leave it open. The task page reports when the client connects and whether an agent invocation/tool event has been observed. Node 24+ and Git are required on each participant computer.
4. Read the current task sheet on the web page. The same project package contains neutral workflow instructions and all four task sheets; the page points to the current step. Use the coding agent in agent mode and follow the common checkpoint procedure.
5. Click **I am ready to review the proposal**. The local helper uploads the current participant workspace to the private server. The server prepares the assigned frozen proposal. Open its review page, then click **Show proposed change**. Only then does the helper apply the proposal in the IDE workspace. Inspect, check, and record keep/reject plus the 0–100% security estimate. After the first decision, continue editing or repairing freely.
   The helper checks the workspace hash again when the decision is submitted. If the proposed code changed, the app records a review conflict rather than a decision; ask the researcher to handle the interruption.
6. Repeat the four checkpoints. Click **Submit final code**; the helper sends the final workspace snapshot. Complete the after-task form. The second task ZIP unlocks, and the same steps repeat under the other assigned condition.
7. If approved, run `node study/upload-transcript.mjs PATH_TO_TRANSCRIPT` for the official agent transcript at the end of each task. The researcher separately attaches the approved screen recording. Complete the after-both form and the researcher-led replay interview.

## What is captured and what is still separate

- The app stores assignment, task-page openings and ZIP delivery, checkpoint requests, exact proposal hashes, exposure confirmation, decisions, confidence, and final workspace snapshots. A page opening does not prove that a participant read the sheet.
- The workspace hook sends selected agent invocation and tool metadata. The participant client periodically sends a workspace hash, queued hook summaries, and workspace files at review preparation and final submission. Its terminal must stay open; a disconnected client prevents a valid remote decision.
- If approved for this participant, the optional Python recorder sends five-second aggregate pointer summaries through that same client. It does not supply a cognitive-mode label. The [cross-platform guide](CROSS_PLATFORM_CAPTURE.md) covers macOS, Windows, Linux/X11, and the unsupported Linux Wayland pointer case. The coding and core study can continue without the optional pointer stream.
- Full prompts/replies and screen actions require the consented Antigravity transcript and video. The explicit transcript upload sends only the named transcript file, up to 15 MB. A hook event is not a complete conversation record or a direct measure of cognitive mode.
- The current proposal pool is **researcher-constructed**. A main-study claim about agent-generated proposals requires documented genuine-agent provenance or a revised, honest constructed-stimulus claim.

## Interruptions and pilot limits

- If a remote proposal cannot be prepared or the participant client fails, use `node app/cli.mjs skip-remote TASK_ID CHECKPOINT REASON "factual note"`. It records actual exposure and the last reported workspace hash; it does not invent a decision. Resolve the actual participant workspace before moving to the next step.
- The present ZIP includes all four task sheets for its project. If preventing read-ahead is necessary, change the package and agent-facing release process before the main sample.
- The study extension source in `capture/extension/` is for a VS Code-compatible host. This standalone Antigravity route installs a workspace hook through `study/setup.mjs`; it is **not** an Antigravity extension installer. Verify the hook and transcript on the exact participant version.
- This flow passed a synthetic two-task test in `pilot/participant_portal_dry_run.mjs`, including hook timing, transcript-file upload, a simulated Windows-format pointer summary, and changed-code refusal. It has not been tested with a real participant, a real Antigravity transcript, a screen recording, or a deployed HTTPS service. A researcher-only exact-host rehearsal on every intended OS and consent/wording reconciliation remain required.
