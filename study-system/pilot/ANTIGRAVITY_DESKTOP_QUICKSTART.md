# Antigravity desktop capture: researcher quickstart

This guide is for a **researcher-only local Mac rehearsal** with Antigravity desktop and the direct checkpoint app. For the current portal/ZIP route on macOS, Windows or Linux, use the [participant portal runbook](PARTICIPANT_PORTAL_RUNBOOK.md) and [cross-platform guide](CROSS_PLATFORM_CAPTURE.md). The code in `capture/extension/` is VS Code extension source; it is not an installable Antigravity desktop extension. Desktop capture uses workspace `PreInvocation`, `PostInvocation` and selected `PostToolUse` hooks. Google documents `.agents/hooks.json` and the Hooks panel for [Antigravity](https://www.antigravity.google/docs/hooks/). The hook records invocation and selected tool metadata; it does not by itself copy the full chat transcript or record the screen.

Use an empty rehearsal data directory. Do not put the study repository, hidden `stimuli/` folder, or researcher data inside the participant workspace. The example below is for synthetic rehearsal only. Use approved restricted storage for real participants.

## 1. Start the local study app

In Terminal 1:

```sh
cd "/Users/nimnapathum/Documents/ChatGPT/Research/study-system"
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
export STUDY_DATA_DIR="/private/tmp/security-trust-rehearsal-01"
node --version
node app/server.mjs
```

`node --version` should say `v24.21.0`. Keep this terminal open. The app should report that it is listening on `http://127.0.0.1:4175`.

## 2. Create one synthetic participant and its workspace

In Terminal 2, set the **same** runtime and data directory:

```sh
cd "/Users/nimnapathum/Documents/ChatGPT/Research/study-system"
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
export STUDY_DATA_DIR="/private/tmp/security-trust-rehearsal-01"
node app/cli.mjs create P901
```

The output lists task 1 and task 2, including each project's `project_id`, `condition`, `checkpoint_order`, and hidden candidate-status assignment. Keep this terminal private. Use the **actual** project, condition and order printed for task 1 in the next command. For example, *only if* task 1 says project `A`, condition `acceleration`, order `Q1,Q2,F1,F2`:

```sh
node pilot/export_participant.mjs A acceleration /private/tmp/security-trust-P901-T1 Q1,Q2,F1,F2
node app/cli.mjs configure-capture P901-T1 /private/tmp/security-trust-P901-T1
```

The export destination must be a new directory. `configure-capture` writes `.agents/hooks.json`, `.study-capture/hook.mjs`, and `study/CAPTURE_CONFIG.json` into that workspace. It prints a confirmation. Repeat export and capture configuration for task 2 using its own assignment and a different new workspace.

## 3. Open the participant workspace in Antigravity

Sign in to Antigravity and open **only** `/private/tmp/security-trust-P901-T1` as the project/workspace. Do not open this research repository. In Antigravity's Customizations > Hooks view, check that the workspace hook named `study-observer` is loaded and enabled. The exact menu can vary by Antigravity surface; the [official hook documentation](https://www.antigravity.google/docs/hooks/) describes workspace hooks and the Hooks panel.

For a smoke test, ask the agent to inspect a source file and run `npm test` in the exported project. The hook should send `file_viewed` or `test_run` events to the local app. A prompt with no matching agent tool use may produce **no hook event**; that alone does not show the hook failed.

## 4. Check what was captured

In Terminal 2:

```sh
rg '"source":"antigravity-hook"' "$STUDY_DATA_DIR/raw/events.jsonl"
node app/cli.mjs audit
```

Look for an event containing `file_viewed` or `test_run`, a task ID, and a UTC timestamp. If there is no event, inspect the workspace's `.study-capture/hook-errors.log` or `hook-fallback.jsonl`. If the fallback file exists after a temporary collector failure, run:

```sh
node app/cli.mjs ingest-fallback P901-T1 /private/tmp/security-trust-P901-T1
```

The hook may record `transcript_path` in an event, but it **does not attach or parse the conversation**. Locate the actual Antigravity transcript and check it contains the visible prompt and response. For a consented session, attach a copy with `node app/cli.mjs attach P901-T1 agent-transcript PATH_TO_TRANSCRIPT`. Screen video is recorded separately and attached with `node app/cli.mjs attach P901-T1 video PATH_TO_VIDEO`. Use the [host rehearsal checklist](HOST_REHEARSAL_CHECKLIST.md) to confirm time alignment and privacy before any real participant.

## 5. Continue the controlled review workflow

The hook runs automatically during agent tool use. For the research checkpoint, the **researcher** runs `node app/cli.mjs prepare TASK_ID CHECKPOINT WORKSPACE` in Terminal 2 and gives the printed private review URL to the participant. The participant clicks **Show proposed change**, inspects it, records keep/reject plus security confidence, and may then repair it. Follow the [session runbook](SESSION_RUNBOOK.md) for all four checkpoints, finalization and the second task.

**Current limit:** this hook and app have passed synthetic tests, but the actual Antigravity desktop capture has not yet been verified on this Mac. A complete researcher-only rehearsal is required before interpreting any human pilot recording.
