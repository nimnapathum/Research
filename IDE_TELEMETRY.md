# IDE extension, agent transcript, and evidence plan

**Status:** the current standalone Antigravity route uses a task ZIP, workspace hooks, a local Node client, explicit transcript upload and separate screen recording. The VS Code-compatible companion extension remains source only; it is not installed in standalone Antigravity. The synthetic two-task route passed, but exact-host prompt/transcript/video completeness remains untested. No generic extension should be assumed able to read another vendor's private chat messages or internal reasoning. See [capture implementation](study-system/capture/README.md), [cross-platform guide](study-system/pilot/CROSS_PLATFORM_CAPTURE.md), and [artifact status](study-system/STATUS.md).

## 1. What to collect and why

| Evidence | Research use | Candidate source | Feasibility |
| --- | --- | --- | --- |
| Task/condition/project start and stop | Order, exposure time | Portal and checkpoint events | Implemented for workflow milestones; active coding time needs video/pause coding |
| Agent prompt and visible response | Intent, security questions, candidate provenance | Official Antigravity transcript explicitly uploaded after task; screen recording | **Pilot-dependent**; hooks provide transcript path, not content |
| Tool call and agent file edits | Agent action versus participant action | Official hooks/transcript, Git/file snapshots | Pilot-dependent actor attribution |
| Focused file/editor and changes | Inspection/edit sequence | VS Code-compatible extension APIs, snapshots | Likely if Antigravity exposes compatible APIs; test |
| Terminal command and output | Normal tests, attack tests, scanners | Shell wrapper/terminal instrumentation plus recording | Partial unless integrated; do not assume all terminal output available |
| Diff opened/viewed | Candidate visibility and generic review | Controlled suggestion panel/extension event, screen video | Buildable in controlled panel; native review UI may need video |
| Provisional keep/reject | Main workflow milestone | Checkpoint UI with local-client hash check | Implemented; actual visibility needs video |
| Confidence and reviewed proposal hash | RQ1 pairing | Checkpoint UI and immutable proposal hash | Implemented |
| Final repository | RQ2 security and functionality | Client-uploaded final snapshot | Implemented for bounded study workspace |
| Browser/docs use | Exploration context | Screen recording + optional browser log | Video only unless independently instrumented |
| Participant intention and mode | Observed mode code | Replay-cued interview + behavior | **Cannot be measured by extension alone** |

[Antigravity's official hooks documentation](https://www.antigravity.google/docs/hooks/) describes hook points and transcript paths, but it does not guarantee that every visible prompt/response, diff, or actor change can be exported in every release. The [VS Code extension API](https://code.visualstudio.com/api/references/vscode-api) describes editor/workspace events; it is not an entitlement to a third-party agent's full conversation. [CodeWatcher](https://arxiv.org/abs/2510.11536) illustrates useful IDE event logging and the limitations of inferring AI code origin from edits. Use explicit controlled candidate IDs and Git provenance rather than an AI-origin classifier.

## 2. Implemented core and optional streams

~~~text
Antigravity workspace hooks --> selected invocation/tool metadata --+
official transcript --> explicit file upload -----------------------+--> private checkpoint database
task-local Node client --> snapshots, hashes, fallback rows --------+
checkpoint page --> exposure, decision, confidence -----------------+
optional pointer recorder --> five-second aggregates --------------+
screen video + replay interview --> separate evidence/coding -------> RQ analysis
~~~

The client records source timestamps and the collector records receipt timestamps, but different participant computers still need a visible common clock marker and human alignment check. The measurement audit shows capture lag, source counts, checkpoint timing and missing attachments. Save raw streams and derived coding separately; never overwrite raw data during coding. The optional pointer stream is global while running and does not identify IDE focus.

## 3. Conceptual event example

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

This example illustrates the intended join, **not** the exact current event JSON schema. The implemented event types are in [the event contract](study-system/contracts/event.schema.json). A “response visible” code needs proof the participant could see it; generation in a hidden transcript is not exposure. The client-confirmed `candidate_exposed` event proves application in the workspace; video must establish meaningful visibility.

## 4. Capture responsibilities and limits

1. The Antigravity hook records model invocation start/end and selected agent tool use. The client transfers fallback rows, workspace hashes and review/final snapshots. The checkpoint app saves decisions and confidence. The explicit upload command copies only a named transcript file; video is attached separately.
2. The optional VS Code-compatible extension can observe editor/workspace events if that host is selected and validated. It is not part of the standalone Antigravity participant setup and cannot be promised as a required stream.
3. Leave file-change actor as `unknown` unless the host supplies reliable attribution. Do not infer that a change came from the agent solely because it occurred near an agent request.
4. Use `audit-measurements`, the researcher host log and video to check missing streams, version changes and clock alignment. A source count or attached file hash checks availability, not content completeness.

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
