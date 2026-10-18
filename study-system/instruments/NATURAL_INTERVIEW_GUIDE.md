# Natural-study replay interview guide

**Proposed main-study interview guide; feasibility-pilot check, 18 October 2026.** Interview after both tasks and the after-both form, before revealing any hidden security assessment. Use the approved recording and retention procedure. These prompts are study-created adaptations, not a validated questionnaire.

## Select clips before discussing outcomes

For each task, mark the first material agent code change, the first observed participant check if one occurred, and one revision or uncertain-intent episode. If no check or revision occurred, record that absence and choose another material change using the same rule. Include a clip where the participant continued without an observed check when available. Save task ID, video time, transcript reference and code snapshot IDs. Do not select clips because the final code was secure or vulnerable.

## Ask in this order for each clip

1. **Goal and mode (RQ1):** “What were you trying to do at this point?” Then: “Did you already know the next implementation step, or were you working out how to proceed?” Ask for what in the code or agent reply shaped that view. Do not announce an acceleration/exploration label.
2. **Agent contribution and reliance (aim, RQ2):** “What did you expect the agent to change? What did you understand it had actually changed?” “What made you continue with, alter, or discard this change?” Distinguish an agent edit from an inspected, understood or explicitly endorsed change.
3. **Verification (RQ3):** “What did you inspect or run before continuing?” “What did you do afterward, and what result did you actually see?” If the trace shows an agent-run test, ask whether the participant saw its result. If no check is visible, ask neutrally whether anything else was checked.
4. **Security judgment (RQ1/RQ4):** “At the time, what did you think about the SQL/file-access requirement? What evidence supported that view?” After the spontaneous answer, show the participant their own final-snapshot rating and ask what they meant by that number. Do not reveal the reference verdict yet.
5. **Context and carryover:** “Did the task guidance match the way you actually worked?” “Did anything from the first task affect the second?” Ask whether the first rating or after-task questions changed their later approach.

Use follow-ups such as “What on the screen tells you that?” or “Can you point to the result?” Avoid “Why did you miss the vulnerability?” and any hint that a particular clip contains a flaw. Record the participant's explanation separately from the trace-coded event. A retrospective explanation can help interpret intent but can be altered by hindsight.

## Interview record

For every selected clip save the exact prompt asked, answer or refusal, video time, relevant prompt/change/check IDs, and whether the explanation agrees with the contemporaneous evidence. Record “not observed” separately from “not asked” and “unclear.” End with the institution-approved debrief, then ask whether the participant had guessed the security focus or changed behaviour because of repeated ratings.

[Barke et al.](https://arxiv.org/abs/2206.15000) supply the known-step versus approach-seeking distinction; [Mozannar et al.](https://arxiv.org/abs/2210.14306) used retrospective activity labels with programming traces; [Khalid et al.](https://arxiv.org/abs/2609.21020) provide precedent for interviewing developers about AI-code security evaluation. Our clip rule and exact prompts require pilot checks for clarity and recall.

The earlier [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) asks about controlled proposals and is historical for this protocol.
