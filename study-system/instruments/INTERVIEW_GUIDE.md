# Replay interview guide

**Timing:** 15–25 minutes after both tasks, before status reveal/debrief. Record with consent. Choose clips by a fixed rule before looking at participant confidence or oracle status where feasible: one SQL review, one path review, one later check/repair, and one episode whose observed behaviour appears different from its assigned condition.

Start each clip with: “What were you trying to accomplish at this moment?” Then use neutral prompts:

1. “Did you know the next implementation step, or were you finding out which approach to use? What tells you that?”
2. “What did you expect the agent to do, and what did you think it actually did?”
3. “What made you keep, reject or change that specific proposal?”
4. “What did you inspect or test before that decision? What did you do afterward?”
5. “You rated this exact proposal at **[recorded percentage]** for meeting **[stated security criterion]**. What evidence supported the estimate? What uncertainty remained?”
6. “Did the agent's explanation, the changed code, tests, documentation or your own knowledge matter most? Give a concrete example.”
7. “If you suspected a security issue, what was it? If nothing looked risky, what made it seem acceptable?”
8. “Did anything learned in task 1 change how you used or checked the agent in task 2?”

Do not say “Why did you miss the vulnerability?” before debrief. Do not teach an exploit during the interview. Ask about **this recorded episode**, not how the participant usually works. A replay explanation is evidence about intention but may be affected by hindsight; compare it with contemporaneous prompts, edits and checks. The mode prompts adapt [Barke et al.](https://arxiv.org/abs/2206.15000); replay-assisted interpretation has precedent in [Mozannar et al.](https://doi.org/10.1145/3613904.3641936). These exact questions are study-specific, not a published validated interview instrument.

After all data are recorded, debrief that some controlled proposals contained known weaknesses, explain candidate provenance honestly, and ask whether the participant noticed the study purpose or changed behaviour because of the repeated confidence form. Record that answer as a demand-effect note, not as an outcome correction.
