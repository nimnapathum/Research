# Proposal collection record, one row per agent attempt

Copy this into restricted researcher data for every candidate-generation attempt, including rejected attempts. Do not expose this file or security labels in the participant workspace. Use the [provenance protocol](CANDIDATE_PROVENANCE.md).

| Field | Record |
| --- | --- |
| Attempt ID / checkpoint / date and UTC time |  |
| Source category: genuine unmodified / normalized / researcher constructed |  |
| Antigravity build, model, account and agent settings |  |
| Starter commit or package hash, task sheet and `AGENTS.md` version |  |
| Raw prompt, visible reply, transcript and tool log paths with hashes |  |
| Original changed files and diff path/hash |  |
| Researcher edits, if any, with exact before/after diff and reason |  |
| Normal feature tests and target attack oracle version/results |  |
| Candidate target status from reviewer 1 and reviewer 2 |  |
| Functionality, salience, code size and unrelated flaw review |  |
| Include/exclude decision and prespecified reason |  |
| Frozen participant patch ID and manifest version, if selected |  |

Do not discard an attempt merely because its security status is inconvenient. Record the collection denominator, eligibility criteria and any human edits. A balanced selected pool estimates response to the selected proposals; it does not estimate the coding agent's natural vulnerability rate.
