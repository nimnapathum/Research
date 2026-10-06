# Study event contract (version 1.0.0)

This is the shared event contract for the built app and capture adapters. Every normalized collector event is intended to follow [event.schema.json](event.schema.json). This is a transport format, not a claim that every event is automatically observable or that the current app performs full JSON Schema validation. Keep unmodified source logs too; normalized events point back to them through `evidence_ref`.

## Identifiers and joins

| Field | Example | Rule |
| --- | --- | --- |
| `participant_id` | `P014` | Pseudonym only; names/contact details live in a separate restricted file. |
| `session_id` | `S014` | One research visit; two task instances can share it. |
| `task_id` | `P014-T1` | One participant's first or second task. |
| `project_id` | `A` | A resource catalogue, B support archive. |
| `condition` | `acceleration` | **Assigned** condition; observed mode is coded separately. |
| `checkpoint_id` | `Q1` | Q1/Q2 SQL or F1/F2 file path in that project. |
| `candidate_id` | `A-Q1-C1` | Neutral stable stimulus identity from researcher-only manifest; never encode security status in a participant-visible ID. |
| `proposal_sha256` | `sha256:` plus 64 hex characters | Hash of the frozen review package, including all relevant changed files and manifest. Decision and confidence point to this exact package. |
| `event_id` | `P014-T1-E0182` | Unique across all normalized events. |
| `sequence` | `182` | Increasing within each task/source stream; gaps are reported. |

The **researcher-only candidate manifest** stores target weakness class, expected status, provenance and oracle results. Do not put vulnerable/secure labels in participant telemetry or a participant-readable task folder.

## Event meanings

| Event | When it is emitted | Authority |
| --- | --- | --- |
| `candidate_exposed` | The exact proposal or diff became visible to the participant, with video/panel evidence. Generation alone is insufficient. | Controlled checkpoint panel plus audit. |
| `provisional_decision` | Participant first chose keep or reject for the frozen proposal. Later reversals become new coded events. | Checkpoint form. |
| `confidence_recorded` | Participant gave a 0–100% security probability for that same proposal. | Checkpoint form. |
| `final_snapshot_saved` | Whole task repository was frozen for final adjudication. | Snapshotter. |
| `prompt_sent`, `response_visible`, `diff_opened`, `file_viewed`, `file_saved`, `test_run`, `scanner_run` | Useful behavioral evidence only when actually observed by the named source. | Hook, extension, transcript import, or video coding. |
| `logging_gap` | An expected stream/event was missing or capture failed. | Collector/health monitor. |

`source` says where a record came from; `actor` says who performed the action. Use `unknown` if actor attribution is not supported. `evidence_ref` points to a local raw log, screenshot/video time, or immutable snapshot. `timestamp_utc` supports cross-stream alignment; `elapsed_ms` is measured from that task's start where available. Never treat event counts or timing as a direct measure of cognitive mode.

## Required invariants

1. `candidate_exposed`, `provisional_decision` and `confidence_recorded` all require the same `candidate_id`, `checkpoint_id` and `proposal_sha256` for one review episode.
2. A rejected proposal still receives a confidence rating and remains in the opportunity table if actually exposed.
3. The final repository hash is a separate field in `final_snapshot_saved`; it must not replace the frozen proposal hash.
4. An unexposed proposal is excluded from the exposed-vulnerability denominator and recorded as a capture/stimulus failure.
5. Store raw streams unchanged; corrections or manual video codes append new derived records with evidence references.
6. The central app must detect duplicate IDs, missing required links and missing streams before exporting analysis rows.

This schema is intentionally small. Candidate provenance, responses to questionnaires, video files and security adjudication have separate schemas in later build steps.

[example-review.jsonl](example-review.jsonl) is a fictional four-event review sequence for testing parsers and joins. Its hashes represent example strings, not code packages or participant data.
