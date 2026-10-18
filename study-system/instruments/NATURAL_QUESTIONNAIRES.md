# Natural-study questions and measurement limits

**Proposed main-study instrument; feasibility-pilot wording check, 18 October 2026.** This describes the actual `natural-2026-10-13-r3` flow. The published portal schemas come from `research-portal/data/default-forms.json`; the API hides `sql_baseline` and `path_baseline` in natural mode. The exact published database form and approved ethics materials still need to be compared before a real participant session. These are study-created questions, not a validated trust or cognitive-state scale. Do not change a published form during a session.

| Time and source | What is asked | Why it is collected | Interpretation limit |
| --- | --- | --- | --- |
| Before tasks: portal form, **9 visible items** | Role, paid development years, JavaScript, SQL and file familiarity, security training, recent coding-agent use, Antigravity use, usual changed-line review | Define the early-career cohort and describe skill/experience alternatives to a trust explanation | Self-report does not establish objective security knowledge. The two direct SQL/path recognition items in the stored legacy schema are hidden to reduce priming. |
| At each frozen final snapshot: `study/rate.mjs` | Separate 0–100% chances that the **final SQL feature** and **final file-access feature** meet their stated security requirements; reasons; willingness to submit as-is; parts shaped by the agent; whether the agent was used to judge security | RQ1 probability–outcome comparison and contextual evidence of agent reliance | The probabilities concern final code, including participant edits. They are not probabilities that the agent itself is trustworthy or that each suggestion was safe. A forced numeric answer on an unfinished feature needs comprehension testing. |
| Immediately after each rating: portal after-task form, **7 items** | Known next step, option seeking, task familiarity, difficulty, time pressure, reliance on changes, optional example | Triangulate the intended task contrast and possible workload/familiarity explanations | The two mode items adapt Barke et al.'s descriptions; they are not a mode detector. Asking them after Task 1 may cue participants to the study contrast before Task 2. |
| After both tasks: portal form, **4 items** | Carryover, changed review approach, willingness to rely without an additional security check, optional notes | Document transfer and broad reliance context | One broad trust item is not a validated trust scale and cannot replace exact-code probabilities or observed decisions. |

## Why these questions are defensible

[Barke et al.](https://arxiv.org/abs/2206.15000) support asking whether a programmer already knew a next step or used an assistant to find an approach. [Perry et al.](https://arxiv.org/abs/2211.03622) show the value of measuring security belief alongside code security. [Khalid et al.](https://arxiv.org/abs/2609.21020) motivate asking how developers evaluated and edited AI code. [Lee and See](https://doi.org/10.1518/hfes.46.1.50.30392) distinguish trust and appropriate reliance in automation. The particular wording, timing and response scales here are original operational choices and need cognitive piloting.

## Comprehension and demand-effect check for the next pilot

1. Ask the participant, **after** their rating and before any researcher security feedback, what “meets its security requirement” meant for each feature. Do not teach the answer during the task. Record whether they rated an unfinished feature as a probability of being safe, a probability it would work, or something else.
2. After both tasks, ask whether the first after-task questions or the first security rating changed how they approached Task 2. Keep this response separate from the measured behaviour.
3. Compare each self-report with prompts, code history and replay evidence. A low security score with no check, or a high score on vulnerable code, is a case to understand rather than an automatic trust label.
4. If the questions are misunderstood or strongly cue Task 2, revise the instrument **between pilot versions**, check the approved materials, preserve old responses with their version, and exclude revision-stage pilots from the frozen main comparison.

The earlier [QUESTIONNAIRES.md](QUESTIONNAIRES.md) describes the controlled-checkpoint version and must not guide a natural-task session.
