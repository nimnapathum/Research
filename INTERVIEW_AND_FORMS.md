# Participant forms, interview, and coding guide

**Status:** draft instruments; pilot for clarity, order effects, and time. Interview questions are **adapted from concepts and methods** in cited studies, not claimed as verbatim validated questionnaire items.

## 1. Before coding: screening form

Record age eligibility per ethics policy, degree/role, years of paid development, JavaScript/Node familiarity, SQL and filesystem API experience, prior security training, prior use of coding agents, Antigravity familiarity, and frequency of reviewing AI code. Use 5-point anchored familiarity scales plus one practical baseline item per target class (identify the risk in a small query/path snippet). Do not use these items to shame participants or exclude them after assignment. [Danilova et al.](https://arxiv.org/abs/2103.04429) supports screening actual programmer characteristics; [Kaur et al.](https://www.usenix.org/conference/usenixsecurity22/presentation/kaur) supports clear recruitment reporting.

## 2. One short form at each checkpoint

Freeze and show the checkpoint's **exact proposed-change snapshot** or its diff. The candidate remains unchanged through the first decision/rating, even if the participant rejects it. Then ask:

1. “Will you provisionally keep or reject this agent change?” (Record the decision before confidence; a later reversal is a new event. The rated snapshot remains the reviewed proposal.)
2. “For this exact proposed code, what is the chance, from 0% to 100%, that it meets the stated security requirement for this feature?” (Number in 10% increments or continuous slider; pilot which is understood better.)
3. “What led to that estimate?” (one sentence, optional but encouraged).
4. “What, if anything, will you check before final submission?” (optional prospective plan; distinguish plan from observed action).

Display the security requirement immediately next to this form (e.g., “User input must not change SQL structure” or “Requested paths cannot leave the permitted attachment folder”). Do **not** reveal candidate truth. A 0–100 estimate is a probability judgment about code security, not a generic trust-in-agent Likert item. At task end ask a separate overall 1–7 reliance/trust item only as contextual descriptive data; it is not the RQ1 outcome.

The act of asking may itself increase security attention. It occurs in both conditions, and the pilot should check whether it triggers a sudden rise in security checks. The study estimates behavior under this measurement procedure.

## 3. After each task: 2-minute manipulation check

- “During this task, how often did you know the next implementation step before asking the agent?” (1 never to 7 almost always)
- “How often did you use the agent to learn possible approaches or an unfamiliar API?” (1 never to 7 almost always)
- “How familiar was the code/task before you started?” (1–7)
- “How difficult was the task?” (1–7)
- “How much time pressure did you feel?” (1–7)
- “Which parts felt like execution of a plan, and which felt like exploration?” (short text)

These help check whether assigned encouragement changed perceived orientation. They do not validate an unobservable “mind state” on their own. Barke's [grounded categories](https://arxiv.org/abs/2206.15000) motivate wording; the exact items require pilot cognitive interviewing.

## 4. Retrospective interview, 15–25 minutes

Ask about a few **preselected video moments**: one candidate from each class, a surprising check/repair, and one contrasting confidence judgment. Select clips before revealing the adjudicated security labels to the interviewer when feasible. Start open-ended, then probe.

1. “What were you trying to do at this moment, and what did you expect the agent to do?” *(intention; Barke; Wu)*
2. “Did you already know how you wanted to implement this change, or were you finding out how?” *(acceleration/exploration definition; Barke)*
3. “What made you keep, reject, or change this suggestion at that moment?” *(selection/reliance; Khalid; Wang)*
4. “Which part of this code did you believe was most likely to have a security problem, if any?” *(security judgment; Khalid; Perry)*
5. “What did you check before that decision? What did you check afterward? What result changed your view?” *(verification timing; Tang; Khalid)*
6. “You gave this snapshot X% security confidence. What evidence supported that number? What uncertainty remained?” *(confidence-to-snapshot link; Perry/Lee framework)*
7. “Did the agent's explanation, tests, source comments, or your own knowledge matter most here?” *(contextual trust; Wang; Brown)*
8. “Did anything from the first task affect how you approached the second?” *(carry-over)*
9. “If you had another ten minutes, what would you inspect or test?” *(unperformed checks, not scored as performed)*

Keep neutral language: do not ask “Why did you miss this vulnerability?” before debrief. Use “What, if anything, looked risky?” Ask for concrete evidence rather than an idealized description of how the participant usually works. After data capture, debrief on controlled suggestions and the two weakness classes. [Mozannar et al.](https://doi.org/10.1145/3613904.3641936) and [Wu et al.](https://arxiv.org/abs/2604.16393) support replay-assisted retrospective interpretation; [Khalid et al.](https://arxiv.org/abs/2609.21020) is directly relevant to the evaluation-stage interview.

## 5. Coding worksheet

For every meaningful episode, record start/end video time, candidate/snapshot ID, assigned condition, current task, participant-stated goal, observable action, referenced code sink, security-specific verification code (see [MEASURES_AND_EVALUATION.md](MEASURES_AND_EVALUATION.md)), result, provisional decision, and evidence quote/clip pointer. Separately code observed mode:

- **Acceleration:** person knew next step and used agent primarily to implement/complete it.
- **Exploration:** person sought possible approaches, explanations, or unfamiliar API knowledge to choose next step.
- **Mixed:** both are present in the interval.
- **Unclear:** evidence insufficient.

An interval's **mode** and **security vigilance** are separate codes. Security checks can happen in either mode. Two coders should code independent subsets without seeing security outcome/confidence when practical; keep adjudication notes and cite concrete trace evidence. Do not convert interview self-labels directly into ground truth.
