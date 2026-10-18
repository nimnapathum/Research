import csv
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from natural_behavior_report import analyse, markdown_report


TEMPLATES = Path(__file__).parent / 'natural-templates'
HASH = 'sha256:' + 'a' * 64


def write_table(folder, name, rows):
    with (TEMPLATES / f'{name}.csv').open(newline='') as source:
        fields = next(csv.reader(source))
    with (folder / f'{name}.csv').open('w', newline='') as target:
        writer = csv.DictWriter(target, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


class NaturalBehaviorReportTest(unittest.TestCase):
    def test_rq_links_and_explicit_zero_coding(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            people = ['P11111111', 'P22222222']
            features, sessions, statuses, episodes, checks, exposures = [], [], [], [], [], []
            for person in people:
                for order, condition, project in [(1, 'acceleration', 'A'), (2, 'exploration', 'B')]:
                    task = f'{person}-T{order}'
                    sessions.append(dict(participant_id=person, task_id=task, study_phase='pilot'))
                    statuses.append(dict(participant_id=person, task_id=task, mode_status='complete',
                                         checks_status='complete', exposure_status='complete',
                                         interview_status='pending', resolved_by='analyst-1', evidence_ref='video:01'))
                    episodes.append(dict(participant_id=person, task_id=task, episode_id='E1',
                                         coder_id='resolved', start_seconds='0', end_seconds='10',
                                         mode=condition, active_or_waiting='active', trace_ref='video:01'))
                    for weakness in ['sql', 'path']:
                        vulnerable = (person == people[0] and order == 1 and weakness == 'sql')
                        features.append(dict(participant_id=person, task_id=task, condition=condition,
                                             project_id=project, task_order=order,
                                             vulnerability_class=weakness, final_snapshot_sha256=HASH,
                                             confidence_snapshot_sha256=HASH, probability_secure_pct='80',
                                             security_status='vulnerable' if vulnerable else 'target_secure',
                                             functionality_status='pass', review_status='resolved',
                                             evidence_ref='review:01'))
                    if person == people[0] and order == 1:
                        checks.append(dict(participant_id=person, task_id=task, change_id='C1', check_id='K1',
                                           coder_id='resolved', time_start_seconds='5', time_end_seconds='6',
                                           actor='participant', vulnerability_class='sql', category='attack_test',
                                           security_purpose='yes', timing_relative_to_integration='after_continuation',
                                           result_reviewed='yes', issue_identified='yes', evidence_ref='video:05'))
                        exposures.append(dict(participant_id=person, task_id=task, change_id='C1',
                                              vulnerability_class='sql', origin_status='confirmed_agent',
                                              exposure_confirmed='yes', intentional_repair='no',
                                              final_survival='yes', evidence_ref='code:01'))
            for name, rows in [('features', features), ('session_log', sessions),
                               ('coding_status', statuses), ('episodes', episodes),
                               ('checks', checks), ('exposures', exposures)]:
                write_table(folder, name, rows)
            result = analyse(folder, 'pilot')
            self.assertEqual(result['coverage']['tasks'], 4)
            self.assertEqual(result['rq1']['feature_analysis']['paired_brier']['n_complete_participants'], 2)
            self.assertEqual(result['rq2']['paired_vulnerable_count']['n_complete_participants'], 2)
            self.assertIsNone(result['rq2']['paired_vulnerable_count']['bootstrap_95_percent_interval'])
            self.assertEqual(result['rq2']['confirmed_exposure_flow'][0]['final_survival_yes'], 1)
            self.assertEqual(result['rq3']['checks_by_condition'][0]['tasks_with_reviewed_security_check'], 1)
            self.assertEqual(result['rq3']['checks_by_condition'][1]['tasks_with_reviewed_security_check'], 0)
            self.assertEqual(result['rq4']['by_condition_and_class'][0]['final_vulnerable'], 1)
            readable = markdown_report(result)
            self.assertIn('RQ1 — confidence and assessed security', readable)
            self.assertIn('Complete paired vulnerable-feature counts: **2 participants**', readable)
            self.assertIn('| exploration | 2 | 0 | 0 | 0 | 0 | 0 |', readable)
            with self.assertRaises(ValueError):
                analyse(folder, 'main')
            features[-1]['security_status'] = ''
            features[-1]['functionality_status'] = ''
            features[-1]['review_status'] = 'unreviewed'
            features[-1]['missing_reason'] = 'not_reviewed'
            write_table(folder, 'features', features)
            incomplete = analyse(folder, 'pilot')
            self.assertEqual(incomplete['rq1']['feature_analysis']['paired_brier']['n_complete_participants'], 1)
            self.assertEqual(incomplete['rq2']['paired_vulnerable_count']['n_complete_participants'], 1)


if __name__ == '__main__':
    unittest.main()
