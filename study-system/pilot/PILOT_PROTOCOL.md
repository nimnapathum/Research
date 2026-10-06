# Human pilot and freeze plan — draft

**Purpose:** find protocol failures before testing RQ1–RQ4. The software dry run is not a human pilot. The researcher reports institutional ethics approval; confirm that the approved consent, proposal-source disclosure, recording and retention wording covers the final procedure before recruiting or recording anyone.

## Pilot sequence

1. **Host rehearsal:** On the exact study computer, complete the [checklist](HOST_REHEARSAL_CHECKLIST.md) with the chosen Antigravity build, declared Node runtime, hook/optional companion extension, screen recorder and app. Check prompt/reply visibility, tool metadata, clock markers, no leakage of `stimuli/`, reveal-time patch application, rejected-proposal restoration, final snapshots and fallback import. Log host/model versions and every missing stream.
2. **Wording interviews:** Ask 2–3 target-population developers to explain the condition cards, confidence question, SQL/path security criteria and “provisional” decision in their own words. Revise ambiguous wording before the main pilot. Do not treat these explanations as RQ outcomes.
3. **Feasibility pilot:** Recruit using the [eligibility draft](ELIGIBILITY_AND_RECRUITMENT.md), give everyone the same [neutral practice](PRACTICE_TASK.md), then run four consented junior developers or final-year CS/IT students through both tasks. The first four assignments cover each sequence, candidate-status profile and order rotation once. Add two more if needed to investigate failures, or eight for two balanced groups of four. Log start/finish time, decided and skipped checkpoints, actual proposal visibility, form completion, agent/extension/video/transcript capture, early edits, interruptions and interview recall. Do not include these participants in the main analysis if materials change afterward.
4. **Security and coding review:** Have two independent reviewers classify the exact code proposals and final features without condition or confidence. Have two behavioural coders independently code a sample of episodes using the codebook. Document disagreement, ambiguous code and the final resolution rule.
5. **Freeze:** Revise tasks, proposal set, forms and instructions in a dated change log. Freeze the final protocol, sample target, RQ1 confidence summary, RQ2 denominator, RQ3 coding rules, RQ4 exploratory comparison, missing-data handling and software/agent versions before main recruitment.

## What to inspect after each pilot session

| Question | Evidence | Decision if it fails |
| --- | --- | --- |
| Were all eight assigned proposals meaningfully visible? | Reveal events plus selected video frames; patch hash matches rating. | Fix presentation and repeat pilot; do not count unexposed items. |
| Could participants use the agent while respecting the controlled proposal sequence? | Agent transcript, code snapshots, early-edit log, participant account. | Simplify workflow or revise the design claim. |
| Did condition cards change purpose of interaction? | Known-next-step/option-seeking responses, prompts and video-coded episodes. | Refine cards or report only the assigned task-context contrast; never infer mode from assignment alone. |
| Were task difficulty and time pressure similar enough? | Completion time, post-task ratings, interview, functional success. | Match information load and feature complexity; re-pilot. |
| Were SQL and path opportunities recognized as plausible code? | Reviewers' salience notes and participant recall before debrief. | Replace conspicuous or implausible proposals, then re-adjudicate. |
| Can a junior participant's miss be distinguished from lack of knowledge? | Baseline recognition, experience, think-aloud/replay account, verification trace. | Clarify interpretation and report knowledge-stratified sensitivity; do not label every miss overtrust. |
| Did data streams and privacy controls work? | `audit`, raw log/video/transcript alignment, consent and storage check. | Repair capture; mark missingness explicitly; repeat host rehearsal. |

The pilot should produce a feasibility report with counts and examples, not claims that acceleration or exploration caused vulnerability retention. A final sample size requires a stated precision or power target and observed pilot variance; four to eight pilots are not enough to establish RQ effects.
