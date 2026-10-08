# Cross-platform participant capture: pilot instructions

The password portal serves a task-specific recorded ZIP. Participants may use macOS, Windows, or Linux if Antigravity, Node.js 24+, Git, and the study service are reachable. The researcher hosts the portal and checkpoint service; a participant on another computer needs the approved **HTTPS** URLs, not the researcher's `127.0.0.1` address. The current local restart script is only for the researcher's Mac and is not a remote deployment.

## Required on every participant computer

1. Extract the recorded-task ZIP and open **only that extracted task folder** in Antigravity. Check `study/PACKAGE_INFO.json` shows the assigned project/condition. Never open the research repository or hidden stimuli.
2. Confirm `node --version` is 24 or later and `git --version` works. In a project terminal run `node study/setup.mjs` and confirm the `study-observer` hook appears in Antigravity. The setup script checks Node and Git before writing the hook.
3. In another project terminal run `node study/client.mjs` and keep it open. The portal should show **Study client connected**. Ask the agent to inspect a file or run a test; the portal should show **Agent hook observed**. The hook now records selected tool events and agent invocation start/end metadata, but no complete prompts or replies.
4. Start the approved screen recording, with the cursor and task app visible. Preserve the official Antigravity transcript. At the end, run `node study/upload-transcript.mjs PATH_TO_TRANSCRIPT` with researcher guidance if the approved protocol permits the upload. The script uploads only that named file and checks its SHA-256 hash. The researcher attaches the screen video separately and runs the measurement audit. Record a visible clock/session marker for alignment.
5. Complete all four controlled reviews and final submission in the checkpoint page, then return to the password portal for the after-task questions. Repeat in the other task's fresh workspace.

### Windows

Use PowerShell in the extracted project. Commands are `node study/setup.mjs` and `node study/client.mjs`. Git for Windows must be on `PATH`. If optional pointer capture is approved, Python 3 may be invoked with `py -3`:

```text
py -3 -m pip install -r study/POINTER_REQUIREMENTS.txt
py -3 study/pointer_recorder.py --probe
py -3 study/pointer_recorder.py --run
```

### macOS

Use Terminal or the Antigravity project terminal. For optional pointer capture, use `python3` if `python` is unavailable. macOS may request input-monitoring or accessibility permission for the Python/terminal process; `--probe` now fails clearly without it. This sandbox's native probe failed on that permission, so macOS pointer capture is not yet validated. Do not request keyboard capture.

### Linux

Use the same Node and Git commands. Optional `pynput` pointer capture requires a usable X11 session. **Wayland is explicitly unsupported** by this recorder because its XWayland fallback may see only some applications. If the probe fails, continue the task with screen recording and mark the pointer stream unavailable; do not record it as zero mouse activity. A participant may still complete all primary RQs without pointer telemetry.

## Optional pointer recording

Only start the recorder if the final approved participant information covers this extra stream. In the project folder:

```text
python -m pip install -r study/POINTER_REQUIREMENTS.txt
python study/pointer_recorder.py --probe
python study/pointer_recorder.py --run
```

The recorder saves one **aggregate** window about every five seconds in `.study-capture/pointer-summary.jsonl`: pointer-move count, distance, median/p90 speed, click count and scroll count. It saves no raw coordinates, key contents or clipboard. Its mouse listener is global while running, so pause it with Ctrl+C for breaks and stop it after the task. The study client uploads these rows to the private checkpoint database, and the portal shows **Optional pointer summaries received** after the first successful transfer. A disconnected client leaves rows locally for later `ingest-fallback` on a supervised machine. Record mouse versus trackpad, display resolution/scale and device settings in the researcher log. Do not compare raw pixel speed across different setups as a standardized cognitive-mode score.

## Researcher checks and recovery

With `STUDY_DATA_DIR` pointing at the checkpoint data directory, run:

```text
node study-system/app/cli.mjs audit
node study-system/app/cli.mjs audit-measurements measurement-audit.json
```

The second report gives source counts, missing video/transcript, all checkpoint exposure/decision states, exposure-to-first-decision milliseconds, optional pointer coverage, capture-to-collector lag and evidence hashes. With `STUDY_ADMIN_PASSWORD` set, the same overview is at the checkpoint service's `/admin/audit` and full JSON at `/admin/audit.json`. This report checks *availability*, not whether video clearly shows the participant reading the proposal or whether the transcript contains every visible prompt. Check those manually against the screen recording.

If the client loses connectivity, leave it running to retry. Hook and pointer summaries stored in `.study-capture/` are sent later when it reconnects. For a supervised workspace still available to the researcher, `node study-system/app/cli.mjs ingest-fallback TASK_ID WORKSPACE` imports unsent rows idempotently. Preserve the raw files and document any gap.

## Host validation matrix

Before enrolling a participant on each OS/Antigravity version combination, perform one clean researcher rehearsal: ZIP extraction; Node/Git setup; hook invocation and tool event; one prompt and visible reply in the official transcript; one controlled reveal and first decision; final snapshot; screen recording; optional pointer probe, movement and server transfer; audit; recovery from a deliberate client interruption. Record actual pass/fail and versions in [the host checklist](HOST_REHEARSAL_CHECKLIST.md). The existing synthetic two-task test validates the software handoff, **not** native Antigravity behavior or cross-OS permissions.

The optional pointer backend is [`pynput` 1.8.2](https://pypi.org/project/pynput/), whose [platform notes](https://pynput.readthedocs.io/en/latest/limitations.html) describe macOS, Windows and Linux/X11 limitations. [Antigravity hooks](https://www.antigravity.google/docs/hooks/) document invocation and tool hooks. Neither source guarantees the particular participant computer will capture complete data.
