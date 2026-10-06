# Behaviour and observed-mode coding, draft v1

Code **episodes**, not people. An episode starts at a meaningful change in goal or interaction (new prompt, proposal review, test, repair or final submission) and ends at the next change. Store video start/end, task/checkpoint/candidate ID, exact proposal hash when available, contemporaneous trace reference, and interview quote reference.

## Observed interaction mode

| Code | Minimum evidence | Do not infer from |
| --- | --- | --- |
| Acceleration | The participant states or demonstrates a known next implementation step and uses the agent mainly to execute it faster. | Short prompt, fast acceptance, or assigned acceleration card alone. |
| Exploration | The participant seeks options, explanations or unfamiliar API knowledge because the next implementation step is uncertain. | Many prompts, slow work, or assigned exploration card alone. |
| Mixed | Both purposes are visible in the episode. | Assuming one entire task has one mode. |
| Unclear | The available trace and interview cannot support a label. | Forcing a label to fit the assigned condition. |

This adapts the qualitative distinction in [Barke et al.](https://arxiv.org/abs/2206.15000). Report the fraction of episodes/time per mode and disagreements; the **randomized assigned condition** remains the primary comparison. Mode labels are observational.

## Security-specific verification

| Code | Action | Evidence required |
| --- | --- | --- |
| S1 | Trace request/stored input to SQL or file-read sink | Named input/sink in prompt, visible code inspection, or interview explanation tied to a visible action. |
| S2 | Ask agent a security question about the proposed change | Prompt and visible response or synchronized video. |
| S3 | Run a negative/attack test | Command/input plus observed result. |
| S4 | Run and inspect a security scanner/focused security tool | Tool execution and relevant finding reviewed. |
| S5 | Repair a security issue and recheck it | Code diff plus check outcome; code repair and test are separate event rows. |
| G1 | Generic diff/code review | Visible inspection without enough evidence of a security-specific target. |
| G2 | Ordinary functional test | Normal feature check without a security-specific assertion. |

For each check, record whether it occurred **after exposure and before the first provisional decision**, or **after a keep decision and before final submission**. After rejection is a separate branch, not “post-keep”. Note whether the action found the target issue, led to repair, and whether the final oracle passed. Do not code a promised future check as one performed. A scanner alert without participant inspection is not a detected vulnerability.

Two coders should practice on pilot sessions and independently code a sample of main sessions blinded to candidate security and condition when practical. Keep both raw codes, disagreement notes and the resolved code. Percent agreement and a suitable chance-corrected measure can be reported if the distribution allows. The verification categories implement [MEASURES_AND_EVALUATION.md](../../MEASURES_AND_EVALUATION.md); the categories are a study-specific codebook requiring pilot refinement.

## Decision path after the first keep/reject

Code one row per exposed proposal in `DECISION_PATHS.csv`, using the video, prompts and code snapshots together. This tracks the route from a first decision to the final artifact; final security is adjudicated independently.

| Field | Allowed codes | Rule |
| --- | --- | --- |
| `post_decision_path` | `kept_unchanged`, `edited`, `replaced`, `rejected_then_implemented`, `rejected_no_implementation`, `unclear` | Use the actual code path after the first decision. `edited` includes a changed proposal; `replaced` means a different implementation took its place. |
| `target_detected` | `yes`, `no`, `unclear` | `yes` requires evidence that the participant identified the target security issue; rejection alone is not detection. |
| `security_repair` | `yes`, `no`, `unclear` | `yes` requires an intentional change directed at the target issue. A secure final artifact without such evidence is not automatically a repair. |

Record an evidence reference and short note. If the trace is absent or ambiguous, use `unclear`; leave the row blank only when it has not yet been coded. Do not infer intent from the final source code alone.
