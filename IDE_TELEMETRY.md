# IDE extension, agent transcript, and evidence plan

**Status:** capture source and local collector built; exact-host feasibility remains untested. The user proposes Antigravity in agent mode and a companion IDE extension. No generic VS Code extension should be assumed able to read another vendor's private chat messages or internal reasoning. See [capture implementation](study-system/capture/README.md) and [artifact status](study-system/STATUS.md).

## 1. What to collect and why

| Evidence | Research use | Candidate source | Feasibility |
| --- | --- | --- | --- |
| Task/condition/project start and stop | Order, exposure time | Researcher launcher/extension | Buildable |
| Agent prompt and visible response | Intent, security questions, candidate provenance | Official Antigravity transcript/hook export if available; screen recording/manual export fallback | **Pilot-dependent** |
| Tool call and agent file edits | Agent action versus participant action | Official hooks/transcript, Git/file snapshots | Pilot-dependent actor attribution |
| Focused file/editor and changes | Inspection/edit sequence | VS Code-compatible extension APIs, snapshots | Likely if Antigravity exposes compatible APIs; test |
| Terminal command and output | Normal tests, attack tests, scanners | Shell wrapper/terminal instrumentation plus recording | Partial unless integrated; do not assume all terminal output available |
| Diff opened/viewed | Candidate visibility and generic review | Controlled suggestion panel/extension event, screen video | Buildable in controlled panel; native review UI may need video |
| Provisional keep/reject | Main workflow milestone | Researcher checkpoint UI | Buildable and authoritative |
| Confidence and reviewed proposal hash | RQ1 pairing | Researcher checkpoint UI and immutable patch/sandbox hash | Buildable |
| Final repository | RQ2 security and functionality | Git snapshot/archive | Buildable |
| Browser/docs use | Exploration context | Screen recording + optional browser log | Video only unless independently instrumented |
| Participant intention and mode | Observed mode code | Replay-cued interview + behavior | **Cannot be measured by extension alone** |

[Antigravity's official hooks documentation](https://www.antigravity.google/docs/hooks/) describes hook points and transcript paths, but it does not guarantee that every visible prompt/response, diff, or actor change can be exported in every release. The [VS Code extension API](https://code.visualstudio.com/api/references/vscode-api) describes editor/workspace events; it is not an entitlement to a third-party agent's full conversation. [CodeWatcher](https://arxiv.org/abs/2510.11536) illustrates useful IDE event logging and the limitations of inferring AI code origin from edits. Use explicit controlled candidate IDs and Git provenance rather than an AI-origin classifier.

## 2. Proposed minimal architecture

~~~text
Antigravity agent mode ---- official hooks/transcript export ----+
VS Code-compatible companion extension ---- event JSONL ------+--> session event merge
controlled checkpoint panel ---- decision/confidence/hash --------+         |
Git snapshots + oracle runner -------------------------------+      video alignment
consented screen recording -----------------------------------+         |
retrospective interview --------------------------------------+--> coded episodes/results
~~~

Use one monotonic local clock or synchronize each stream at a known marker. All logs carry participant_id, session_id, project, condition assignment, checkpoint_id, event_id, timestamp with timezone, source, and optional candidate_id/snapshot_hash. Save raw streams and a derived merged table; never overwrite raw data during coding.

## 3. Example event schema

~~~json
{
  "event_id": "P014-T2-E0182",
  "timestamp_utc": "2026-10-05T11:05:31.482Z",
  "participant_id": "P014",
  "task_id": "T2",
  "project": "B",
  "assigned_condition": "exploration",
  "checkpoint_id": "Q1",
  "source": "checkpoint-ui",
  "actor": "participant",
  "event_type": "provisional_keep",
  "candidate_id": "B-Q1-C1",
  "snapshot_hash": "sha256:...",
  "payload_ref": "encrypted-store/item-0182"
}
~~~

Use event types such as prompt_sent, response_visible, candidate_rendered, diff_opened, file_edit, test_run, scanner_run, provisional_keep, provisional_reject, confidence_recorded, snapshot_saved, task_submitted. A “response_visible” event needs proof the participant could see it; generation in a hidden transcript is not exposure.

## 4. Extension responsibilities

1. Observe workspace file save/change, editor focus and available terminal command hints in the participant repository. The source currently does **not** show the checkpoint form or recording indicator; the local app handles decisions and confidence.
2. Send permitted metadata to the local collector and write fallback JSONL if it is unavailable. The app, not the extension, saves immutable proposal/final snapshots and hashes.
3. Leave actor as `unknown` unless the host supplies reliable attribution. Do not infer that a file change came from the agent solely because it occurred near an agent request.
4. Use the app audit and separate researcher log for missing streams and host/version details. A full health dashboard and dropped-event/clock-drift report are not yet built; validate these needs in the host pilot.

Do not capture keystrokes globally, clipboard contents outside the repository, unrelated browser tabs, personal notifications, credentials, or hidden model reasoning. If prompt/response export is not available, use participant consented screen/video and manual transcript export. Mark reconstructed fields as reconstructed, with missingness.

## 5. Pilot acceptance tests

| Test | Pass condition |
| --- | --- |
| Agent prompt and response | At least visible user prompt and visible agent reply can be linked to checkpoint and timestamp, or documented fallback works |
| Agent edit provenance | Known controlled candidate and subsequent agent/participant edits distinguishable by stable IDs or video-assisted coding |
| Decision-to-snapshot | The same frozen proposed-change hash is linked to keep/reject and confidence, including rejected changes; hash reproduces later |
| Exposure | Candidate-visible event matches video on a sample of sessions |
| Security checks | A real attack test, agent security question, and scanner command each appear in at least one trustworthy stream |
| Stability | No lost checkpoint event over a full two-task dry run; log loss is counted |
| Update tolerance | Record Antigravity and extension versions; re-test after version changes |
| Privacy | No secrets or unrelated files in export; permissions and storage work |

If agent conversation and patch provenance cannot be captured reliably, **do not silently claim an objective prompt/response dataset**. Revise the instrument (for example, route proposals through a controlled panel), document the change, and pilot again. This determines whether Antigravity is suitable, not whether the RQs are valid.

## 6. Mode inference rule

Code an interval as acceleration when participant evidence indicates they already know the next implementation step and use the agent mainly to execute it faster; exploration when they seek options, explanations, or unfamiliar API knowledge because the path is uncertain. These definitions come from [Barke et al.](https://arxiv.org/abs/2206.15000). Prompt counts, acceptance latency, edit volume, and scrolling are **possible cues**, never sufficient labels. A five-minute interval can be mixed or unclear. Replay cues and the participant's own account can refine the label; document disagreements. [Mozannar et al.](https://doi.org/10.1145/3613904.3641936) and [Wu et al.](https://arxiv.org/abs/2604.16393) offer precedents for combining telemetry with retrospective labeling, but their state taxonomies are different.
