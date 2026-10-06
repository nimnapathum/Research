# Evidence ledger and source limits

The links below are primary papers or official technical sources. “Use” means the decision they help justify; it does not mean the paper proves this particular protocol is correct. Confirm bibliographic formatting against the final publication before submission.

| ID | Primary source | Supports | Important limit |
| --- | --- | --- | --- |
| Barke | Barke et al., [Grounded Copilot: How Programmers Interact with Code-Generating Models](https://arxiv.org/abs/2206.15000) (20 observed programmers) | Acceleration/exploration as grounded descriptions of developer intent with a code assistant | Does not validate an automatic IDE-event mode classifier or show a security effect |
| Perry | Perry et al., [Do Users Write More Insecure Code with AI Assistants?](https://arxiv.org/abs/2211.03622), CCS 2023 | AI assistance, security outcome, and user belief can diverge; one JavaScript SQL task had 36% versus 7% SQL-injection vulnerability | Assistant and tasks differ from Antigravity; 36/7 is one task result |
| Khalid | Khalid et al., [(Don't) Trust, but (Don't) Verify: Developers' Attention to Security in AI-Generated Code](https://arxiv.org/abs/2609.21020) (2026 preprint, 100 developers) | Direct adjacent study of selection, evaluation, security and trust; helps design candidate choice and interview | Uses its own tasks/UI; preprint as of this plan; some confidence was associated with security, so avoid blanket overtrust claim |
| Oh | Oh et al., [Poisoned ChatGPT Finds Work for Idle Hands: Exploring Developers' Coding Practices with Insecure Suggestions from Poisoned AI Models](https://arxiv.org/abs/2312.06227), IEEE S&P 2024 | Direct precedent for controlled insecure AI suggestions and observing whether developers retain them | Poisoning and interface differ from our controlled agent proposal; do not transfer its outcome rate |
| Serafini | Serafini et al., [Exploring the Impact of Intervention Methods on Developers' Security Behavior in a Manipulated ChatGPT Study](https://doi.org/10.1145/3706598.3713989), CHI 2025 | Direct precedent for a manipulated AI study and testing security guidance/warnings | Password-storage task and intervention effects are not the present mode comparison |
| Okamura | Okamura and Yamada, [Adaptive trust calibration for human-AI collaboration](https://doi.org/10.1371/journal.pone.0229132), PLOS ONE 2020 | General human-automation rationale for matching reliance to capability | Not a developer or code-security experiment |
| Lee | Lee and See, [Trust in Automation: Designing for Appropriate Reliance](https://doi.org/10.1518/hfes.46.1.50_30392), Human Factors 2004 | Conceptual distinction between trust and appropriate reliance | Theory, not a coding-task effect estimate |
| Tang | Tang et al., [A Study on Developer Behaviors for Validating and Repairing LLM-Generated Code Using Eye Tracking and IDE Actions](https://arxiv.org/abs/2405.16081) (28 participants) | Observable validation and repair behavior in AI-assisted programming | Focused on correctness and prepared code, not these security CWEs |
| Mozannar | Mozannar et al., [Reading Between the Lines: Modeling User Behavior and Costs in AI-Assisted Programming](https://doi.org/10.1145/3613904.3641936), CHI 2024 | Event/screen replay with retrospective programmer-state coding | Its CUPS labels are not Barke modes |
| Wu | Wu et al., [How Do Developers Interact with AI? An Exploratory Study on Modeling Developer Programming Behavior](https://arxiv.org/abs/2604.16393) (2026) | Intent/action/tool/emotion coding with screen replay and interviews | Different categories and assistant context; adapt with piloting |
| Wang | Wang et al., [Investigating and Designing for Trust in AI-powered Code Generation Tools](https://doi.org/10.1145/3630106.3658984), FAccT 2024 | Contextual developer trust and interview/critical-incident perspective | Interviews alone cannot establish code security |
| Brown | Brown et al., [Identifying the Factors That Influence Trust in AI Code Completion](https://doi.org/10.1145/3664646.3664757), 2024 | Developer, suggestion, and context factors in acceptance/trust | Acceptance is only a proxy for reliance and not security calibration |
| Kaur | Kaur et al., [Where Are the Users? Study of Security Participant Sampling](https://www.usenix.org/conference/usenixsecurity22/presentation/kaur), USENIX Security 2022 | Recruitment/reporting cautions for security user studies | Does not make students representative of all professionals |
| Danilova | Danilova et al., [How to Identify Programmers?](https://arxiv.org/abs/2103.04429) | Value of screening programming experience instead of assuming skill from label | Screening tool should fit this cohort |
| MITRE | [2024 CWE Top 25](https://cwe.mitre.org/top25/archive/2024/2024_top25_list.html) | SQL injection CWE-89 #3; path traversal CWE-22 #5; real-world importance | Not an LLM-specific prevalence survey |
| CodeQL-SQL | GitHub, [JavaScript SQL injection query help](https://codeql.github.com/codeql-query-help/javascript/js-sql-injection/) | Secure sink pattern and scanner rules | Static analysis may miss cases or create false positives |
| CodeQL-Path | GitHub, [JavaScript path injection query help](https://codeql.github.com/codeql-query-help/javascript/js-path-injection/) | Path containment/security analysis examples | Scanner is supplementary to an oracle |
| OWASP | [Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) | Security-oriented review differs from functional testing; manual and automated methods complement each other | Guidance, not evidence of this protocol's effects |
| Antigravity-hooks | Official [Antigravity hooks documentation](https://www.antigravity.google/docs/hooks/) | Potential logging of agent tool events and transcript location | Actual event completeness/version must be pilot-verified |
| Antigravity-rules | Official [Antigravity rules documentation](https://www.antigravity.google/docs/rules/) | Workspace instruction exposure is plausible | Hidden rule treatment is outside current core RQs |
| VS-Code | Official [VS Code extension API](https://code.visualstudio.com/api/references/vscode-api) | File, editor, terminal, and extension API possibilities | Does not grant access to every third-party agent prompt/response |
| Basha | Basha et al., [CodeWatcher](https://arxiv.org/abs/2510.11536) (2025) | Example of IDE event capture and limits of AI-origin inference | Its classifier had limited recall; do not use origin prediction as truth |

## Source-to-decision map

- **Core question validity:** Perry + Khalid + Barke + Lee/Okamura.
- **Two weakness classes:** MITRE + CodeQL-SQL + CodeQL-Path; the exact task pair is our design choice and must be piloted.
- **Two conditions and observed mode:** Barke gives concepts; Mozannar/Wu support retrospective coding. No paper validates the proposed condition manipulation in this exact setting.
- **Agent suggestion and review workflow:** Khalid/Oh/Serafini/Perry/Tang support participant code tests, controlled flaws, and review; balanced four-checkpoint exposure in an agent workflow is a methodological adaptation, not a direct replication.
- **Final security adjudication:** OWASP and CodeQL support multi-method review; the task-specific exploit tests are original research instruments to validate.
- **IDE and transcript plan:** Antigravity/VS Code official docs and Basha. The actual telemetry claims remain conditional until a pilot.

## Original proposal

Researcher-provided PDF: [22000526_Research_Proposal.pdf](</Users/nimnapathum/Trust Calibration in Developer-LLM + SE/LLM4SE/LLM4SE/22000526_Research_Proposal.pdf>). Treat its citations and design claims as historical material; verify each source before carrying it into the final thesis. The current design intentionally supersedes its generic trust, mode-classifier, and correctness-error framing.
