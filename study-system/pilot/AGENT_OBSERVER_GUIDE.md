# Natural-task Antigravity conversation observer

Introduced in **natural-2026-10-13-r3**. The r3 ZIP contains `study/agent-observer.mjs`; r2 packages remain frozen and do not gain this script on redownload. Create a fresh synthetic participant for the observer rehearsal.

## Participant steps

From the extracted project terminal, replacing TASK-ID with the portal's exact task ID:

```sh
node study/agent-observer.mjs setup ../TASK-ID-agent
```

This adds `study-natural-observer` to workspace `.agents/hooks.json`, preserving other named hooks. It does not change global hooks. Confirm it is enabled in the agent panel's Customizations → Hooks view. If the running IDE does not recognise the new workspace configuration, use its normal reload/reopen procedure before coding and verify the hook in the UI.

Run this in that terminal and leave it open:

```sh
node study/agent-observer.mjs watch
```

Start a **fresh task conversation after setup**, start the code watcher in another terminal, and start screen recording before the first prompt. After the first response, check:

```sh
node study/agent-observer.mjs status
```

`transcript_records` should be above zero and `errors` should be empty. Read the captured sample and confirm it includes the actual prompt and response. Records can include system/tool material, so a nonzero record count alone does not prove prompt coverage. If no records arrive, tell the researcher, preserve the conversation through the approved fallback, and record the gap.

At completion stop editing and wait for the agent to be idle. Save final code and the rating as usual, then stop both watchers with Ctrl+C. Inspect `TASK-ID-agent/AGENT_CAPTURE_HEALTH.json`. Upload `TASK-ID-agent/AGENT_TRANSCRIPT.jsonl` in the portal's **Agent transcript** slot. Keep the whole agent folder until the researcher verifies it; it contains source transcript revisions and manifests for cross-checking.

## What the observer collects

- Raw records from the transcript paths supplied by hooks for fresh registered study conversations. Original fields, including any source timestamps, stay inside `raw`; the implementation does not guess an undocumented prompt schema.
- `observed_at_utc`: when the local observer collected a record or hook event. This is not automatically the user's submission/typing timestamp.
- Conversation/task/version IDs, byte offsets, source-line hashes and revision segment numbers.
- Session start, model invocation start/end, completed tool names, step/invocation numbers, model identifier and idle/stop signals where supplied.
- Counts, errors, rewrites and stopped/no-transcript/degraded status. Transcript record count is not user prompt count; model invocation count is not user prompt count either.

Antigravity documents camelCase metadata including `conversationId`, `workspacePaths` and `transcriptPath`, plus the listed lifecycle events. The observer uses those fields and emits empty JSON to preserve normal execution. [Official hooks documentation](https://www.antigravity.google/docs/hooks/).

## Scope, limits and integrity

The hook performs small metadata writes only. A separate watcher polls transcripts every second; there is no network call from the hook, no permission override and no message injection. It accepts one mounted study workspace and requires a fresh SessionStart. It reads only the reported UUID-specific transcript under the documented Antigravity data roots; it does not scan personal conversation history. Other/custom transcript locations fail with a recorded gap until individually tested and approved.

Complete JSONL lines are captured once by offset. Partial lines wait for completion; a valid final line without a newline is flushed on stop. Rewrites/truncations create separate segments and a warning. Raw source revisions remain in the local conversation folders. A 20 MiB per-source cap, 40 MiB aggregate export cap and ten-conversation cap limit volume; errors affect coverage but never instruct the agent to stop coding. Missing hooks/transcripts cannot report successful collection.

The portal checks task/version linkage and a final health footer/counts for observer exports, shows capture status and saves a SHA-256 receipt. The independent evidence audit also reads that footer. A receipt or healthy record count does not establish that all visible prompts, replies and tools are present. Screen recording and actual-host inspection remain necessary for provenance and verification coding. Raw transcripts may include internal/system/tool records and personal paths; do not treat them as content the participant saw or publish them unreviewed.

## Verification before participant pilots

Synthetic tests cover registration/scope rejection, preserving other hooks, inert output on error, partial-line handling, duplicate prevention, timestamp preservation, rewrites and missing-source status. They do not prove compatibility with the installed Antigravity version or Windows/Linux.

On each intended host, use a synthetic task to make two distinct prompts, get an agent edit and a test run, then stop. Confirm the exact prompts/replies in `raw`, hook timing against the video, source revisions/hashes, final health, portal receipt and researcher retrieval. Record IDE/model/OS versions, source schema and any missing events. Quantitative user-prompt timing requires identifying the actual source timestamp semantics in that rehearsal; use collection time as an interval/proxy only when appropriate. Do not claim precise acceptance latency or automatic mode recognition.
