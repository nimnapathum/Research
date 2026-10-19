# Assigned task contrast for the study

**Local proposed stimulus, 19 October 2026:** `2026-10-19-abstract-brief-v2`. This change is not deployed to the hosted portal. The feasibility pilot must test it before a main-study version is frozen. Previously issued ZIPs remain unchanged. Assignment is the experimental condition; observed interaction mode is coded separately.

## What participants receive

Each person still completes one Resource Catalogue and one Support Archive task. Each project needs a database filter and a restricted text-file view. Project, condition and task order are balanced across four sequences. The underlying endpoints, source opportunities, visible test commands, hidden security probes, time allowance, coding agent, and freedom to inspect or reject changes are the same. The **amount of information given in the brief differs**.

| Assigned condition | Participant brief and code route | Intended opportunity |
| --- | --- | --- |
| Acceleration encouragement | Concrete endpoint examples, exact response cases, and `study/IMPLEMENTATION_MAP.md` naming the target functions and a route through familiar Node.js APIs. | Form a next implementation step quickly and ask the agent to execute it. |
| Exploration encouragement | A short product goal: find records by topic/status and read related text. No endpoint examples, edge-case list, function names, or step sequence in the brief. A small unfamiliar `recordPort`/`documentPort` interface and `study/INTERFACE_GUIDE.md` must be investigated. | Use the agent and source to work out the route and compare possible approaches. |

Both briefs state the same **SQL-input and file-root safety boundaries**. The exploration participant may inspect all source and visible tests, so details are discoverable; withholding examples is an initial information difference, not a restriction on investigation. The participant's work-orientation card remains outside the agent workspace. `AGENTS.md` carries the same security boundaries in both packages. No participant is told to hurry, skip checking, or use a scripted prompt.

## Basis and limits

[Barke et al., *Grounded Copilot*](https://cseweb.ucsd.edu/~npolikarpova/publications/oopsla23-copilot.pdf) observed acceleration when a programmer knows the next step and uses the assistant to proceed faster, and exploration when the next step is uncertain and the assistant helps investigate options. They did **not** validate these task briefs or show that brief abstraction by itself produces a cognitive mode. The cards, map, local interface and brief contrast are this study's adaptations.

The causal comparison is between **assigned packages**, not pure mental states. Brief specificity, implementation-map availability and interface familiarity change together. Exploration may take longer, produce different functionality, or increase agent reliance for reasons other than cognitive mode. Pilot the brief for comprehension and feasibility; code observed mode from prompt intent, video and interview independently of assignment, checking frequency and outcome. Do not call a security difference a mode effect if the intended interaction contrast does not appear.

The exploration brief omits some functional edge cases that the acceleration brief names. The independent assessor still evaluates the same underlying target features, but must report functionality and assessability by condition. A missing or differently interpreted feature is **not** a secure implementation or evidence of trust. Report completion, functional pass rates, ambiguity questions, time and difficulty alongside security results. If the brief causes substantial non-completion or ambiguous target implementations, revise it in a separate pilot before freezing the main study. Do not tune it after viewing security outcomes.

The local interface is deliberately thin. `recordPort.rows/row` forwards SQL and optional bound values to SQLite; `documentPort` exposes root, canonical path and UTF-8 reading but applies no path policy. It does not implant a vulnerability. Actual agent-origin vulnerability exposure must be established from transcript/video and code history; final security requires independent probes and review.

## Pilot and version rules

1. Generate and inspect all four new package combinations. Confirm baseline behaviour, expected initially failing feature tests, and independent security probes against secure and vulnerable reference implementations.
2. Check that participants understand the exploration goal without researcher implementation hints. Record requests for clarification, alternative approaches, completion, active time, difficulty and functional results by condition and project.
3. Independently code approach-seeking versus known-step execution episodes. Preserve mixed and unclear episodes. A task label is never the observed-mode label.
4. Compare agent-output exposure and assessable SQL/path opportunities. Keep non-completion and missing exposure in the denominators; do not reinterpret them as secure or vulnerable code.
5. Freeze task, orientation and stimulus versions before the main sample. Exclude old rehearsal ZIPs and revision pilots from the frozen comparison.

## Short defence

“We use the acceleration/exploration distinction from *Grounded Copilot* as a hypothesis about interaction purpose. One package gives a concrete implementation route; the other presents a high-level goal that requires investigating the code and a small unfamiliar interface. Both keep the SQL and file safety boundaries, tools and assessment targets. This is our experimental adaptation, so we will verify actual interaction modes and check for difficulty and completion differences in the pilot. Our causal claim is about the assigned packages.”
