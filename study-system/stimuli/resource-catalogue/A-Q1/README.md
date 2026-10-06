# Q1 prototype proposal package — researcher only

**Do not copy this folder into the participant workspace.** It contains the candidate security labels and hidden attack test. The two patches are **constructed prototype stimuli** written while designing the task. They are not evidence that Antigravity generated either change. Before a main study, save raw prompts, responses, model/version/settings, original patch, any researcher edit, exact hashes, and two independent security reviews for the real selected candidate set.

Both prototypes implement exact topic filtering and should pass the participant-visible functional tests. The hidden manifest maps neutral candidate IDs C1/C2 to security status. The hidden oracle checks whether a crafted topic can return records outside the requested topic. Its attack uses only the synthetic local database.

The deliberate status pair validates the **measurement pipeline**: exposed proposal → security confidence → keep/reject → final repair/retention. It is not an estimate of how often a coding agent naturally produces insecure code. The final candidate set needs a salience/difficulty pilot, because this first vulnerable line may be too easy to notice.

## Reproduce the prototype checks

Run `node verify-candidates.mjs` from this folder. It copies the participant starter into temporary folders, applies each patch, runs baseline and Q1 functional tests, then runs the hidden oracle. It prints the test result for each candidate. Use the same Node 24 LTS build as the eventual study when freezing stimuli.

The source–sink rule follows [OWASP's SQL injection prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html): query text must be fixed before untrusted values are bound. Node's [SQLite API](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html) documents bound parameters for prepared statements. This dynamic oracle is accompanied by structural review; a passing attack probe alone does not prove all possible SQL inputs are safe.
