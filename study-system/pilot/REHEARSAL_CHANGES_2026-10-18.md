# Rehearsal decisions: 18 October 2026

## Why the tasks still look similar

Resource Catalogue and Support Archive each ask for one database filter and one restricted file read. They have matching structure, tests, language and target vulnerability classes. This is deliberate: each project appears under both acceleration and exploration across the four balanced sequences. Making one project harder or adding an unfamiliar library only to exploration would mix task difficulty with assigned condition.

The difference is the **work orientation shown to the participant**, not the feature requirements. The first one-sentence cards were too weak in the researcher rehearsal. New cards state a clearer plan-and-execute versus learn-and-choose approach, without asking anyone to hurry, skip checks, or perform extra work. The cards are study-created prompts based on Barke's observed acceleration/exploration purposes; Barke did not validate these exact texts. See [the source ledger](../../REFERENCES.md) and [natural method](../../NATURAL_WORKFLOW_METHOD.md).

## Pilot check before the main study

Use 4–6 feasibility participants outside the main analysis. After each task, compare the existing `known_next_step` and `sought_options` answers and the neutral `mode_example` answer with two coders' video/transcript episode labels. Record the percentage of task time in each observed mode and examples of prompt intent. A successful implementation is **not** defined by more vulnerable code in one condition. If both cards produce the same observed interaction pattern, report that the manipulation failed and revise wording once before freezing the main protocol. Do not relabel assigned condition as actual cognitive mode.

Check project equivalence separately: completion of both features, functional test outcomes, active coding time, self-rated difficulty and baseline familiarity, stratified by project/order/condition. A large project difference calls for task adjustment before the main study; it does not justify making exploration intrinsically harder.

## Recording and code review

The researcher records the consented Google Meet session, stores it under approved Drive permissions, verifies playback, and adds one or more links plus Task 1/Task 2 time notes on the researcher Evidence page. Participants upload six code/agent/rating files per task; they do not upload video. The external link is not a file-integrity receipt, so keep a separate access, clock-alignment and retention check.

The portal's per-task view validates manifest hashes and shows changed files and final source without executing them. For active tests, download the final ZIP and run `python3 study-system/analysis/evaluate_natural_final.py FINAL_ZIP A|B TASK_ID` on an isolated researcher machine. Its JSON reports functional and attack-probe signals for Q1 and F1. The probe executes participant code and is not safe for the 1 GB hosted VM. A scanner or probe result is evidence for, not a substitute for, two independent blinded source reviews. Preserve the JSON, tool version, final hash, reviewer decisions and disagreements.

## Next rehearsal gates

1. Generate a **new** participant to inspect the revised card; existing downloaded ZIPs are intentionally frozen.
2. Complete both tasks, save six uploads per task, and confirm Task 2 unlocks without participant video upload.
3. Add a researcher Drive link, open it with the intended account, and check the recorded task boundaries.
4. Open each code-review page, confirm initial/final hashes and diffs, then run one offline Q1/F1 probe and an independent manual review.
5. Freeze card wording, questionnaire version, evaluation rubric, session length and exclusion rules before recruiting the main sample.
