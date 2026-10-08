# Security trust in agent-assisted coding: living research plan

**Status:** working protocol and runnable engineering prototype, 8 October 2026. The aim and four research questions below are the current version supplied by the researcher. The researcher reports ethics approval; reconcile the approved materials with the current recording, proposal-source and optional pointer procedures. Task stimuli, instrument wording, and analysis choices still require a human pilot and protocol freeze.

## Aim

> Examine whether developers working with a coding agent in acceleration and exploration episodes differ in their security judgments, reliance on generated changes, verification, and Trust calibration on security.

For use in formal writing: **Examine how acceleration-oriented and exploration-oriented agent-assisted coding episodes relate to developers' security judgments, reliance, verification, and the alignment of security confidence with assessed code security.** This is an editorial restatement, not a replacement for the supplied aim.

## Current research questions

1. **RQ1:** How does alignment between developers’ security confidence and assessed code security differ between acceleration-oriented and exploration-oriented conditions? How does this relate to observed interaction mode?
2. **RQ2:** How do the two conditions affect whether security vulnerabilities remain in the final submitted code?
3. **RQ3:** How do security verification behaviors before and after provisional retention of agent-generated code differ between acceleration-encouragement and exploration-encouragement conditions, and how are these behaviors associated with removal or retention of known exposed vulnerabilities in the final submission?
4. **RQ4:** Do these patterns differ between SQL injection and path traversal opportunities?

RQ2's intended evidence is: exposed vulnerabilities, participant decisions, repairs, and final code security. See [RQ.md](RQ.md) for the exact wording and justification.

## Read this set in order

The [LaTeX progress report](Research_Progress_Report.tex) and [eight-page PDF](output/pdf/Research_Progress_Report.pdf) are earlier progress snapshots. Use the current Markdown protocol and [design traceability audit](DESIGN_TRACEABILITY.md) for the latest implementation limits. No pilot or participant results exist yet.

For current remaining work, see the [artifact status](study-system/STATUS.md) and [pilot readiness audit](study-system/pilot/READINESS_AUDIT.md). Two participant projects, eight checkpoint sheets, 16 constructed prototype candidates, forms, the password portal and instrumented ZIP, Antigravity hook/client, and blinded analysis scripts now exist. Synthetic two-task portal and analysis dry runs passed. This is software verification, not a participant or Antigravity pilot.

| File | Purpose |
| --- | --- |
| [RQ.md](RQ.md) | Aim, exact RQs, comparison with the February proposal, defenses, claims and boundaries |
| [METHODOLOGY.md](METHODOLOGY.md) | Participant study and runnable session sequence |
| [TASK_DESIGN.md](TASK_DESIGN.md) | Two-task design and controlled security opportunities |
| [tasks/README.md](tasks/README.md) | Required files for each task package and status of task artifacts |
| [tasks/RESOURCE_CATALOGUE.md](tasks/RESOURCE_CATALOGUE.md) | Example project A, used under either condition |
| [tasks/SUPPORT_ARCHIVE.md](tasks/SUPPORT_ARCHIVE.md) | Example project B, used under either condition |
| [MEASURES_AND_EVALUATION.md](MEASURES_AND_EVALUATION.md) | Operational definitions, security oracle, analysis and reporting |
| [IDE_TELEMETRY.md](IDE_TELEMETRY.md) | Extension, agent transcript, provenance, and logging feasibility |
| [INTERVIEW_AND_FORMS.md](INTERVIEW_AND_FORMS.md) | Screening, snapshot confidence forms, retrospective interview |
| [REFERENCES.md](REFERENCES.md) | Evidence ledger with direct links and limits of each source |
| [DESIGN_TRACEABILITY.md](DESIGN_TRACEABILITY.md) | Current code-to-RQ and source-to-decision validity audit |
| [LITERATURE_MAP.md](LITERATURE_MAP.md) | How the 45 attached PDFs relate to this narrowed study |
| [DECISIONS.md](DECISIONS.md) | Design choices, source support, pilot gates, and unresolved choices |

## What is fixed; what is still a study decision

**Fixed by the researcher's latest request:** four RQs above; security rather than generic correctness; two agent-assisted coding tasks per participant; acceleration and exploration encouragement; SQL injection and path traversal; final code security and confidence; junior developers/final-year computing students as target population; screen recording and interview.

**Built as an engineering prototype, not yet experimentally validated:** JavaScript/Node with built-in SQLite; four short feature checkpoints per task; two vulnerable and two secure constructed proposals per task; one SQL and one path opportunity of each security status; a provisional keep/reject decision and exact-snapshot confidence rating at each checkpoint; a participant portal, task ZIP, Antigravity workspace hook and local client; optional cross-platform pointer summaries; and a blinded security-adjudication queue. The controlled proposals are not unmodified Antigravity outputs. The VS Code companion extension remains source only and is not installed in the standalone desktop route.

**Decide after pilot:** exact agent/version and account policy, whether the IDE exposes every necessary event, final package difficulty/time, wording of encouragement, whether to allow a genuinely free agent after a controlled suggestion, sample size from precision/power simulation, exact primary confidence summary, and any optional workspace-instruction experiment.

## Important boundaries

- The assigned condition is a manipulation. **Observed mode is a coded description**, not a mind state inferred from click speed. A mismatch between assignment and observed mode is useful evidence, not automatically a failed participant.
- A vulnerable opportunity is counted only when the participant was meaningfully exposed to an eligible **supplied** vulnerable candidate. A task file containing a vulnerable example is insufficient. A future claim of agent-generated code requires documented provenance or an explicit constructed-stimulus framing.
- Acceptance is provisional. Final retention is evaluated from the final submitted repository, whether the candidate was kept unchanged, repaired, replaced, or rejected.
- Security confidence refers to a saved code snapshot and stated security criteria. A generic “How much do you trust AI?” score answers a different question.
- The study can support comparisons within the chosen tasks and cohort. It cannot establish that the two CWEs are the most common LLM failures or generalize directly to senior engineers or production systems.

## History and editing rule

The February 2026 [original proposal](</Users/nimnapathum/Trust Calibration in Developer-LLM + SE/LLM4SE/LLM4SE/22000526_Research_Proposal.pdf>) and the existing root working drafts are historical inputs. They contain earlier RQs and design choices. **RQ.md is the canonical RQ record.** Before changing an RQ, update its wording, reason, dependent measures, and task implications together. Date each substantive decision in the table below.

| Date | Decision | Reason/status |
| --- | --- | --- |
| 2026-10-05 | Freeze the supplied aim and RQ1–RQ4 as current wording | User's latest instruction |
| 2026-10-05 | Move insecure workspace instructions out of the core protocol | Not present in finalized RQs; optional extension requires separate randomization and analysis |
| 2026-10-05 | Recommend balanced known secure and vulnerable agent suggestions | Gives a denominator for trust alignment and equal exposure across conditions; pilot required |
| 2026-10-08 | Audit portal, capture and analysis against RQs and sources | Fixed project labels and assignment defaults; documented which methods are sourced and which require original pilot validation |

## Next build gates

1. Supervisor reviews RQ wording and whether RQ1's two clauses are one coherent primary question.
2. Use the checkpoint CLI's balanced allocation before entering each portal assignment. Collect genuine agent proposal provenance, or disclose constructed stimuli accurately.
3. Reconcile the reported ethics approval with final materials. Test the full workflow on each intended Antigravity/OS host; document hook, transcript, video, optional pointer and clock alignment. Then pilot 4–6 target-population participants and inspect difficulty, condition separation, exposure, confidence wording and interview recall.
4. Independently review and freeze the final candidate set, protocol, analysis plan, and materials **before** the main sample. Record deviations and missing data.
