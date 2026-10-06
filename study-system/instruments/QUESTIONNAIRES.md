# Participant questions and why each is here

**Status: pilot wording, not a validated trust or cognitive-state scale.** The machine-readable [forms.json](forms.json) is the version the local app renders. Consent and recruitment screening are separate institutional materials and must be approved before data collection. Avoid names, email addresses and personal repository details in these forms.

## Order

1. **Pre-task (11 items, after consent):** role, paid experience, JavaScript/SQL/file familiarity, security training, coding-agent experience, prior Antigravity use, usual review practice, and two short recognition questions.
2. **At each exposed proposal (4 fields):** provisional keep/reject, exact-proposal security probability from 0 to 100, optional reason, optional planned check. The form must display the actual diff and security criterion and store the same `proposal_sha256` for exposure, decision and confidence, including rejection.
3. **Immediately after each task (7 items):** known-next-step and option-seeking as manipulation checks, plus familiarity, difficulty, time pressure, reliance and one concrete example. These are descriptions of the task, not proof of cognitive mode.
4. **After both tasks (4 items):** carry-over, review changes, broad willingness to rely without checking, and optional notes. The broad trust item is contextual; it is not substituted for snapshot confidence in RQ1.
5. **Replay interview:** use [INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md) after both tasks and before revealing candidate status.

## Source and validity map

| Item group | Purpose and source | Interpretation limit |
| --- | --- | --- |
| Experience and practical screening | [Danilova et al.](https://arxiv.org/abs/2103.04429) show the value of screening programmer characteristics rather than relying only on a job label. | Our exact items are study-specific and need cognitive piloting. SQL/path recognition can prime participants, but every condition receives the same questions and task criteria. |
| Known-next-step / option-seeking | Adapted from [Barke et al.'s](https://arxiv.org/abs/2206.15000) descriptions of acceleration and exploration. | These are manipulation checks, not a validated scale or direct measurement of an internal state. Interview plus trace coding gives the observed-mode evidence. |
| Exact-code security confidence | [Perry et al.](https://arxiv.org/abs/2211.03622) motivate examining confidence alongside code security. The 0–100 chance makes an outcome-linked probability judgment possible. | It rates the frozen proposal's target security requirement, not general AI trust. Asking it may change subsequent verification; log timing and keep it identical across conditions. |
| Difficulty / time pressure | Potential confounds for orientation and checking. [NASA-TLX](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/) identifies temporal and mental demand as workload dimensions. | These single study-specific items are **not** the full NASA-TLX and must not be reported as a NASA-TLX score. |
| Reliance and broad trust | Descriptive context for interpretation and the interview. | Do not use these as a replacement for RQ1 calibration or infer that high reliance caused a vulnerability. |

The two baseline recognition answers should be scored only for sensitivity/descriptive analysis, not used to exclude a participant after assignment. If pilot participants find wording ambiguous or the questions make the later flaw obvious, revise the form **before** main recruitment and record the change. Preserve raw responses and form version for every session.

## Checkpoint form rule

The form must not show the researcher-only secure/vulnerable label. It must display the precise security requirement next to the exact proposed code. Record the first provisional decision before the probability rating, then permit editing, replacement and further verification. If the participant rejects the proposal, still collect the rating of **that same proposal**. If exposure or snapshot capture fails, mark the opportunity missing rather than inventing a rating.
