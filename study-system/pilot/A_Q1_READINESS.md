# A-Q1 prototype readiness and validity checks

**Historical first-slice record.** The local app, both full task projects, all eight checkpoints and the two-task synthetic dry run were built after this note. Its pending implementation steps below are superseded by the current [artifact status](../STATUS.md) and [session runbook](SESSION_RUNBOOK.md). No participant has completed the protocol.

**Status: engineering prototype, 6 October 2026. No participant has performed this task.** This record distinguishes a working software slice from a validated research stimulus.

## What is currently verified

| Check | Result | Evidence |
| --- | --- | --- |
| Starter runs without external packages | Pass on Node 25.1.0 | `npm test` in the participant project: 1 baseline test passed. |
| Both candidate patches apply to the same starter | Pass | `node verify-candidates.mjs` applies each patch in a disposable copy. |
| Both candidate versions meet normal Q1 behaviour | Pass | Q1 functional tests and baseline test pass for both constructed candidates. |
| Attack distinguishes target vulnerability | Pass | Hidden oracle: crafted topic broadens the vulnerable candidate to all 20 rows; the secure one returns no match. |
| Source–sink review | Design review complete, independent review pending | One prototype puts request data inside SQL text; the other binds it as a value. |
| Participant-only export | File inventory passed | Exported an acceleration copy to a new temporary folder; it contained the starter, task/card and agent guidance, with no candidate manifest or hidden oracle. Antigravity workspace access is still untested. |

This is **engineering test evidence**, not a preliminary finding about developer trust, cognition, or Antigravity output. The hidden oracle establishes only the intended target weakness for these prototypes. Its secure result is complemented by source review and should later be checked by independent reviewers.

## Why this slice fits the original research idea

1. **Security-specific trust calibration:** The same frozen proposal can have a binary security adjudication and a 0–100% participant confidence rating. The candidate pair supplies secure and vulnerable judgments, which are both needed to examine alignment rather than only acceptance.
2. **Reliance and final outcome:** Keep/reject is provisional. Final repository security is assessed after the participant can question, test, repair, or replace the code. This separates initial confidence from final vulnerability retention.
3. **Acceleration versus exploration:** The two Q1 condition cards give the same code location, functional goal, security criterion, tools and freedom to reject. They vary the encouraged purpose of agent interaction. The card alone does not prove the participant entered that mode; code mode from interaction plus replay interview.
4. **Junior developer interpretation:** Short code and an explicit criterion make the task accessible, while baseline SQL knowledge must still be measured. A missed flaw is not automatically evidence of trusting the agent; knowledge, attention and understanding remain alternative explanations.
5. **Controlled exposure:** The prototype pair demonstrates equal functional opportunity. Main-study eligibility requires actual visible exposure, an exact proposal hash, and provenance. A patch merely existing in this folder is not an exposure.

## Before this can be used as a participant checkpoint

- [ ] Run on the **exact Node 24.21.0 LTS** and Antigravity setup chosen for the study; record versions and account/model settings. The current check used Node 25.1.0, whose SQLite support emits an experimental warning.
- [ ] Generate a real candidate pool with the chosen agent under the same participant-visible task and agent guidance. Save raw prompt, visible response, tool trace, original diff and model/settings. Preserve any researcher edits separately. If using constructed stimuli, label them honestly in the protocol and debrief.
- [ ] Check whether that genuine pool contains both eligible statuses **without changing the security guidance between candidates**. If it does not, retain the guidance and classify any deliberately edited patch as a constructed stimulus; do not report a forced flaw as a naturally generated agent error.
- [ ] Have two reviewers, blinded to condition and participant outcomes, confirm target status and absence of unrelated serious flaws.
- [ ] Compare secure and vulnerable proposals for code length, formatting, explanation quality, obviousness and normal-function behaviour. The current vulnerable SQL proposal may be too easy to spot; assess this in a small pilot without tuning after main outcomes.
- [ ] Implement a review presentation that freezes a reproducible proposal package. Confirm the participant **actually sees** the proposal and that decision and confidence refer to that hash even after rejection.
- [ ] Distribute only the participant project as a separate workspace. Check that Antigravity cannot access this repository's sibling `stimuli/` folder, hidden oracle, or security labels from the participant setup.
- [ ] Pilot both condition cards with early-career developers. Ask whether they knew the next step, sought alternative approaches, and felt different task difficulty or time pressure. Observe actual interactions; revise if the cards change difficulty more than orientation or fail to separate modes.
- [ ] Check that a reasonable Q1 episode fits the time budget without making the security check trivial or rushed.
- [ ] Obtain ethics approval and consent before recording any participant screen, agent transcript or interview.

## Manual dry-run record to fill later

| Item | Record |
| --- | --- |
| Antigravity and Node versions | Pending |
| Agent model/settings and account type | Pending |
| Condition card and participant background | Pending |
| Proposal source and exact snapshot hash | Pending |
| Was candidate visibly exposed? Evidence time | Pending |
| Completion time and functional success | Pending |
| Provisional decision and confidence linked to hash | Pending |
| Observed mode evidence and interview explanation | Pending |
| Checks before/after decision | Pending |
| Final feature security/functionality | Pending |
| Confusions, prompt effects and changes needed | Pending |

**Sources for implementation, not claims of study validity:** [Antigravity rules](https://www.antigravity.google/docs/rules/) support the participant project's `AGENTS.md`; [Node SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html) documents prepared statements and bound values; [OWASP SQL injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) grounds the target source–sink rule. The assigned-versus-observed mode distinction and analysis limits are in [METHODOLOGY.md](../../METHODOLOGY.md) and [MEASURES_AND_EVALUATION.md](../../MEASURES_AND_EVALUATION.md).

For an engineering dry run, create a clean standalone participant folder with `node export_q1_participant.mjs acceleration /private/tmp/q1-dry-run-a` (or `exploration` and another new folder). Open **only that folder** in Antigravity. This export does not include the candidate patches or hidden oracle. The researcher must still present a candidate through a controlled, honestly labeled review workflow and record its exposure; the export does not provide that workflow.
