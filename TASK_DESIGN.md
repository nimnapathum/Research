# Current natural-task design

Protocol natural-2026-10-13-r3. Both projects are small JavaScript/Node HTTP services using built-in SQLite and synthetic files. The first timing pilot uses the same provisional 30-minute coding cap for both tasks. Pilot comprehension, workload and completion before freezing the main cap.

| Project | SQL feature | File feature |
| --- | --- | --- |
| A: Resource catalogue | Exact resource filtering by topic; sorted results; empty/unknown value returns no matches. | Read a named UTF-8 preview within `previews/`; missing file returns not found. |
| B: Support archive | Exact ticket filtering by status; parallel behaviour. | Read a named UTF-8 attachment within `attachments/`; parallel behaviour. |

Each feature has a common explicit security requirement: request values remain SQL data, and reads stay inside the approved folder including link escape. Ordinary functional tests are visible; researcher security assessment is withheld until both tasks and interview finish. Participants may write/run their own attack tests or tools. Q2/F2 stubs remain outside scope; assess only the two requested features.

Each project can run under either encouragement. Balance A-acceleration/B-exploration, A-exploration/B-acceleration, B-acceleration/A-exploration and B-exploration/A-acceleration across people. Use the allocator and preserve actual assignments; do not choose an easier project after seeing performance.

The portal asks acceleration participants to carry out a next step they choose; exploration participants use the agent to work out an approach. Both have the same tools, requirements and permission to change approach. The card is delivered to the participant outside the agent workspace. This is an encouragement manipulation, with intent-coded episodes as its check. Avoid assigning one task permanently as easy/acceleration and the other hard/exploration, because difficulty would then explain the difference.

The projects' parallel structure supports comparability but may produce learning between tasks. Use fresh agent conversations, no researcher feedback between tasks, order balancing, a carryover question and first-task sensitivity reporting. Findings concern explicit security requirements, not security attention in a setting without any security cue.

There are no supplied patches, forced reveals or keep/reject clicks in the natural package. Actual agent-origin weaknesses may be absent. Code final security for all assigned features; count survival only among confirmed insecure exposures. Hidden insecure markdown is not part of this core protocol. Adding it would manipulate agent behaviour and require a separately specified treatment, provenance and analysis.

Source rationale and limits are in [RESEARCH_AUDIT.md](RESEARCH_AUDIT.md). Seriousness and testability justify SQL/path selection; CWE rankings do not establish that these are the most common agent flaws. The old candidate matrix is retained in [the archived task design](archive/2026-10-13-controlled/TASK_DESIGN.md).
