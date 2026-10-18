# Current study: design and evidence map

**Local working revision, 18 October 2026.** Capture format remains `natural-2026-10-13-r3`; new task packages use orientation revision `2026-10-18-v3` and stimulus revision `2026-10-18-api-contrast-v1`. Previously issued ZIPs remain frozen. The [hosted release status](research-portal/HOSTED_REHEARSAL_STATUS.md) describes an older deployed build until a later deployment is verified. No participant findings or preliminary outcome results are established here.

## Study in one paragraph

An early-career JavaScript developer completes two coding-agent tasks, one in each assigned work-structure condition. Both tasks request an exact SQL filter and a file read confined to one folder. Acceleration offers a known implementation route; exploration requires learning a small unfamiliar API. We record the exact submitted code, two security-confidence probabilities per task, agent/code/video evidence, short forms and a replay interview. Two independent reviewers assess the final code without participant ratings or condition labels, while recording any condition they infer from the source. We compare assigned conditions and separately code the interaction modes that actually occurred. See [RQs](RQ.md), [task contrast](TASK_CONTRAST_DESIGN.md), [natural method](NATURAL_WORKFLOW_METHOD.md), [analysis plan](NATURAL_ANALYSIS_PLAN.md), and [session runbook](study-system/pilot/NATURAL_SESSION_RUNBOOK.md).

## What supports each decision

| Decision | Previous research or technical basis | Our original part and required check |
| --- | --- | --- |
| Study acceleration and exploration | [Barke et al.](https://cseweb.ucsd.edu/~npolikarpova/publications/oopsla23-copilot.pdf) observed known-step execution and approach-seeking, and used familiar versus unfamiliar task components. | The cards, implementation map and adapter are ours. Pilot whether coded intent separates; do not infer mode from assignment. |
| Focus on security belief and submitted code | [Perry et al.](https://arxiv.org/abs/2211.03622) reported divergence between AI-assisted security outcomes and users' beliefs. [Khalid et al.](https://arxiv.org/abs/2609.21020) studied evaluation, selection, edits and security perceptions. | Exact-final-snapshot probabilities and paired condition comparison are ours. Pilot question comprehension and assess submitted code independently. |
| Use SQL injection and path traversal | [MITRE's 2024 Top 25](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html) ranks CWE-89 and CWE-22 at #3 and #5. | The two synthetic Node.js tasks and probes are ours. Rankings establish importance, not LLM-specific prevalence. Validate both functional and attack probes against secure and vulnerable reference implementations. |
| Reconstruct interaction and verification | Barke, [Mozannar et al.](https://doi.org/10.1145/3613904.3641936) and [Tang et al.](https://arxiv.org/abs/2405.16081) support contextual observation and retrospective interpretation. | Our Antigravity transcript observer, code snapshots, Meet recording, codebook and replay prompts must pass exact-host coverage and coder-agreement pilots. File edits alone do not prove human acceptance. |
| Measure probability accuracy and final security | [Brier](https://doi.org/10.1175/1520-0493%281950%29078%3C0001%3AVOFEIT%3E2.0.CO%3B2) supports probability scoring; [OWASP's review guide](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) supports security review alongside tools. | Brier is not pure calibration or a trust trait. Our final-code probes and two independent, metadata-masked reviews need reference-case rehearsal and disagreement resolution; source code may reveal condition. |
| Recruit about 30 early-career participants | [Lakens](https://doi.org/10.1525/collabra.33267) supports transparent sample-size justification; Barke and Khalid show user-study feasibility. | Thirty is a resource-bounded estimation target, not power guaranteed by precedent. Report paired uncertainty, missingness and exploratory class contrasts. |

The full source limits are in [REFERENCES.md](REFERENCES.md). No cited work validates this entire protocol, the exact questionnaires, or an automatic cognitive-state detector.

## Current workflow and status

1. **Before a session:** confirm approved consent and eligibility, balanced allocation, tested IDE/Node/model settings, clean workspace and practice. The portal serves the task card and frozen ZIP; the researcher starts the approved Meet recording. See the [runbook](study-system/pilot/NATURAL_SESSION_RUNBOOK.md).
2. **During each task:** start the agent observer and code watcher before the first prompt; verify a real prompt/reply sample. Participant may inspect, test, edit or reject agent code freely. No forced vulnerability, hidden insecure Markdown, keep/reject checkpoint or security feedback occurs in this natural protocol.
3. **At submission:** capture the final hash, obtain SQL and path security probabilities before researcher feedback, complete the immediate after-task form, and upload **six** evidence files. The researcher stores a restricted recording link separately.
4. **After both tasks:** complete the carryover form and replay interview. Independently assess final functionality and security, then code agent origin, human checks and observed mode with uncertainty. The [analysis plan](NATURAL_ANALYSIS_PLAN.md) defines denominators and missing-data rules.

**Still to verify before using this new revision with real pilot participants:** the four revised packages' feature/security reference cases, actual Antigravity/Meet capture and retrieval on intended hosts, questionnaire comprehension, mode separation, comparable difficulty/completion, reviewer agreement, and the approved data-retention procedure. Local package and baseline tests are engineering checks; they do not establish these research properties. Freeze the task, card, form, codebook and analysis revisions after the feasibility pilot and before the main sample.

Documents under **Historical protocols** and legacy checkpoint sections describe earlier designs. They are available for provenance and must not be used as instructions for a `-natural.zip` session.

The [portal–methodology inspection](PORTAL_METHOD_AUDIT.md) maps each current portal step to the evidence it actually saves and lists the remaining pilot gates.

The local portal's **Analytics** page now separates study phases, shows participant/task collection and confidence, and opens intermediate source snapshots as a timeline. Once two independent feature reviews have been completed outside the portal and entered against the final hash, it displays descriptive security counts and paired confidence-accuracy estimates. Agent-origin exposure, human verification and observed mode still require coded evidence; a live chart is not a completed study result.
