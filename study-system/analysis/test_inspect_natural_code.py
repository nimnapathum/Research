"""Exercise snapshot selection with small synthetic, read-only archives."""
import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from inspect_natural_code import inspect, summarize


TASK = 'P12345678-T1'


def manifest(source, captured_at):
    digest = hashlib.sha256(source)
    tree = hashlib.sha256(b'src/example.mjs\0file\0' + source + b'\0')
    return {'workspace': TASK, 'protocol_version': 'natural-test', 'captured_at': captured_at,
            'snapshot_sha256': 'sha256:' + tree.hexdigest(),
            'files': [{'path': 'src/example.mjs', 'kind': 'file', 'sha256': digest.hexdigest()}]}


class SnapshotInspectionTest(unittest.TestCase):
    def test_timeline_and_selected_change(self):
        with tempfile.TemporaryDirectory() as folder:
            capture = Path(folder, 'capture.zip')
            final = Path(folder, 'final.zip')
            sources = [b'export const value = 1;\n', b'export const value = 2;\n', b'export const value = 2;\n']
            with zipfile.ZipFile(capture, 'w') as archive:
                for index, source in enumerate(sources, 1):
                    prefix = f'S{index:04d}/'
                    archive.writestr(prefix + 'src/example.mjs', source)
                    archive.writestr(prefix + 'SNAPSHOT_MANIFEST.json', json.dumps(manifest(source, f'2026-10-18T00:00:0{index}Z')))
            with zipfile.ZipFile(final, 'w') as archive:
                archive.writestr('src/example.mjs', sources[-1])
                archive.writestr('SNAPSHOT_MANIFEST.json', json.dumps(manifest(sources[-1], '2026-10-18T00:01:00Z')))
            whole = inspect(str(capture), str(final), TASK)
            self.assertEqual([row['changed_files'] for row in whole['timeline']],
                             [[], ['src/example.mjs'], []])
            self.assertIn('+export const value = 2;', whole['changed'][0]['diff'])
            selected = inspect(str(capture), str(final), TASK, 'S0002')
            self.assertEqual(selected['comparison_label'], 'S0001 → S0002')
            self.assertIn('-export const value = 1;', selected['changed'][0]['diff'])
            self.assertEqual(inspect(str(capture), str(final), TASK, 'S0003')['changed'], [])
            summary = summarize(str(capture), str(final), TASK)
            self.assertEqual(summary['snapshot_count'], 3)
            self.assertEqual(summary['source_change_snapshots'], 1)
            self.assertEqual(summary['source_files_changed'], 1)
            self.assertEqual((summary['source_lines_added'], summary['source_lines_removed']), (1, 1))
            self.assertEqual(summary['final_snapshot_sha256'], manifest(sources[-1], '')['snapshot_sha256'])
            with self.assertRaises(ValueError):
                inspect(str(capture), str(final), TASK, '../S0002')


if __name__ == '__main__':
    unittest.main()
