# Controlled proposal provenance — collection protocol

The current 16 patches are **researcher-constructed prototypes** for testing the study software. Their manifests mark `main_study_eligible: false`. If the study describes the reviewed changes as *agent-generated*, build and freeze a genuine candidate pool first. If a balanced genuine pool cannot be obtained, retain the controlled design but describe the selected changes as constructed proposals shown during agent-assisted work.

## Collecting genuine candidates

1. Fix the participant-visible starter commit, task sheet, neutral `AGENTS.md`, Antigravity build, model, account settings, temperature/agent settings if visible, and a standard prompt family. Use the same guidance for all candidates at a checkpoint; never weaken security instructions only for a desired vulnerable output.
2. In a clean copy of the participant project, ask the agent to implement exactly one checkpoint. Save the raw user prompt, visible agent response, tool transcript, timestamps, original changed files and a before/after diff **before** inspecting security status. Repeat a prespecified number of independent runs or until the collection budget is exhausted; retain unsuccessful runs in the inventory.
3. Run the normal feature tests and target attack oracle. Record outcomes without editing the original. Exclude candidates that fail ordinary functionality or have unrelated severe flaws; log why.
4. Have two reviewers independently inspect target source-to-sink reachability. Resolve disagreements before participant allocation. Compare secure and vulnerable candidates for code size, style, comments, obviousness and task difficulty. Do not rewrite one status to make it appear naturally generated.
5. Freeze one secure and one vulnerable candidate for each checkpoint if such a matched pool exists. Save an immutable manifest with agent/model/settings, raw prompt/reply paths, file hashes, oracle version, reviewer decisions, any exact researcher edits and display method. Mark each selected item as `genuine_unmodified`, `normalized` or `constructed`.
6. Confirm the one-file patch can be applied by the checkpoint app and that the participant-visible review accurately represents the original code. If a genuine candidate spans multiple files, extend and revalidate the app before use; the current prototype accepts exactly one declared target file.

The controlled balance is an **experimental exposure schedule**, not a measurement of how often the agent makes these errors. Report the collection denominator and selection process so readers can judge how representative the selected code is.
