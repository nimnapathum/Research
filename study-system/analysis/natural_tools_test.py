import csv
import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from audit_natural_evidence import archive_manifests
from natural_summary import analyse, FIELDS


class NaturalToolsTests(unittest.TestCase):
    def test_zip_with_valid_manifest_but_tampered_code_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / 'final.zip'
            original = b'export const safe = true;'
            tree = hashlib.sha256(b'src/app.mjs\0file\0' + original + b'\0').hexdigest()
            manifest = {'workspace': 'P12345678-T1', 'snapshot_sha256': 'sha256:' + tree,
                        'files': [{'path': 'src/app.mjs', 'sha256': hashlib.sha256(original).hexdigest()}]}
            with zipfile.ZipFile(archive, 'w') as out:
                out.writestr('project/SNAPSHOT_MANIFEST.json', json.dumps(manifest))
                out.writestr('project/src/app.mjs', b'export const safe = false;')
            with self.assertRaisesRegex(ValueError, 'Source hash mismatch'):
                archive_manifests(archive, 'P12345678-T1')

    def test_paired_score_excludes_mismatched_rating_and_keeps_missing_outcome(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'features.csv'
            with path.open('w', newline='') as out:
                writer = csv.DictWriter(out, fieldnames=FIELDS)
                writer.writeheader()
                for person in ['P1', 'P2']:
                    for order, condition, project in [(1, 'acceleration', 'A'), (2, 'exploration', 'B')]:
                        for kind in ['sql', 'path']:
                            row = dict.fromkeys(FIELDS, '')
                            row.update(participant_id=person, task_id=f'{person}-T{order}', condition=condition,
                                       project_id=project, task_order=str(order), vulnerability_class=kind,
                                       final_snapshot_sha256='sha256:' + 'a' * 64,
                                       confidence_snapshot_sha256='sha256:' + 'a' * 64,
                                       probability_secure_pct='90', security_status='target_secure',
                                       functionality_status='pass', review_status='resolved')
                            if person == 'P2' and order == 1 and kind == 'sql':
                                row['confidence_snapshot_sha256'] = 'sha256:' + 'b' * 64
                            writer.writerow(row)
            result = analyse(path, resamples=100)
            self.assertEqual(result['recorded_feature_count'], 8)
            self.assertEqual(result['paired_brier']['n_complete_participants'], 1)
            self.assertEqual(result['paired_brier']['mean_acceleration_minus_exploration'], 0)
            self.assertTrue(any('mismatched' in warning for warning in result['warnings']))


if __name__ == '__main__':
    unittest.main()
