# Grounded Copilot and our collected evidence

The original paper identifies interaction modes through qualitative observation, recorded participant explanations and interviews. It later analyses mode time, prompting, validation and suggestion outcomes. It does not supply a validated questionnaire that converts mouse speed or a few ratings into mode. See [sections 3 and 5 of Grounded Copilot](https://arxiv.org/html/2206.15000v3).

Our natural protocol adapts its interaction-purpose distinction to an agent that edits files. The following describes collection mechanisms, not data already obtained from participants.

The revised task packages also adapt the paper's task-structure contrast. Its familiar, decomposable work gave participants a clearer next step, while unfamiliar APIs created opportunities to seek approaches and explanations. In this study, acceleration packages include an implementation map and ordinary Node.js interfaces. Exploration packages require using a small local record/document API described in `study/INTERFACE_GUIDE.md`. Both keep the same SQL-injection and path-traversal opportunities. This is our stimulus design, not a replication of the original tasks or proof of participants' mental states. See [TASK_CONTRAST_DESIGN.md](TASK_CONTRAST_DESIGN.md).

| Evidence we need | Our collection | Status/interpretation |
| --- | --- | --- |
| Prior language/tool experience | Portal JavaScript familiarity, agent frequency and prior Antigravity questions. | Implemented; wording/scales differ from the original study. |
| Whether a next implementation step was known | Prompt/video context, post-task `known_next_step`, replay explanation. | Collected through separate streams; the rating alone cannot label episodes. |
| Seeking an approach or unfamiliar knowledge | Transcript/video, `sought_options`, mode example, replay. | Implemented form plus manual coding; preserve uncertain intention. |
| Examination, execution and documentation | Screen/transcript, code diffs and check rows including documentation consultation. | Manual coding; distinguish human checks from autonomous agent actions. |
| Changes retained, overwritten or repaired | Code snapshots plus screen/transcript and replay. | Agent application is observable; conscious acceptance is not guaranteed. |
| Time in each mode | Time-bounded intent episodes, with waiting/gaps separate. | Derived after coding, not assigned from a task card or elapsed time. |

Two deliberate differences affect interpretation. We do not require continuous think-aloud during measured coding, to reduce interference with the behaviour being studied; this may reduce evidence about momentary intent, so replay and `unclear` labels matter. Copilot autocomplete and multi-suggestion operations also differ from chat-agent requests. Do not claim to reproduce their prompting percentages, native acceptance actions or exact recording method.

The after-task questions and intent codebook are our adaptations, not validated items borrowed verbatim. Pilot comprehension, replay recall and coder agreement. The assigned work-structure condition remains the primary comparison even if observed modes mix or the manipulation fails. Because it combines a participant card with a different code interface, it does not isolate a pure cognitive-mode effect. Do not define exploration through intensive security checking and then claim exploration causes more checking.

Current sources and operational rules: [INTERVIEW_AND_FORMS.md](INTERVIEW_AND_FORMS.md), [natural codebook](study-system/instruments/NATURAL_CODEBOOK.md), [NATURAL_ANALYSIS_PLAN.md](NATURAL_ANALYSIS_PLAN.md).
