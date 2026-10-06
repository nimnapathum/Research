# Task design and stimulus build plan

**Status:** two runnable task packages and constructed stimulus prototypes built; human pilot pending. Each participant completes both projects, with randomized assignment of condition and order. The project itself is **not** permanently “the acceleration task” or “the exploration task”; this prevents project and condition from being identical.

## 1. Common technology and learning load

The built projects use JavaScript, built-in `node:http` and `node:sqlite`, and local synthetic fixture directories. Node 24.21.0 is the planned study runtime; current engineering checks ran on Node 25.1.0, so the exact runtime still needs rehearsal. There are no npm package dependencies. Give the same quick-start, security requirements, tests, and tools in both projects. They run offline. Pilot on the exact Antigravity/OS setup. The unit of interest is a security decision about agent-generated server code.

The tasks need functional work a final-year student can understand in a short session and **security sinks** that can be tested. SQL injection arises when untrusted input is spliced into an SQL query rather than bound as a parameter. Path traversal arises when untrusted input can escape an allowed directory before file access. [MITRE's 2024 ranking](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html) motivates the classes; [CodeQL SQL](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/) and [path query](https://codeql.github.com/codeql-query-help/javascript/js-path-injection/) help formulate source/sink criteria.

## 2. Project pair

| Project | Participant-facing goal | Four checkpoint types | Why feasible |
| --- | --- | --- | --- |
| A: Resource catalogue | Add search/detail and local resource file viewing to a tiny catalog API. | Two query/filter endpoint changes; two file-view/download endpoint changes. | Familiar entities and simple HTTP requests. |
| B: Support archive | Add ticket search/detail and attachment preview/export to a tiny helpdesk API. | Two query/filter endpoint changes; two attachment path endpoint changes. | Parallel data flow with different names and fixtures. |

See [tasks/RESOURCE_CATALOGUE.md](tasks/RESOURCE_CATALOGUE.md) and [tasks/SUPPORT_ARCHIVE.md](tasks/SUPPORT_ARCHIVE.md) for participant story, checkpoint examples, oracle cases, and build requirements.

## 3. Condition materials

Both conditions disclose the same security acceptance criteria: database values must be parameterized; file access must stay under the permitted root; the app must pass normal feature tests. Give each participant permission to inspect files, consult documentation, ask the agent to explain, run tests or a scanner, and change or reject any suggestion.

**Acceleration encouragement card:** asks participants to identify their next step and use the agent to complete it efficiently. **Exploration encouragement card:** asks them to use the agent to explain or compare approaches before choosing a step. The built cards are [acceleration](study-system/instruments/CONDITION_ACCELERATION.md) and [exploration](study-system/instruments/CONDITION_EXPLORATION.md); both follow the same [participant workflow](study-system/instruments/PARTICIPANT_WORKFLOW.md). These are draft wordings to pilot for perceived task clarity, workload, and observed mode. Neither card tells people to hurry, trust blindly, or ignore security.

To reduce confounding, both conditions receive the same task sheets, project files, security criteria and tools. If the wording changes difficulty or knowledge as well as interaction purpose, interpret the assigned effect as a task-context effect rather than a pure cognitive-mode effect.

## 4. Candidate matrix within **each** project

| Checkpoint | Class | Agent candidate status | Participant's visible functional goal |
| --- | --- | --- | --- |
| Q1/Q2 | SQL injection | One vulnerable, one secure, with slot reversed across projects | Add two user-controlled query/filter features. |
| F1/F2 | Path traversal | One vulnerable, one secure, with slot reversed across projects | Add two file preview/download features. |

Balance the four checkpoint positions by Latin-square-like rotation across participants so Q1/F1 are not always first. A secure and vulnerable variant must have comparable endpoint complexity and functional passing behavior. If a candidate accidentally contains another security flaw, repair or exclude it during stimulus build; do not silently label it secure.

**Minimum exposure per participant:** 2 vulnerable and 2 secure candidates per task; 4 vulnerable and 4 secure across two tasks. This is an experimental design target, not a naturally occurring LLM error rate. A live agent may produce extra candidates or edits; retain the full trace and classify them as additional/exploratory.

## 5. Provenance and stimulus generation

For every controlled candidate, save:

| Field | Required content |
| --- | --- |
| candidate_id | Stable project/checkpoint/variant ID |
| source | Agent name/version/account setting and exact raw prompt/response |
| repository | Starter commit hash; file hashes before/after |
| intervention | Whether response was unmodified, lightly normalized, or deliberately edited by researcher; exact diff of changes |
| eligibility | Functional tests pass; vulnerability oracle result; no unrelated critical flaw |
| salience | Lines changed, comments, style, and whether candidate hints at security |
| exposure | Participant-visible candidate/diff or response, time, and how shown |

If researchers deliberately seed a flaw by editing agent code, describe it as an **experimentally constructed agent-style candidate**, not unmodified agent output. Stronger authenticity comes from collecting naturally generated candidates first and selecting matched secure/vulnerable ones. The task should never imply that every flaw arose autonomously in the main session if it was seeded by the researcher.

## 6. Oracle tests and secure forms

| Class | Vulnerability condition | Secure behavior to test | Safety of test |
| --- | --- | --- | --- |
| SQL injection | Controlled input alters SQL structure/returns a record beyond the authorized filter, or reaches a concatenated/interpolated query sink. | Same valid search works; injection probe is treated as a bound value and does not broaden results or execute a second statement. | Local synthetic SQLite database; no production data. |
| Path traversal | Controlled filename/path escapes fixture root and reads a planted outside-marker file. | Normal file can be viewed; traversal variants, URL encoding, separators, and symlink escape cannot read outside root. | Disposable local directory and marker file. |

Use both structural review and behavior tests. A merely rejecting endpoint may be secure but fail functionality; report that separately. Scanners such as CodeQL/SonarQube/Snyk can assist but cannot be the sole oracle. The [OWASP review guide](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) supports combining manual and automated review.

## 7. What the researcher must build before main data

1. Independently review the 16 constructed patches and decide whether the final study uses genuine target-agent candidates or explicitly labeled constructed stimuli.
2. Pilot task timing, perceived difficulty, condition separation, and candidate salience on the exact host.
3. Verify the controlled reveal, agent transcript, extension, video and final snapshot on that host.
4. Freeze the adjudication rubric, task sheets and candidate set before the main sample.

This `tasks/` directory contains design specifications. The runnable [Project A](study-system/projects/resource-catalogue/README.md) and [Project B](study-system/projects/support-archive/README.md) starters, participant sheets and constructed candidates are under `study-system/`. See its [status](study-system/STATUS.md) for the remaining validation.
