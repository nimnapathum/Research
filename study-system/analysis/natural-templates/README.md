# Natural analysis tables

Copy these header-only CSVs into restricted session/analysis storage. They contain no participant results. Follow [NATURAL_ANALYSIS_PLAN.md](../../../NATURAL_ANALYSIS_PLAN.md) and [NATURAL_CODEBOOK.md](../../instruments/NATURAL_CODEBOOK.md).

For `features.csv`, keep every assigned SQL/path feature, including missing ones. Condition is `acceleration` or `exploration`; class is `sql` or `path`; project is `A` or `B`; order is 1 or 2. Security is `target_secure`, `vulnerable`, `not_implemented` or `unassessable`. Functionality is `pass`, `fail`, `not_implemented` or `unassessable`. Review status is `resolved`, `unreviewed` or `disagreement`. Probabilities are 0–100 or blank with a reason; both hashes must be `sha256:` plus 64 hexadecimal characters and agree before scoring. Do not fabricate a label to satisfy the script.

`episodes.csv` and `checks.csv` retain one coder's rows at a time; preserve independently coded and resolved versions separately. Times are seconds relative to a documented recording marker, not portal timestamps. Record intervals and uncertainty where exact timing is unavailable. Actor is `participant` or `agent`; do not count autonomous agent tests as developer verification without evidence of human review.

`exposures.csv` only supports agent-origin survival claims when origin and exposure are confirmed. Unknown origin or unread output does not become a human acceptance event. `session_log.csv` records the OS/tool/version, sources, quality and deviations needed to interpret all tables. Keep an additional raw-file inventory with file hashes and approved retention dates; interview linkage is currently manual.

Run `python3 study-system/analysis/natural_summary.py PATH_TO_FEATURES.csv` from the research root. An empty template yields no result estimate. The script excludes incomplete/mismatched/unreviewed pairs and reports warnings and counts rather than supplying labels. Human review must produce the table before analysis.
