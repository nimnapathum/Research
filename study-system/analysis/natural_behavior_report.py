"""Join resolved natural-study coding tables into an RQ-linked descriptive report.

This script does not classify mode, decide security, or infer that the agent caused a flaw.
Use one phase and independently resolved coding tables at a time.
"""
import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

from natural_summary import analyse as feature_analysis


SCHEMAS = {
    'features': ('participant_id', 'task_id', 'condition', 'vulnerability_class',
                 'security_status', 'review_status'),
    'session_log': ('participant_id', 'task_id', 'study_phase'),
    'coding_status': ('participant_id', 'task_id', 'mode_status', 'checks_status',
                      'exposure_status', 'interview_status', 'resolved_by', 'evidence_ref'),
    'episodes': ('participant_id', 'task_id', 'episode_id', 'coder_id', 'start_seconds',
                 'end_seconds', 'mode', 'active_or_waiting', 'trace_ref'),
    'checks': ('participant_id', 'task_id', 'change_id', 'check_id', 'coder_id',
               'time_start_seconds', 'time_end_seconds', 'actor', 'vulnerability_class',
               'category', 'security_purpose', 'timing_relative_to_integration',
               'result_reviewed', 'issue_identified', 'evidence_ref'),
    'exposures': ('participant_id', 'task_id', 'change_id', 'vulnerability_class',
                  'origin_status', 'exposure_confirmed', 'intentional_repair',
                  'final_survival', 'evidence_ref'),
}
PHASES = {'rehearsal', 'pilot', 'main', 'legacy'}
STATES = {'complete', 'partial', 'pending', 'unavailable'}
MODES = {'acceleration', 'exploration', 'mixed', 'unclear'}
TIMING = {'before_application', 'after_application_before_continuation',
          'after_continuation', 'no_integration', 'unclear'}
CHECK_CATEGORIES = {'security_dataflow', 'security_agent_question', 'attack_test',
                    'scanner_review', 'security_repair', 'generic_review',
                    'functional_test', 'documentation_consulted'}
SECURITY_CATEGORIES = {'security_dataflow', 'security_agent_question', 'attack_test',
                       'scanner_review', 'security_repair', 'documentation_consulted'}


def read_table(directory, name):
    path = directory / f'{name}.csv'
    with path.open(newline='', encoding='utf-8-sig') as source:
        reader = csv.DictReader(source)
        if not set(SCHEMAS[name]).issubset(reader.fieldnames or []):
            raise ValueError(f'{path}: missing required columns')
        rows = list(reader)
    return rows, hashlib.sha256(path.read_bytes()).hexdigest()


def task_key(row):
    return row['participant_id'], row['task_id']


def seconds(row, field, label):
    try:
        result = float(row[field])
    except (TypeError, ValueError):
        raise ValueError(f'{label}: {field} must be a nonnegative number') from None
    if not 0 <= result < 24 * 60 * 60:
        raise ValueError(f'{label}: {field} is outside a study-day interval')
    return result


def yes_no_unclear(value, label):
    if value not in {'yes', 'no', 'unclear'}:
        raise ValueError(f'{label}: expected yes, no or unclear')


def analyse(directory, phase):
    directory = Path(directory)
    if phase not in PHASES:
        raise ValueError('Choose rehearsal, pilot, main or legacy')
    tables, hashes = {}, {}
    for name in SCHEMAS:
        tables[name], hashes[name] = read_table(directory, name)
    features = tables['features']
    sessions = tables['session_log']
    task_meta = {}
    for row in features:
        key = task_key(row)
        meta = row['condition']
        if task_meta.setdefault(key, meta) != meta:
            raise ValueError(f'{key}: contradictory condition in features.csv')
    session_keys = set()
    for row in sessions:
        key = task_key(row)
        if key in session_keys or row['study_phase'] != phase or key not in task_meta:
            raise ValueError(f'{key}: duplicate, wrong-phase or unlinked session')
        session_keys.add(key)
    if session_keys != set(task_meta):
        raise ValueError('Every feature task needs exactly one same-phase session_log row')
    coding = {}
    for row in tables['coding_status']:
        key = task_key(row)
        if key in coding or key not in task_meta:
            raise ValueError(f'{key}: duplicate or unlinked coding status')
        if any(row[column] not in STATES for column in
               ('mode_status', 'checks_status', 'exposure_status', 'interview_status')):
            raise ValueError(f'{key}: invalid coding completion state')
        if not row['resolved_by'] or not row['evidence_ref']:
            raise ValueError(f'{key}: coding completion needs reviewer and evidence reference')
        coding[key] = row
    if set(coding) != set(task_meta):
        raise ValueError('Every feature task needs an explicit coding_status row, including pending tasks')

    seen = defaultdict(set)
    mode_seconds = defaultdict(Counter)
    intervals = defaultdict(list)
    for row in tables['episodes']:
        key = task_key(row)
        label = f'{key} episode {row["episode_id"]}'
        if key not in coding or row['episode_id'] in seen[('episode', key)] or not row['coder_id']:
            raise ValueError(f'{label}: missing task, duplicate ID or coder')
        seen[('episode', key)].add(row['episode_id'])
        if row['mode'] not in MODES or row['active_or_waiting'] not in {'active', 'waiting', 'gap'}:
            raise ValueError(f'{label}: invalid mode or activity status')
        start, end = seconds(row, 'start_seconds', label), seconds(row, 'end_seconds', label)
        if end <= start or not row['trace_ref']:
            raise ValueError(f'{label}: interval or evidence reference missing')
        intervals[key].append((start, end))
        if coding[key]['mode_status'] == 'complete' and row['active_or_waiting'] == 'active':
            mode_seconds[key][row['mode']] += end - start
    for key, values in intervals.items():
        ordered = sorted(values)
        if any(ordered[index][0] < ordered[index - 1][1] for index in range(1, len(ordered))):
            raise ValueError(f'{key}: overlapping resolved mode episodes; preserve coder drafts separately')

    reviewed_checks = defaultdict(list)
    category_counts = defaultdict(Counter)
    for row in tables['checks']:
        key = task_key(row)
        label = f'{key} check {row["check_id"]}'
        if key not in coding or row['check_id'] in seen[('check', key)] or not row['coder_id']:
            raise ValueError(f'{label}: missing task, duplicate ID or coder')
        seen[('check', key)].add(row['check_id'])
        if row['category'] not in CHECK_CATEGORIES or row['actor'] not in {'participant', 'agent'} or \
           row['timing_relative_to_integration'] not in TIMING or \
           row['vulnerability_class'] not in {'', 'sql', 'path'}:
            raise ValueError(f'{label}: invalid check category, actor, time anchor or class')
        yes_no_unclear(row['security_purpose'], label)
        yes_no_unclear(row['result_reviewed'], label)
        yes_no_unclear(row['issue_identified'], label)
        start, end = seconds(row, 'time_start_seconds', label), seconds(row, 'time_end_seconds', label)
        if end < start or not row['evidence_ref']:
            raise ValueError(f'{label}: interval or evidence reference missing')
        if coding[key]['checks_status'] != 'complete':
            continue
        condition = task_meta[key]
        category_counts[condition][row['category']] += 1
        is_reviewed_security = (row['actor'] == 'participant' and row['category'] in SECURITY_CATEGORIES and
                                row['security_purpose'] == 'yes' and row['result_reviewed'] == 'yes')
        if is_reviewed_security:
            reviewed_checks[key].append(row)

    confirmed = defaultdict(list)
    for row in tables['exposures']:
        key = task_key(row)
        label = f'{key} exposure {row["change_id"]}/{row["vulnerability_class"]}'
        identity = (row['change_id'], row['vulnerability_class'])
        if key not in coding or identity in seen[('exposure', key)] or not row['change_id'] or \
           row['vulnerability_class'] not in {'sql', 'path'}:
            raise ValueError(f'{label}: missing task, duplicate change/class or invalid class')
        seen[('exposure', key)].add(identity)
        for field in ('exposure_confirmed', 'intentional_repair', 'final_survival'):
            yes_no_unclear(row[field], label)
        if row['origin_status'] not in {'confirmed_agent', 'mixed', 'participant', 'unknown'} or \
           not row['evidence_ref']:
            raise ValueError(f'{label}: invalid origin or missing evidence reference')
        if coding[key]['exposure_status'] == 'complete' and row['origin_status'] == 'confirmed_agent' and \
           row['exposure_confirmed'] == 'yes':
            confirmed[key].append(row)

    coverage = {field: dict(Counter(row[field] for row in coding.values())) for field in
                ('mode_status', 'checks_status', 'exposure_status', 'interview_status')}
    mode_tasks = []
    for key, state in coding.items():
        if state['mode_status'] != 'complete':
            continue
        durations = mode_seconds[key]
        active = sum(durations.values())
        mode_tasks.append({'participant_id': key[0], 'task_id': key[1], 'condition': task_meta[key],
                           'active_seconds': active,
                           'seconds_by_mode': {mode: durations[mode] for mode in sorted(MODES)},
                           'acceleration_share': durations['acceleration'] / active if active else None,
                           'exploration_share': durations['exploration'] / active if active else None})
    mode_rows = []
    for condition in ('acceleration', 'exploration'):
        selected = [row for row in mode_tasks if row['condition'] == condition]
        usable = [row for row in selected if row['active_seconds'] > 0]
        durations = Counter()
        for row in selected:
            durations.update(row['seconds_by_mode'])
        active = sum(durations.values())
        mode_rows.append({'condition': condition,
                          'complete_tasks': len(selected), 'tasks_with_observed_active_time': len(usable),
                          'active_seconds': active,
                          'seconds_by_mode': {mode: durations[mode] for mode in sorted(MODES)},
                          'mean_task_acceleration_share': (
                              sum(row['acceleration_share'] for row in usable) / len(usable) if usable else None),
                          'mean_task_exploration_share': (
                              sum(row['exploration_share'] for row in usable) / len(usable) if usable else None)})

    check_rows, exposure_rows, class_rows, association_rows = [], [], [], []
    for condition in ('acceleration', 'exploration'):
        keys = [key for key in task_meta if task_meta[key] == condition]
        complete_checks = [key for key in keys if coding[key]['checks_status'] == 'complete']
        complete_exposures = [key for key in keys if coding[key]['exposure_status'] == 'complete']
        observed = [row for key in complete_checks for row in reviewed_checks[key]]
        exposed = [row for key in complete_exposures for row in confirmed[key]]
        check_rows.append({'condition': condition, 'coded_tasks': len(complete_checks),
                           'tasks_with_reviewed_security_check': sum(bool(reviewed_checks[key]) for key in complete_checks),
                           'reviewed_security_checks': len(observed),
                           'before_application': sum(row['timing_relative_to_integration'] == 'before_application'
                                                     for row in observed),
                           'after_application_before_continuation': sum(
                               row['timing_relative_to_integration'] == 'after_application_before_continuation'
                               for row in observed),
                           'after_continuation': sum(row['timing_relative_to_integration'] == 'after_continuation'
                                                     for row in observed),
                           'category_counts_all_actors': dict(category_counts[condition])})
        exposure_rows.append({'condition': condition, 'coded_tasks': len(complete_exposures),
                              'confirmed_agent_origin_exposures': len(exposed),
                              'final_survival_yes': sum(row['final_survival'] == 'yes' for row in exposed),
                              'final_survival_no': sum(row['final_survival'] == 'no' for row in exposed),
                              'final_survival_unclear': sum(row['final_survival'] == 'unclear' for row in exposed),
                              'intentional_repair_yes': sum(row['intentional_repair'] == 'yes' for row in exposed),
                              'survival_fraction_assessable': (
                                  sum(row['final_survival'] == 'yes' for row in exposed) /
                                  sum(row['final_survival'] in {'yes', 'no'} for row in exposed)
                                  if any(row['final_survival'] in {'yes', 'no'} for row in exposed) else None)})
        for weakness in ('sql', 'path'):
            feature_rows = [row for row in features if row['condition'] == condition and
                            row['vulnerability_class'] == weakness]
            check_tasks = [key for key in complete_checks if any(task_key(row) == key and
                           row['vulnerability_class'] == weakness for row in features)]
            specific_checks = [row for key in check_tasks for row in reviewed_checks[key]
                               if row['vulnerability_class'] == weakness]
            specific_exposures = [row for key in complete_exposures for row in confirmed[key]
                                  if row['vulnerability_class'] == weakness]
            class_rows.append({'condition': condition, 'class': weakness,
                               'assigned_features': len(feature_rows),
                               'resolved_assessable': sum(row['review_status'] == 'resolved' and
                                                          row['security_status'] in {'target_secure', 'vulnerable'}
                                                          for row in feature_rows),
                               'final_vulnerable': sum(row['review_status'] == 'resolved' and
                                                       row['security_status'] == 'vulnerable' for row in feature_rows),
                               'check_coded_tasks': len(check_tasks),
                               'reviewed_security_checks': len(specific_checks),
                               'confirmed_agent_origin_exposures': len(specific_exposures),
                               'exposures_surviving': sum(row['final_survival'] == 'yes'
                                                          for row in specific_exposures)})
            for row in feature_rows:
                key = task_key(row)
                if key not in complete_checks or row['review_status'] != 'resolved' or \
                   row['security_status'] not in {'target_secure', 'vulnerable'}:
                    continue
                checked = any(check['vulnerability_class'] == weakness for check in reviewed_checks[key])
                association_rows.append((condition, weakness, checked, row['security_status']))

    association = Counter(association_rows)
    warnings = []
    if any(row['mode_status'] != 'complete' for row in coding.values()):
        warnings.append('Observed-mode shares exclude tasks without completed mode coding')
    if any(row['active_seconds'] == 0 for row in mode_tasks):
        warnings.append('Some completed mode records have no observable active time; their shares are unavailable')
    if any(row['checks_status'] != 'complete' for row in coding.values()):
        warnings.append('Zero-check counts require completed check coding; pending tasks are excluded')
    if any(row['exposure_status'] != 'complete' for row in coding.values()):
        warnings.append('Exposure survival is conditional on completed coding and confirmed agent origin')
    if not any(confirmed.values()):
        warnings.append('No confirmed agent-origin insecure exposure: retention among exposed changes is not estimable')
    feature_lookup = {(task_key(row), row['vulnerability_class']): row for row in features}
    for key, rows in confirmed.items():
        for row in rows:
            feature = feature_lookup.get((key, row['vulnerability_class']))
            if row['final_survival'] == 'yes' and feature and feature['review_status'] == 'resolved' and \
               feature['security_status'] in {'target_secure', 'not_implemented'}:
                warnings.append(f'{key[1]}/{row["vulnerability_class"]}: exposure survival conflicts with final feature label; reconcile the evidence')
    feature_result = feature_analysis(directory / 'features.csv')
    return {'report_version': 'natural-rq-2026-10-18-v1', 'study_phase': phase,
            'source_sha256': hashes, 'coverage': {'tasks': len(task_meta), 'participants': len({key[0] for key in task_meta}),
                                                  'coding_states': coverage},
            'rq1': {'feature_analysis': feature_result,
                    'observed_mode_by_condition': mode_rows, 'observed_mode_by_task': mode_tasks},
            'rq2': {'final_feature_outcomes': feature_result['outcome_counts'],
                    'paired_vulnerable_count': feature_result['paired_vulnerable_count'],
                    'joint_functional_secure_by_condition': feature_result['joint_functional_secure_by_condition'],
                    'confirmed_exposure_flow': exposure_rows},
            'rq3': {'checks_by_condition': check_rows,
                    'reviewed_security_check_vs_final_security': [
                        {'condition': condition, 'class': weakness, 'reviewed_check': checked,
                         'final_security': status, 'features': count}
                        for (condition, weakness, checked, status), count in sorted(association.items())]},
            'rq4': {'by_condition_and_class': class_rows}, 'warnings': warnings,
            'interpretation': 'Descriptive linked records. The condition combines task guidance and interface; '
                              'observed mode and checks are not randomized. A confirmed exposure is not proof of '
                              'conscious acceptance; a final vulnerability is not automatically agent-caused.'}


def markdown_report(result):
    """Make the checked aggregates readable without turning them into findings claims."""
    coverage = result['coverage']
    brier = result['rq1']['feature_analysis']['paired_brier']
    vulnerable = result['rq2']['paired_vulnerable_count']
    def number(value):
        return 'not estimable' if value is None else f'{value:.3f}'
    lines = [f'# Natural-study analysis: {result["study_phase"]}', '',
             f'**Coverage:** {coverage["participants"]} participants, {coverage["tasks"]} tasks. '
             'Counts below are descriptive and use their stated denominators.', '',
             '## RQ1 — confidence and assessed security', '',
             f'Complete paired Brier scores: **{brier["n_complete_participants"]} participants**; '
             f'mean acceleration minus exploration: **{number(brier["mean_acceleration_minus_exploration"])}**. '
             'Lower Brier score means more accurate probability judgments.', '',
             '| Assigned condition | Complete mode-coded tasks | Mean acceleration share | Mean exploration share |',
             '| --- | ---: | ---: | ---: |']
    for row in result['rq1']['observed_mode_by_condition']:
        lines.append(f'| {row["condition"]} | {row["complete_tasks"]} | '
                     f'{number(row["mean_task_acceleration_share"])} | '
                     f'{number(row["mean_task_exploration_share"])} |')
    lines.extend(['', '## RQ2 — final vulnerabilities and confirmed agent exposures', '',
                  f'Complete paired vulnerable-feature counts: **{vulnerable["n_complete_participants"]} '
                  f'participants**; mean acceleration minus exploration: '
                  f'**{number(vulnerable["mean_acceleration_minus_exploration"])}**.', '',
                  '| Condition | Complete exposure-coded tasks | Confirmed agent exposures | Survived | Removed | Unclear |',
                  '| --- | ---: | ---: | ---: | ---: | ---: |'])
    for row in result['rq2']['confirmed_exposure_flow']:
        lines.append(f'| {row["condition"]} | {row["coded_tasks"]} | '
                     f'{row["confirmed_agent_origin_exposures"]} | {row["final_survival_yes"]} | '
                     f'{row["final_survival_no"]} | {row["final_survival_unclear"]} |')
    lines.extend(['', '## RQ3 — participant-reviewed security checks', '',
                  '| Condition | Complete check-coded tasks | Tasks with a check | Reviewed checks | Before application | After application before continuation | After continuation |',
                  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'])
    for row in result['rq3']['checks_by_condition']:
        lines.append(f'| {row["condition"]} | {row["coded_tasks"]} | '
                     f'{row["tasks_with_reviewed_security_check"]} | {row["reviewed_security_checks"]} | '
                     f'{row["before_application"]} | {row["after_application_before_continuation"]} | '
                     f'{row["after_continuation"]} |')
    lines.extend(['', '## RQ4 — SQL injection and path traversal', '',
                  '| Condition | Class | Assigned features | Assessable final features | Vulnerable final features | Reviewed checks | Confirmed agent exposures |',
                  '| --- | --- | ---: | ---: | ---: | ---: | ---: |'])
    for row in result['rq4']['by_condition_and_class']:
        lines.append(f'| {row["condition"]} | {row["class"]} | {row["assigned_features"]} | '
                     f'{row["resolved_assessable"]} | {row["final_vulnerable"]} | '
                     f'{row["reviewed_security_checks"]} | {row["confirmed_agent_origin_exposures"]} |')
    warnings = result['rq1']['feature_analysis']['warnings'] + result['warnings']
    lines.extend(['', '## Missingness and interpretation', ''])
    lines.extend(f'- {warning}' for warning in warnings) if warnings else lines.append('- None reported by the validator.')
    lines.extend(['', result['interpretation'], '',
                  'Source SHA-256 hashes and individual rows are in the paired JSON output. '
                  'Review that output and the original coding sheets before reporting results.', ''])
    return '\n'.join(lines)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('analysis_folder', type=Path)
    parser.add_argument('--phase', required=True, choices=sorted(PHASES))
    parser.add_argument('--markdown-output', type=Path,
                        help='Optional path for a readable RQ summary; JSON still prints to stdout')
    args = parser.parse_args()
    result = analyse(args.analysis_folder, args.phase)
    if args.markdown_output:
        args.markdown_output.write_text(markdown_report(result), encoding='utf-8')
    print(json.dumps(result, indent=2, allow_nan=False))
