"""Checked descriptive natural-feature analysis; stdlib only, no invented labels."""
import argparse
import csv
import hashlib
import json
import random
import re
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean

FIELDS = ['participant_id', 'task_id', 'condition', 'project_id', 'task_order',
          'vulnerability_class', 'final_snapshot_sha256', 'confidence_snapshot_sha256',
          'probability_secure_pct', 'security_status', 'functionality_status', 'review_status',
          'missing_reason', 'evidence_ref']
HASH = re.compile(r'^sha256:[a-f0-9]{64}$')


def analyse(path, resamples=10000, seed=20261013):
    path = Path(path)
    with path.open(newline='', encoding='utf-8-sig') as source:
        reader = csv.DictReader(source)
        if not set(FIELDS).issubset(reader.fieldnames or []):
            raise ValueError('Missing natural features.csv columns')
        rows = list(reader)
    warnings, identities, participants, outcomes = [], set(), defaultdict(list), Counter()
    task_metadata = {}
    for number, row in enumerate(rows, 2):
        who, task, kind = row['participant_id'], row['task_id'], row['vulnerability_class']
        identity = (who, task, kind)
        if not who or not task or identity in identities:
            raise ValueError(f'Row {number}: blank or duplicate feature identity')
        identities.add(identity)
        if (row['condition'] not in ['acceleration', 'exploration'] or kind not in ['sql', 'path'] or
                row['project_id'] not in ['A', 'B'] or row['task_order'] not in ['1', '2']):
            raise ValueError(f'Row {number}: invalid assignment/class')
        metadata = (row['condition'], row['project_id'], row['task_order'])
        if task_metadata.setdefault((who, task), metadata) != metadata:
            raise ValueError(f'Row {number}: inconsistent task metadata')
        if row['security_status'] not in ['target_secure', 'vulnerable', 'not_implemented', 'unassessable']:
            raise ValueError(f'Row {number}: security review label missing or invalid')
        if row['functionality_status'] not in ['pass', 'fail', 'not_implemented', 'unassessable']:
            raise ValueError(f'Row {number}: functionality label missing or invalid')
        if row['review_status'] not in ['resolved', 'unreviewed', 'disagreement']:
            raise ValueError(f'Row {number}: invalid review status')
        probability = None
        if row['probability_secure_pct'].strip():
            probability = float(row['probability_secure_pct']) / 100
            if not 0 <= probability <= 1:
                raise ValueError(f'Row {number}: probability outside 0–100')
        linked = bool(HASH.fullmatch(row['final_snapshot_sha256']) and
                      row['final_snapshot_sha256'] == row['confidence_snapshot_sha256'])
        assessable = row['security_status'] in ['target_secure', 'vulnerable'] and row['review_status'] == 'resolved'
        row['_brier'] = (probability - (row['security_status'] == 'target_secure')) ** 2 if (
            probability is not None and linked and assessable) else None
        row['_probability'] = probability
        participants[who].append(row)
        outcomes[(row['condition'], kind, row['security_status'], row['functionality_status'], row['review_status'])] += 1
        if not linked:
            warnings.append(f'{task}/{kind}: rating/final hash missing or mismatched; excluded from probability score')
        if row['_brier'] is None and not row['missing_reason']:
            warnings.append(f'{task}/{kind}: unscored feature needs a missingness/review explanation')

    differences = []
    complete_ids = []
    by_label = defaultdict(list)
    for row in rows:
        if row['_brier'] is not None:
            by_label[(row['condition'], row['vulnerability_class'], row['security_status'])].append(row['_probability'])
    for who, items in participants.items():
        tasks = {(row['task_id'], row['condition'], row['project_id'], row['task_order']) for row in items}
        valid_assignment = (len(tasks) == 2 and len({x[1] for x in tasks}) == 2 and
                            len({x[2] for x in tasks}) == 2 and len({x[3] for x in tasks}) == 2)
        complete = (valid_assignment and len(items) == 4 and
                    {(row['condition'], row['vulnerability_class']) for row in items} ==
                    {(condition, kind) for condition in ['acceleration', 'exploration'] for kind in ['sql', 'path']} and
                    all(row['_brier'] is not None for row in items))
        if not complete:
            warnings.append(f'{who}: incomplete assessable four-feature pair; absent from primary paired estimate')
            continue
        scores = {condition: mean(row['_brier'] for row in items if row['condition'] == condition)
                  for condition in ['acceleration', 'exploration']}
        differences.append(scores['acceleration'] - scores['exploration'])
        complete_ids.append(who)
    interval = None
    if len(differences) >= 2:
        rng = random.Random(seed)
        draws = sorted(mean(rng.choices(differences, k=len(differences))) for _ in range(resamples))
        interval = [draws[int(.025 * (resamples - 1))], draws[int(.975 * (resamples - 1))]]
    if rows and len({r['security_status'] for r in rows if r['review_status'] == 'resolved' and
                    r['security_status'] in ['target_secure', 'vulnerable']}) < 2:
        warnings.append('Outcome labels lack diversity; score accuracy alone cannot establish discrimination or general calibration')
    return {
        'protocol_family': 'natural_task', 'input_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'participant_count': len(participants), 'recorded_feature_count': len(rows),
        'expected_features_for_recorded_participants': 4 * len(participants),
        'outcome_counts': [dict(condition=k[0], vulnerability_class=k[1], security_status=k[2],
                                functionality_status=k[3], review_status=k[4], count=v)
                           for k, v in sorted(outcomes.items())],
        'confidence_by_label': [dict(condition=k[0], vulnerability_class=k[1], security_status=k[2],
                                    n=len(v), mean_probability=mean(v)) for k, v in sorted(by_label.items())],
        'paired_brier': {'n_complete_participants': len(differences),
                        'mean_acceleration_minus_exploration': mean(differences) if differences else None,
                        'bootstrap_95_percent_interval': interval, 'resamples': resamples, 'seed': seed,
                        'participant_differences': dict(zip(complete_ids, differences))},
        'warnings': warnings,
        'limitations': 'Descriptive probability accuracy on complete assessable pairs. Human labels and causal interpretation are not generated.'
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('features_csv')
    args = parser.parse_args()
    print(json.dumps(analyse(args.features_csv), indent=2, allow_nan=False))
