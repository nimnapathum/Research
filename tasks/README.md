# Task package specifications

The files here describe the participant task design. Runnable [resource catalogue](../study-system/projects/resource-catalogue/README.md) and [support archive](../study-system/projects/support-archive/README.md) starter apps now exist separately, with all eight task sheets and 16 constructed prototype candidates. They are engineering artifacts, not yet validated participant stimuli or genuine Antigravity output. Each project must appear under both conditions across the sample.

## Documents

| File | Content |
| --- | --- |
| [RESOURCE_CATALOGUE.md](RESOURCE_CATALOGUE.md) | Project A story, four feature checkpoints, functional and security acceptance examples |
| [SUPPORT_ARCHIVE.md](SUPPORT_ARCHIVE.md) | Project B story, matched checkpoints and acceptance examples |
| [STIMULUS_AND_ORACLE_MANIFEST.md](STIMULUS_AND_ORACLE_MANIFEST.md) | Required manifest, candidate provenance, oracle checks, and balancing |

## Required deliverables for **each** project before a main study

~~~text
project-A-or-B/
  participant/
    README.md                 # install/run, app story, explicit security criteria
    condition-card.md         # one of two cards supplied at random
    reference-or-plan.md       # matched one-page context
    checkpoint-Q1.md
    checkpoint-Q2.md
    checkpoint-F1.md
    checkpoint-F2.md
    src/...                   # small starter code
    fixtures/...              # synthetic local data only
    dependency/runtime lock or documented dependency-free Node version
  researcher-only/
    manifest.csv              # IDs, provenance, versions, expected status
    candidate-patches/...
    normal-tests/...
    security-oracles/...
    blinded-review-rubric.md
    pilot-log.md
~~~

**Participant-visible README** states functional and security requirements; it must not reveal which candidate is flawed. **Researcher-only** oracle and variant placement are stored separately so the participant does not see the answer key. Participants may inspect all files in their study repository; no instruction tells them to avoid Markdown or hidden agent rule files.

## Common acceptance criteria

1. Valid requests produce the expected synthetic result.
2. Database values from requests are bound as values, not allowed to change SQL syntax.
3. A requested file resolves inside the approved project directory; attempts to leave it fail without revealing the planted marker.
4. Participant may ask the agent to implement, explain, test, and repair; they may inspect or replace any proposal.
5. The final submission consists of the whole repository, not a survey answer.

Normal and attack tests now exist for every checkpoint, and the 16 constructed variants passed the hidden oracles. In the human pilot, record whether each task is comprehensible without the researcher solving it, whether both condition cards change orientation without changing security criteria, whether the candidate renders reliably, and whether eight snapshot ratings per participant are feasible within the session. See [artifact status](../study-system/STATUS.md).
