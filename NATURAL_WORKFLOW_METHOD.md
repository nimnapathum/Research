# Natural coding study: current methodology

Working protocol **natural-2026-10-13-r3**, 13 October 2026. The local portal serves this procedure when `STUDY_PROTOCOL=natural`. The researcher has confirmed ethics approval covers free coding, screen/agent/code/interview recording. Use the approved institutional information sheet. Real remote participation still needs a tested participant-accessible portal and exact-host capture/retrieval rehearsal. No participant results have been collected or established here.

## 1. Aim and design

Examine whether developers using a coding agent under acceleration and exploration encouragement differ in security judgments, reliance, verification, and alignment of security confidence with assessed code security.

Each participant completes two small JavaScript projects: one under each encouragement. Both projects contain one SQL filtering feature and one restricted file-reading feature. Neither project belongs permanently to a condition. The four sequences balance project, condition and order. Randomised encouragement is the assigned comparison; observed mode is independently coded and can change within a task. The comparison cannot isolate a pure internal cognitive-state effect.

The main target is 30 completed early-career participants, preceded by separate wording checks and 4–6 feasibility sessions. Define the cohort as final-year computing students or developers with 0–2 paid years, with basic JavaScript ability. Record security knowledge, development and agent experience. A missed flaw can reflect skill, understanding or tool behaviour as well as reliance; it is not automatically evidence of overtrust.

## 2. Research questions and operational interpretation

The original researcher-supplied wording is retained in [RQ.md](RQ.md). Use these natural-task interpretations for the pilot and settle the exact main-study wording with the supervisor before freezing it:

1. **RQ1:** How does alignment between developers' security confidence and assessed **final-feature security** differ between acceleration and exploration encouragement, and how does it relate to observed interaction mode?
2. **RQ2:** How do the conditions affect target vulnerabilities in final submitted code? Report actual exposed agent-origin weaknesses and their later survival separately.
3. **RQ3 refinement:** How do security verification behaviours before and after **observed integration of agent-generated changes** differ between conditions, and how are they associated with target vulnerabilities in final code?
4. **RQ4:** Do these patterns differ between SQL injection and path traversal? This is exploratory with 30 people.

The natural task cannot guarantee insecure output. “Known exposed vulnerability” means a confirmed weakness in an actual agent-origin change, supported by transcript/video and code; its presence is not assumed. No exposure means survival cannot be estimated. If exposure is sparse, retain final-security and checking analyses and limit the retention claim. A guaranteed-exposure review experiment would be a separate procedure and dataset.

## 3. Equal tasks and encouragement

Both conditions receive identical tools, security requirements, functional tests, time allowance and permissions to inspect, prompt, edit, test, reject or repair. Give plain requirements without an answer key: SQL input must remain data, and file reads must remain in the allowed root. Explicit requirements make this a security-salient development setting; findings do not estimate completely unprompted security attention.

Acceleration encouragement asks the developer to form a short plan and use the agent to carry out each step. Exploration encouragement asks the developer to use the agent to understand code and compare approaches before choosing a step. The fuller cards issued after the 18 October rehearsal are original manipulations to test, not validated psychological scales. Both permit questions, revision and checking. Do not require scripted prompts, rushed work, skipped checks or forced review pauses. Older frozen ZIPs retain their original cards; record the card revision and exclude rehearsal data from the main analysis.

Show the card to the **participant in the portal**. The ZIP excludes the assigned card and condition field; `AGENTS.md` supplies common project requirements only. Participants write their own prompts. This removes a direct condition instruction to the agent, although their prompts will naturally transmit their goals. The collector script contains no allocation logic.

Use a fresh project and agent conversation for each task, and the same model, permission/review settings and available tools. Record unavoidable version/model changes, quota interruptions and personal rules/extensions. Do not silently pool different settings. The closely parallel projects permit transfer learning; counterbalancing and the carryover question reduce and expose this limitation but do not eliminate it.

## 4. Participant and researcher sequence

1. **Recruit and screen.** Apply the cohort criteria, obtain approved consent, explain recording and withdrawal, and log eligibility without collecting unnecessary identifiers. Researcher creates credentials and the portal reserves both assignments. Keep rehearsal/pilot/main allocations separate and audit realised balance.
2. **Prepare.** Complete neutral background questions and an unrelated practice. Check Node 24+, agent version/model, approved screen capture, readable conversation export and watcher. Record host settings and a common clock marker. Practice does not teach SQL or path defences.
3. **Task 1.** Participant logs in, reads the portal card and complete task sheet, downloads `-natural.zip`, extracts it and opens only that project. Folder renaming does not change the task ID. Set up and start the [conversation observer](study-system/pilot/AGENT_OBSERVER_GUIDE.md), confirm its hook is enabled, and use a fresh conversation. The researcher starts the approved Google Meet recording and the participant starts `node study/capture.mjs watch . ../TASK-ID-capture` before the first prompt. Agent can edit immediately. Facilitator helps with setup, never implementation or security hints.
4. **Finish Task 1.** At “I would submit” or the common time cap, save `node study/capture.mjs snapshot . ../TASK-ID-final`, then run `node study/rate.mjs ../TASK-ID-final`. The participant estimates security of that exact snapshot for SQL and path, gives reasons, willingness to submit and stated reliance. Their own tests during coding are allowed; the researcher withholds hidden assessment/debrief until after both tasks and interview. Save the final hash and timing.
5. **Transfer and reflect.** Wait for the agent to be idle, stop both watchers, and inspect both health files. The researcher marks the task boundary in the Meet recording and later adds its restricted Drive link and time notes in the evidence console. The participant uploads final manifest and rating first, completes the immediate after-task questions, then uploads code history, capture health, final code and transcript. These are six portal files; the recording is researcher-managed. Receipts prove transfer, not content quality. Missing evidence is logged; never upload a fake placeholder. Task 2 opens after Task 1 submission and after-task form.
6. **Task 2.** Take a short common break; repeat with the other project and encouragement. No security feedback from Task 1 is supplied. Use a new agent conversation. Complete the after-both carryover questions.
7. **Replay interview and debrief.** Use neutral, predetermined selections of actual moments, including cases with no check. Ask about implementation intent, understanding, continuation and checks. Preserve explanations separately from observed behaviour. Debrief and compensate according to the approved procedure.
8. **Quality and assessment.** Researcher verifies hashes, code completeness, Drive recording access/playback and transcript coverage, and logs gaps. The portal gives a read-only initial-to-final code diff and final source view; it is not a security verdict. Run `study-system/analysis/evaluate_natural_final.py` on an isolated researcher machine for functional and attack-probe signals, then create blinded review copies. Assess target security through tests plus two independent reviews.

Suggested first timing pilot: approximately 10 minutes of setup/practice, up to 30 minutes per task, a 5-minute break, and 15–20 minutes of replay/interview plus forms/transfer. These durations are our starting feasibility choices. Record task active time separately from uploads and setup. Revise once using pilot evidence, then freeze equal caps for the main study. Do not repeatedly change caps after seeing security outcomes.

## 5. Measures and analysis

Automatic: IDs, assignments, questionnaire timestamps, code snapshots/manifests, final rating JSON, upload sizes/hashes, and registered raw Antigravity transcript records/hook timestamps where supported. The observer preserves original fields and labels collection timestamps separately. Complete prompt coverage is host-dependent and needs rehearsal. Manual: screen/video, synchronization, observed mode, verification, provenance and security review. Pointer, gaze, typing cadence and a native human acceptance click are not guaranteed in this natural package. Do not present them as collected or as validated mode measures.

Code mode from implementation intent, independently of speed, checking intensity and security outcome. Agent application, human inspection, explicit endorsement, continuation, repair and final survival are separate events. A file edit by an agent is not proof of conscious human acceptance. Two coders pilot the [natural codebook](study-system/instruments/NATURAL_CODEBOOK.md).

The [natural analysis plan](NATURAL_ANALYSIS_PLAN.md) specifies participant-paired probability accuracy, confidence by security label, final feature outcomes, confirmed-exposure survival and verification sequences. Thirty people give up to 120 repeated feature judgments. The primary contrast is one paired estimate; class differences and observed-mode associations are exploratory. Preserve missing/unassessable outcomes and report denominators. Confidence is an artifact-security belief; trust requires the reliance and interview evidence too.

## 6. Validity and release gates

A supervised feasibility pilot tests clarity, natural interaction, timing, encouragement separation, insecure-output frequency and coding reliability. It is legitimate for a pilot to find that the manipulation or exposure does not work; do not require a successful effect before conducting it. Before inviting pilot participants, demonstrate the real host/recording/transfer/retrieval path and a trial security review, using approved materials. Before the main sample, freeze questions, settings, tasks, versions, allocation, codebook and analysis, and exclude revision-stage pilots from the main analysis.

The local app runs on this Mac. A participant-owned computer needs a separately verified deployment or approved network route. Researcher evidence retrieval, corrected uploads, missing-stream exceptions and retention/deletion need operational rehearsal. Current absence of these checks is recorded in [RESEARCH_AUDIT.md](RESEARCH_AUDIT.md), rather than treated as a passed gate.

## 7. Research basis and original adaptations

The source-to-decision ledger is [REFERENCES.md](REFERENCES.md). Barke motivates the two interaction purposes; Perry motivates paired security belief/outcome measurement; Khalid motivates evaluation, final edits and independent code review; Mozannar and Tang motivate contextual trace/replay evidence. Lakens supports an explicit resource/precision argument for sample size, and probability-scoring literature supports the score definition. The exact tasks, encouragement, final-hash form, event rules and timing are this study's adaptations requiring pilot evidence. These papers do not validate the complete protocol in advance.
