# Current measures and evaluation

Use [NATURAL_ANALYSIS_PLAN.md](NATURAL_ANALYSIS_PLAN.md) for units, probability scores, security adjudication, denominators, missingness and reporting. Use [the natural codebook](study-system/instruments/NATURAL_CODEBOOK.md) for manual mode, provenance and verification labels, and [data coverage](study-system/pilot/NATURAL_DATA_COVERAGE.md) for actual collection capabilities.

The core linked record is final feature code/hash + security probability/hash + independently resolved functionality/security labels. Behavioural explanation additionally needs readable screen/transcript/code history. The independent sample is 30 participants, with up to four repeated feature judgments per person. A Brier score measures probability accuracy; it is not an automatic trust score. Agent application and conscious acceptance are distinct.

Run `python3 study-system/analysis/audit_natural_evidence.py EVIDENCE_TASK_FOLDER` to check received files and code hashes. Run `python3 study-system/analysis/natural_summary.py features.csv` for checked descriptive counts and a participant-paired score summary. These tools do not supply human labels or security judgments. The old controlled measures are [archived](archive/2026-10-13-controlled/MEASURES_AND_EVALUATION.md).
