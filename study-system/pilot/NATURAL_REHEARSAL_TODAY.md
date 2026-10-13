> Historical r1 CLI rehearsal guide. The r2 kit moves the encouragement card outside the agent workspace and updates task identity. Use [NATURAL_SESSION_RUNBOOK.md](NATURAL_SESSION_RUNBOOK.md) and [the local portal guide](../../research-portal/LOCAL_NATURAL_REHEARSAL.md) for the current steps.

# Natural-workflow rehearsal and pilot gate — 13 October 2026

This is a **researcher-operated rehearsal kit** for the revised [method](../../NATURAL_WORKFLOW_METHOD.md). It bypasses the current portal's controlled proposal gate. The portal, its participant ZIP, its after-task form and its analysis export still implement the older protocol. Do not give those to a natural-workflow participant. A real participant pilot requires the institution-approved information/consent and data-handling procedure to cover this revised flow; the approved documents are not present here for comparison.

## Your own rehearsal today

1. Use the pinned Node 24 runtime. From the research root, create a fresh synthetic pair. The sequence rotates project, condition and order; use 0, 1, 2, 3 across four pilot people rather than choosing after seeing their work. **Replace `P901` and its directory in every example with a new unused synthetic ID and path**; the `P901` smoke-test directory already exists on this Mac and the script intentionally refuses to overwrite it.

   ```sh
   /opt/homebrew/opt/node@24/bin/node study-system/pilot/natural_kit.mjs create P901 /private/tmp/natural-rehearsal-P901 0
   ```

   The command prints two workspace paths and writes `RESEARCHER_ALLOCATION.json` outside them. On another OS, use that OS's Node 24 command. Do not reuse the `P901` example for a real person.

2. Open **only** the printed Task 1 workspace in Antigravity. Read `study/START_HERE.md`, `study/TASK.md`, and `study/WORK_ORIENTATION.md`. The two requested features are Q1 (SQL) and F1 (file access), in any order. The agent may edit immediately. Run `npm test` as a baseline; Q1/F1 tests are expected to fail until the features are implemented. Repeat with the other workspace for Task 2.
3. In another terminal, start local code-snapshot capture **before the first prompt**. Give every task a new output directory outside the workspace:

   ```sh
   /opt/homebrew/opt/node@24/bin/node study-system/pilot/natural_kit.mjs watch /private/tmp/natural-rehearsal-P901/P901-T1 /private/tmp/natural-rehearsal-P901/P901-T1-capture
   ```

   This saves an initial snapshot and a new snapshot whenever files change, checking every two seconds. It does not record agent chat, screen actions, terminal commands, or intent. Start a separate screen recording and later save the readable Antigravity transcript. If the watcher reports errors or misses quick transient edits, mark the gap. Stop it with Ctrl+C **after** the final snapshot and rating.
4. At a natural finishing point, say “I would submit this task.” Make one final immutable copy with `snapshot` and write down its printed hash:

   ```sh
   /opt/homebrew/opt/node@24/bin/node study-system/pilot/natural_kit.mjs snapshot /private/tmp/natural-rehearsal-P901/P901-T1 /private/tmp/natural-rehearsal-P901/P901-T1-final
   ```

   Before running the hidden security oracle or seeing researcher feedback, record the confidence form below **for that exact snapshot**. Save the form alongside the capture, not inside the workspace.
5. Complete Task 2 in the other condition. Do not inspect hidden security results between tasks. After both tasks, replay a few actual agent/code moments and answer the interview prompts below. Then examine the code with normal tests, target attack tests and blinded review; the old constructed-candidate `verify_all.mjs` is **not** an oracle for free-task final code.

## Minimal forms for the rehearsal

Record participant ID, task ID, project, assigned condition, task start/end, OS, Antigravity/model version, Node version, recording/transcript filenames, watcher output directory, final snapshot hash, interruptions and missing streams. Do not put a name or email in these files.

**Before coding:** role, paid-development years, JavaScript/SQL/file-API familiarity, secure-coding training, agent-use frequency, prior Antigravity use. Avoid the current portal's two explicit SQL/path recognition questions immediately before the task; they directly cue the mechanisms under study. Measure knowledge later or with a separate neutral screen if ethics and analysis require it.

**Immediately after each task, before feedback:**

- “For the exact code you just submitted, what is the chance (0–100%) that the SQL filtering feature meets its stated security requirement?” Why?
- “For the exact code you just submitted, what is the chance (0–100%) that the file-access feature meets its stated security requirement?” Why?
- “Would you submit this code as it stands?” Yes / no / unsure.
- “Which parts did the agent materially shape?” Brief description or “none.”
- “Did you rely on the agent when judging the security of either feature?” Brief explanation or “no.”
- “How often did you know your next step before asking the agent?” 1–7. “How often did you use it to compare approaches or learn unfamiliar code?” 1–7. Perceived difficulty and time pressure: 1–7 each.

**After both tasks, before debrief:** Ask whether the first task changed the second, then replay two to four selected moments. For each: “What were you trying to do here?”, “What did you believe the agent had changed?”, “When did you decide to keep working with that change?”, “What did you check before and afterward?”, “Did the assigned orientation describe how you actually worked?” Do not disclose the oracle or suggest that a particular line is vulnerable before these answers.

## Same-day go/no-go record

Mark each item **pass, fail, or not checked**, with a timestamp/evidence path. Do not infer a pass from an automated test.

| Item | Evidence required |
| --- | --- |
| Natural interaction | Agent can inspect, plan, edit, test and repair from the first prompt; neither project instructs a reveal/keep gate. |
| Two tasks and order | Allocation shows one project/condition per task and the opposite condition in task two; participant sees only the active workspace. |
| Starter and task tests | Baseline runs on each host; Q1 and F1 are understandable and feasible within the chosen cap. |
| Capture | Video actually shows prompt, response, file change and checks; readable transcript is saved; watcher has initial, changed and final snapshots with timestamps. |
| Final rating | Hash is recorded; both security estimates occur before feedback/hidden tests; form is understandable. |
| Privacy/isolation | Antigravity cannot read the research repository, hidden stimuli/oracles, app database or unrelated personal files; notifications and credentials stay out of video. |
| Ethics | Approved information/consent covers the revised no-gate workflow, screen/agent recording, code snapshots, interview, storage and withdrawal; get amendment if required. |
| Analysis feasibility | At least one agent-origin edit can be linked across video/transcript/diff; ambiguous human acceptance is coded `unclear`, not invented. |

**Decision rule:** A self-rehearsal can proceed with synthetic data today. Invite a real participant under the revised method only after every core row passes on that participant's OS/tool setup and the ethics row is confirmed from the approved documents. If the old portal is used instead, label that session a **controlled-checkpoint mechanics pilot**, not a natural-workflow pilot. Do not combine their outcome rows.
