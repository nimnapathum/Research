# Aim and research questions

Current operational protocol: natural-2026-10-13-r3. The exact researcher-supplied RQs are preserved below. Their natural-task interpretation and the proposed RQ3 refinement are explicit; the supervisor-facing main-study wording must be frozen before main recruitment. Historical controlled-candidate defences are retained in [the archive](archive/2026-10-13-controlled/RQ.md).

## Aim

> Examine whether developers working with a coding agent in acceleration and exploration episodes differ in their security judgments, reliance on generated changes, verification, and Trust calibration on security.

The current assigned comparison is a **work-structure condition**: a human orientation card plus a familiar, mapped implementation route or a small unfamiliar code interface. This strengthens the intended contrast but cannot separate the effect of the card from interface familiarity or identify a pure cognitive-mode effect. Observed mode is coded implementation intent, not an automatically detected mental state. Security confidence is a probability about the exact final feature. Trust is interpreted with stated reliance, inspection and interview evidence; final confidence alone is not agent trust. See [the task contrast](TASK_CONTRAST_DESIGN.md).

## Researcher-supplied wording

**RQ1:** How does alignment between developers’ security confidence and assessed code security differ between acceleration-oriented and exploration-oriented conditions? How does this relate to observed interaction mode?

**RQ2:** How do the two conditions affect whether security vulnerabilities remain in the final submitted code?

*(Exposed vulnerabilities, participant decisions, repairs, and final code security.)*

**RQ3:** How do security verification behaviors before and after provisional retention of agent-generated code differ between acceleration-encouragement and exploration-encouragement conditions, and how are these behaviors associated with removal or retention of known exposed vulnerabilities in the final submission?

**RQ4:** Do these patterns differ between SQL injection and path traversal opportunities?

## Natural-task interpretation and defence

| RQ | Answering evidence | Defensible interpretation and boundary |
| --- | --- | --- |
| 1 | Two final-feature probabilities per task, exact hashes, independently adjudicated security labels with participant ratings masked from reviewers, observed intent episodes. | Compare probability accuracy and security-confidence distributions. A Brier score is not pure calibration, four judgments do not establish an individual trust trait, and source code may reveal the assigned condition to reviewers. |
| 2 | Every final assigned feature, functionality and target-security assessment; actual agent-origin change histories where observable. | Final vulnerabilities need not be agent-caused. Report all tasks; survival among confirmed insecure exposures is a secondary conditional description. |
| 3 | Video/transcript/code sequence around application, inspection, continuation, checks and repairs. | Natural editing has no guaranteed keep click or insecure exposure. Use uncertainty and separate application from human endorsement. Verification–outcome association is not its causal effect. |
| 4 | Class-specific outcomes/behaviour within the same two conditions. | SQL/path have distinct mechanisms and are feasible to test. With 30 people and sparse events, interaction claims are exploratory. |

**Recommended RQ3 wording for the natural study:** How do security verification behaviours before and after observed integration of agent-generated changes differ between the assigned acceleration-oriented and exploration-oriented task conditions, and how are they associated with target vulnerabilities in the final code?

Known exposed vulnerabilities can still be studied where actually confirmed. This refinement removes the implication that every participant receives one. The pilot may establish that retention is too sparse to estimate; preserve that outcome rather than forcing flaws into natural agent output. A controlled review study is an alternative procedure with its own question and dataset.

## Why the aim remains worthwhile

The verified literature motivates three components: interaction purpose, security beliefs/outcomes, and contextual verification evidence. Barke's acceleration/exploration distinction is observational; our work-structure condition is a new manipulation inspired by its familiar and unfamiliar tasks. Perry motivates collecting code security and beliefs together. Khalid's security evaluation work limits the novelty claim: this study adds a paired condition comparison and temporal natural-agent evidence if executed successfully. Mozannar supports retrospective activity interpretation, not our exact mode or trust labels. Source links and limitations are in [REFERENCES.md](REFERENCES.md).

The contribution is a reproducible task/assessment and evidence-linking method plus bounded empirical estimates for early-career JavaScript developers under these settings. It does not prove that acceleration is always unsafe, that juniors are careless, or that SQL/path are the most frequent LLM flaws. Explicit security requirements mean this is security-salient coding. A source supporting one component does not validate the complete method.

## Changes from the first proposal

The initial February proposal covered generic correctness/trust and proposed automatic mode inference from IDE events. The current work narrows the outcome to security, fixes SQL/path classes, uses a defined early-career cohort, and treats mode as coded intent. The earlier controlled checkpoint design guaranteed candidate exposure but constrained natural coding. The current protocol removes those gates and rates final features; it trades guaranteed insecure exposure for freer interaction.

RQ1 is the primary probability-alignment estimate, RQ2 is a key secondary final-security outcome, RQ3 explains verification sequences, and RQ4 is exploratory. The [analysis plan](NATURAL_ANALYSIS_PLAN.md) defines units, denominators, missingness and sparse-event limits. Keep assignment comparisons separate from observational mode associations, preserve negative/inconclusive findings, and freeze the final questions and analysis before main data.
