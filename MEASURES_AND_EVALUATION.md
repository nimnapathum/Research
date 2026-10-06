# Measures, security adjudication, and evaluation

**Status:** analysis plan to freeze after pilot and before main study. The unit for RQ1 is a reviewed **candidate snapshot**; for RQ2 it is an **exposed vulnerable opportunity in the final repository**; for RQ3 it is an **event-coded opportunity**; for RQ4 it is the class-specific version of these units. Never silently exchange denominators.

## 1. Data dictionary

| Variable | Unit and source | Coding |
| --- | --- | --- |
| participant_id | Person; assigned | Pseudonymous ID |
| project, task_order, condition | Task; randomization sheet | A/B, 1/2, acceleration/exploration encouragement |
| candidate_id, checkpoint, class | Opportunity; manifest | Stable ID; SQL/path; vulnerable/secure expected status |
| eligible_exposure | Opportunity; video/agent log | 1 only if candidate rendered or diff was visible and participant could act |
| candidate_security | Candidate; pre-study oracle | Secure/vulnerable/indeterminate for *target criterion* |
| reviewed_snapshot_hash | Candidate review gate; sandbox/patch | Exact **proposed-change** state attached to confidence, even if rejected |
| snapshot_security | Frozen proposal; blinded oracle/review | Secure/vulnerable/indeterminate for target criterion |
| confidence | Snapshot form | 0–100% chance this exact code meets stated security requirement; optional short reason |
| provisional_decision | Opportunity; checkpoint form | First keep/reject choice and timestamp; later replacement is coded separately |
| post_decision_path, target_detected, security_repair | Opportunity; video, transcript and code-diff coding | Keep/edit/replace/reject path, and whether target detection or intentional repair has evidence |
| verification_event | Timestamped action; fused evidence | Security-specific check type, timing, target, result |
| observed_mode | Time interval; coded video + interview | Acceleration/exploration/mixed/unclear plus evidence and rater confidence |
| final_target_vulnerability | Exposed vulnerable opportunity; final repository oracle | 1 if the relevant final feature still has target weakness; 0 if removed/blocked; missing if no assessable feature |
| final_functionality | Feature; normal tests/adjudication | Pass/fail/partial; report separately |
| additional_vulnerability | Final code; independent review | New SQL/path/other finding outside the target candidate |

Store the raw agent response, eligible controlled candidate, and frozen reviewed-proposal security separately: the whole repository context could make a candidate behave differently from its isolated patch. The controlled first proposal is immutable until the first decision/rating, then further edits are timestamped. Confidence must be paired with **snapshot_security** even if the participant rejects the proposal. If a participant deletes the feature, final target vulnerability may be absent but functional task failure must be visible in reporting.

## 2. Security oracle and adjudication

1. Before recruitment, write a threat model and explicit source–sink rule for each checkpoint. Build normal functional tests and attack tests using local synthetic data. Verify that each intended vulnerable candidate fails the security oracle and each intended secure candidate passes both normal and security tests.
2. At analysis, run the same tests against the **exact reviewed snapshot** and final submission where technically possible. Static analysis from CodeQL or SonarQube/Snyk may flag additional paths; record its tool/version/configuration and confirm findings manually. A scanner result is evidence, not ground truth.
3. Two reviewers independently assess anonymized code without seeing condition, confidence, or interview. They decide whether the specified vulnerability is reachable, provide a short data-flow/exploit rationale, and identify functionality failure. Resolve disagreements by documented discussion or a third adjudicator. Report raw agreement (and optionally Cohen's kappa when prevalence allows), counts of disagreements, and final resolution.
4. An indeterminate security label is reported as such, excluded from the primary binary comparison, and included in sensitivity bounds treating it once as secure and once as vulnerable. Do not choose a favorable label after looking at condition.
5. Do not count a mere agent warning, string match, or scanner alert as “detected vulnerability” unless the participant's behavior demonstrates that they identified or tested the actual target issue.

## 3. RQ1: confidence–security alignment

Let p be the confidence percentage divided by 100 and y = 1 if the **frozen proposed change in its task context** meets the specified security requirement, y = 0 if it has the target vulnerability. Prespecify a primary summary. Recommended: compare the **mean Brier score** by assigned condition, Brier = mean[(p − y)²], where smaller means better probabilistic accuracy. Brier is a *proper score combining calibration and discrimination*; **do not call it pure calibration**.

Always report components:

- Mean confidence **on secure snapshots** (desired high) and **on vulnerable snapshots** (desired low), with uncertainty.
- Confidence separation: mean p on secure minus mean p on vulnerable. Larger separation means better differentiation, but it can coexist with systematic overconfidence.
- Vulnerable-item confidence: mean p where y=0; its reduction is directly relevant to security overconfidence.
- Simple pooled observed security frequency by coarse, preregistered confidence bins only if cells are large enough; avoid a smooth reliability curve from eight judgments per person.
- At most, a descriptive signed gap mean(p−y). It mixes secure underconfidence and vulnerable overconfidence, so never report it alone.

Participant task means, rather than all items treated as independent, are the paired basis. A person with four judgments per task cannot be assigned a stable personal calibration score. If a candidate is never exposed or no confidence is recorded, report the missingness and its reason.

**Observed mode:** Two coders segment video/transcript using [INTERVIEW_AND_FORMS.md](INTERVIEW_AND_FORMS.md), then report how confidence outcomes vary by mode within assigned condition and by “mode alignment” (assignment versus observation). This is exploratory association, not a second randomized treatment.

## 4. RQ2: final vulnerability retention

For condition c, the **registered population** is all actually exposed vulnerable opportunities. Report its full outcome distribution: final target vulnerable, final target secure, final feature missing/unassessable, and lost final artifact. Among the assessable final features, define the target retention rate as:

**R(c) = number of exposed vulnerable opportunities whose target vulnerability remains in final submitted feature / number of exposed vulnerable opportunities with an assessable final feature.**

Also report an all-exposed **security-success** measure: number of exposed vulnerable opportunities ending with a functional and target-secure feature divided by all exposed vulnerable opportunities. This catches a “fix” that deletes/breaks the feature. Make a flow table: exposed → provisional kept/rejected/replaced → repaired or not → final target vulnerable/secure/missing → functionality pass/fail. A rejected candidate can still lead to a final vulnerability via a replacement; trace this rather than assigning automatic success.

If an opportunity was exposed but final feature is missing, retain it in a separate category and bound the possible retention estimate. If candidate exposure did not happen, do not fabricate a negative outcome. If the live agent adds a new SQL/path vulnerability, report it in an additional-vulnerability tally with full provenance.

## 5. RQ3: before/after security checks

**Event unit:** one timestamped action aimed at evaluating the security of the specific change; each may have multiple modalities but one primary code. Code categories:

| Code | Example | Count as security-specific? |
| --- | --- | --- |
| S1 Inspect source-to-sink flow | Trace request parameter through SQL builder or path join to file read | Yes |
| S2 Ask agent a security question | “Can this query be injected?” with referenced code | Yes; classify the answer and any follow-up separately |
| S3 Attack/negative test | Try quote payload or ../ marker, inspect result | Yes |
| S4 Static/security tool | Run CodeQL/Sonar or focused lint/security command; inspect relevant finding | Yes |
| S5 Repair and recheck | Parameterize query or canonicalize/contain path then rerun attack | Yes; code edit and test are separate events |
| G1 Generic review | Scroll diff or read changed lines with no security intent shown | Record, but don't assume security check |
| G2 Generic functional test | Normal test suite only | Record, but don't assume security check |

Resolve intent using video and a neutral interview prompt, but privilege contemporaneous evidence over retrospective rationalization. **Before** = after exposure and before provisional keep; **after** = after keep through final task submission. For rejection, there is no post-keep period: describe what happened after rejection in a separate branch. Count checks and whether at least one substantive security check occurred; do not assume more checks mean better checking. Report whether a check found the target problem, led to repair, and produced a passing oracle outcome.

Compare condition-level prevalence and timing with participant clustering. Associations between checking and removal are observational: suspected vulnerability may cause more checks, and keeping a change selects a nonrandom subset. Do not claim checks caused repair from a simple correlation.

## 6. RQ4: class differences

For SQL and path separately, show the RQ1 confidence components, RQ2 retention flow, and RQ3 verification counts/types. Report the estimated **condition effect within each class** and the *difference between those two effects*, with wide confidence intervals. Use a participant-clustered model or paired bootstrap/permutation where data permit. At a main sample of around 30, treat interaction estimates as exploratory, not evidence of no difference when uncertain.

## 7. Primary statistical approach

- Freeze a **primary** RQ1 contrast (recommended paired Brier task-mean difference) and an RQ2 contrast before recruitment. Recommended RQ2 contrast is the paired difference in **all-exposed functional-and-target-secure success**; also report target-vulnerability retention among assessable final features with missingness bounds. RQ3 and RQ4 are secondary/exploratory; state this hierarchy to reduce multiple-testing ambiguity.
- Analyze the **intention-to-treat encouragement** assignment first, including participants whose observed mode does not match. Use participant-paired difference summaries and intervals from a participant-level bootstrap or an order-respecting randomization/permutation test; include project, task order, class, and candidate version in a mixed model only if model size is justified.
- For binary RQ2 with two vulnerable opportunities per task, participant means are coarse. Report raw counts/flows and an exact or bootstrap interval; avoid fragile model coefficients if cells are sparse.
- Covariates (prior AI use, baseline SQL/path knowledge, professional/student status) are prespecified for sensitivity/description; do not select them post hoc to rescue significance. Project and order matter because every person does both tasks.
- Missing exposure, unavailable transcript, unreadable snapshot, skipped confidence, and lost final file are separate missingness categories. Show outcomes under optimistic/pessimistic bounds when missingness could change conclusions.
- Before main recruitment, use pilot variance/event rates to simulate precision for paired effects and class interaction. Pick a feasible sample target and publish the detectable effect/interval width; **do not** cite 30 as universally sufficient.
- Give estimates, uncertainty, denominators, and examples of divergent cases, not only p-values.

## 8. Behavioral coding quality and triangulation

Create a codebook from a few **pilot** videos; freeze it before main coding. Train two coders on shared material, then independently code a random subset of main sessions. Report percent agreement plus an appropriate chance-corrected statistic if categories and prevalence permit; adjudicate disagreements with a log. Mode and verification coding are different axes: a person can be exploring an API while doing no security verification, or accelerating implementation while checking a security sink. Link event codes to participant explanations, agent prompts, and code diffs with timestamps. Keep conflicting evidence rather than forcing an interview narrative to fit logs.

## 9. Worked opportunity example

Agent candidate Q1 contains SQL string concatenation. Participant sees it, asks for a normal test, keeps it, rates the frozen snapshot 90% likely secure, then runs a malicious quote test, changes query to a bound parameter, and submits working secure code. The candidate and rated snapshot are vulnerable; confidence on the vulnerable snapshot is 0.90 (Brier contribution 0.81). The opportunity is **not retained** in final code; it has a post-keep security check and repair. This is evidence of initial overconfidence followed by successful correction, not “blindly accepted vulnerable code.”

Contrast: A participant rejects the same vulnerable candidate and writes a secure replacement. The vulnerable opportunity remains in the RQ2 denominator and counts as final secure. They have no post-keep interval for that candidate.
