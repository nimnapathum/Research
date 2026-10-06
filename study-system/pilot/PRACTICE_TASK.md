# Neutral practice, before measured tasks

**Purpose:** teach the agent-mode workflow and the review controls without mentioning SQL injection or path traversal. This is training, not a scored checkpoint. Use the same practice for every participant.

1. Open a throwaway JavaScript file containing `export function label(name) { return name; }`. Ask the coding agent to explain what it does **without editing the file**. The facilitator checks that the participant can find the agent's reply and the file in the IDE.
2. Open `http://127.0.0.1:4175/practice`. The requirement is to trim spaces at both ends of a displayed name. Click **Show proposed change**. The practice patch appears on the page only; explain that a real checkpoint also changes the IDE workspace at reveal.
3. Inspect the proposal. Choose provisional keep/reject and give a 0–100% estimate that it meets the stated requirement. Click **Record practice answer**. The page does not save these answers.
4. Ask the participant to explain, in their own words, the difference between the first decision and the final submitted code. Correct only procedural misunderstanding. Do not coach on the measured security weaknesses.

Stop practice after roughly five minutes. Record in the session log whether the participant could operate the agent, reveal control and rating. If not, repeat the same neutral explanation once and record that extra help. [Barke](../../REFERENCES.md) motivates observing interaction purpose; [Tang](../../REFERENCES.md) and [Mozannar](../../REFERENCES.md) support capturing verification/replay, but this exact practice exercise is a local design choice to check in the pilot.
