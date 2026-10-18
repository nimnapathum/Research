# Assigned task contrast for the main study

**Current proposed stimulus.** The feasibility pilot tests this same contrast before its main-study version is frozen. The condition is assigned; observed interaction mode is coded separately.

## What changed

Each participant still completes one Resource Catalogue and one Support Archive task. Each requires an exact SQL filter and a file read restricted to one folder. Project, order, and assigned condition are balanced across four sequences. The visible examples, required outcomes, public functional checks, hidden SQL-injection/path-traversal probes, time cap, coding agent, and right to inspect or reject code are the same across conditions.

| Assigned condition | Work presented to participant | Expected opportunity |
| --- | --- | --- |
| Acceleration encouragement | Ordinary Node.js database and file APIs; routes already wired; `study/IMPLEMENTATION_MAP.md` names the target functions and an implementation order. | Developer can formulate a concrete next step and ask the agent to carry it out. |
| Exploration encouragement | Routes wired through a small unfamiliar `recordPort`/`documentPort` interface; `study/INTERFACE_GUIDE.md` describes operations but gives no step-by-step implementation plan. | Developer may ask the agent to explain the interface or compare implementation approaches before choosing a step. |

The participant's orientation card remains outside the agent workspace. `AGENTS.md` contains the same security requirements in both packages. The project files are available for inspection; participants may use the agent however they choose. This is an encouragement, not a forced mode or scripted prompt sequence.

## Research basis and interpretation

[Barke et al., *Grounded Copilot*](https://cseweb.ucsd.edu/~npolikarpova/publications/oopsla23-copilot.pdf) distinguished acceleration from exploration by the purpose of interaction. Their study used familiar or clearly specified work alongside unfamiliar libraries and APIs to provide different opportunities for these interactions. The local interface and implementation map here are **our adaptations** for security-sensitive agent coding. We have not validated that they induce the intended modes.

The causal comparison is between **assigned work-structure packages**, not isolated mental states. The exploration package may add difficulty, reading time, or agent reliance independently of mode. Accordingly, the primary RQs should be presented as condition comparisons, with observed mode as a separately coded explanatory measure. Do not say that any security difference was caused solely by cognitive mode.

The unfamiliar API is deliberately thin. `recordPort.rows/row` forward SQL and optional bound values to the same SQLite engine; `documentPort` exposes root, canonical path, and UTF-8 reading but enforces no path policy. It does not implant a vulnerability or automatically prevent one. The same endpoints and independent security probes remain applicable. Actual agent-origin vulnerability exposure must still be established from transcript/video and code history.

## Pilot checks before freezing the main study

1. Confirm each of the four package combinations starts and the baseline endpoint passes. Confirm the target feature tests initially fail as expected, and independent security probes remain usable after implementation.
2. Ask neutral after-task and replay questions about whether the participant knew the next implementation step, sought alternatives, or needed to understand an unfamiliar interface. Code episodes from screen and agent evidence without looking at assignment, checking frequency, or security outcome.
3. Compare the proportion of approach-seeking versus step-execution episodes by condition. Record ambiguous and mixed episodes; a task label is not a mode label.
4. Compare task completion, active time, perceived difficulty, help requests, agent output exposure, and functional pass rates. If the interface produces a large difficulty imbalance or participants simply bypass it, revise and run another separate pilot before freezing. Do not tune to obtain a desired security result.
5. Freeze `orientation_revision` and `stimulus_revision` before the main sample. Exclude old rehearsal ZIPs and revision pilots from the main condition comparison. The portal caches issued ZIPs, so generate a new participant package to receive this contrast.

## Presentation answer

“*Grounded Copilot* observed two purposes for AI coding interaction: carrying out an already understood step and exploring how to proceed. We adapted that distinction into two task structures. One offers a known route through ordinary code; the other requires learning a small API. We hold the SQL and file-security targets constant and balance which project appears in each condition. We will verify through coded interaction and interviews that the intended mode difference actually occurred. The claim is about assigned task conditions and their observed interaction patterns, because interface familiarity can also affect difficulty.”
