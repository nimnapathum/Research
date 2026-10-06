# Stimulus and oracle manifest

**Purpose:** lock exactly what the agent produced, what the researcher selected/changed, what the participant saw, and how security status was established. This is a template for main-study stimuli. Sixteen researcher-constructed patches now exist across the two projects and eight checkpoints under [study-system/stimuli](../study-system/stimuli/). They passed functional and target-security oracle checks but are not authentic Antigravity candidate records or independently adjudicated stimuli.

## Candidate inventory required before recruitment

For each A/B × Q1/Q2/F1/F2 candidate, create a record with:

| Field | Example or rule |
| --- | --- |
| candidate_id | A-Q1-C1 or B-F1-C2; neutral codes do not disclose status |
| project/checkpoint/CWE | A/Q1/CWE-89; B/F1/CWE-22 |
| intended status | Vulnerable or secure **for stated target requirement** |
| generated_by | Agent product/model/version, date, settings |
| raw_prompt_response_path | Immutable source files; include tool calls if exported |
| researcher_edit | None, or exact diff and reason; never hide constructed flaws |
| starter_commit + patch_hash | Reproducible code version |
| lines_changed | Helps match visible size/salience |
| normal_test_result | Must pass intended function |
| security_oracle_result | Must agree with status |
| independent_review | Two reviewers and adjudication |
| display_method | Native agent suggestion, controlled panel, or labeled patch |
| pilot_exposure_rate | Fraction actually visible; should be near 100% for controlled opportunities |

If the agent is allowed to modify files before showing a candidate, snapshot them and identify the **visible** state. The manifest must distinguish an authentic raw generated candidate from a researcher-edited one. If the controlled panel cannot reproduce the agent's original message, state that limitation in the study report.

## Per-participant exposure table

Create one row per candidate opportunity with participant ID, condition, project/order, checkpoint, candidate ID, displayed timestamp, exposure evidence pointer, provisional decision/time, snapshot hash/confidence, final feature path, final target security, functionality, extra vulnerabilities, and missingness reason. The denominator for retention is **all actually exposed vulnerable opportunities**. Missing final features are a distinct reported outcome.

## Oracle decision examples

| Target | Positive vulnerable case | Negative secure case | Manual review question |
| --- | --- | --- | --- |
| CWE-89 SQL injection | Crafted input broadens the result set or reaches an interpolated SQL structure | Same input is bound as a parameter and affects only value matching | Can request input change SQL syntax at this sink? |
| CWE-22 path traversal | Traversal/encoded traversal/symlink reveals outside marker | Containment check on a canonical path prevents escape and valid file still opens | Can request or stored path identify a file beyond the root? |

Do not treat all vulnerability absence as successful task completion; function failures are separately graded. Do not call a scanner the oracle. Run normal and attack tests, inspect the data flow, and adjudicate unexpected variants blinded to condition. Version each oracle so later repairs do not rewrite earlier ground truth.

## Counterbalancing schedule

Prepare assignment before recruitment for four project-condition/order sequences in [METHODOLOGY.md](../METHODOLOGY.md). Within each task rotate checkpoint order while preserving dependencies (if any). Avoid systematic ordering of vulnerable before secure or SQL before path. Keep identical time allowance, known criteria, and available tools. Freeze the schedule before the main study and keep the random seed or assignment table.
