# Current capture capabilities

Protocol natural-2026-10-13-r3 packages a code watcher, rating script and separate [Antigravity conversation observer](study-system/pilot/AGENT_OBSERVER_GUIDE.md). Previously issued packages remain frozen; create a fresh assignment to use the new instrument.

`study/capture.mjs watch` records initial/changed source snapshots every two seconds, with stable task ID and hashes. It excludes hidden/sensitive files, symlinks and unsupported formats and limits volume. `snapshot` freezes the assessed final copy; `study/rate.mjs` links security beliefs to that hash. Pause edits and wait for agent idle before final capture.

`study/agent-observer.mjs setup` adds observational workspace hooks while preserving other hooks. Its separate watcher polls only fresh registered study-conversation transcript paths. It preserves raw records/source timestamps and adds explicitly labelled collection times, conversation/task/version IDs, offsets, model/tool/invocation metadata and health. Hook outputs do not inject messages or override permissions. Transcript schema and real host coverage remain to be verified; raw record count is not prompt count.

Upload its `AGENT_TRANSCRIPT.jsonl` in the existing transcript slot. The portal checks observer task/version/footer/counts, displays capture status and records a hash. Keep the full agent folder's raw revisions/manifests for review. Manual export is a documented fallback with explicit coverage gaps. Video remains separate and necessary to establish visible inspection and human behaviour.

Neither watcher collects gaze, pointer speed, typing cadence, unsaved editor buffers, or a conscious human acceptance click. Event/source times can support analysis only with known semantics and clock alignment. Cognitive mode, human verification/provenance and final security still require contextual coding and blinded review. See [data coverage](study-system/pilot/NATURAL_DATA_COVERAGE.md), [the codebook](study-system/instruments/NATURAL_CODEBOOK.md) and [the audit](RESEARCH_AUDIT.md).

The documented interfaces motivate implementation, not a claim that every Antigravity version/OS supplies complete records. Exact-host synthetic rehearsal precedes real collection. Prior r2 documentation is preserved in [the archive](archive/2026-10-13-natural-r2/IDE_TELEMETRY.md).
