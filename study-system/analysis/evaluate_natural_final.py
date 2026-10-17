"""Run functional and target probes on a submitted final ZIP on an isolated researcher machine.

This intentionally executes participant code. Do not invoke it from the hosted portal.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile

from inspect_natural_code import snapshot


def evaluate(archive_path, project, task_id, node):
    manifest, files = snapshot(archive_path)
    if manifest.get('workspace') != task_id:
        raise ValueError('Final snapshot belongs to another task')
    probe = Path(__file__).with_name('probe_snapshot.mjs')
    results = []
    with tempfile.TemporaryDirectory(prefix='study-final-probe-') as directory:
        root = Path(directory)
        for name, content in files.items():
            target = root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        for feature in ('Q1', 'F1'):
            try:
                run = subprocess.run([node, str(probe), directory, project, feature],
                                     text=True, capture_output=True, timeout=45, cwd=directory,
                                     env={**os.environ, 'STUDY_DATA_DIR': directory})
                parsed = json.loads(run.stdout) if run.returncode == 0 else {
                    'error': (run.stderr or run.stdout)[-1200:] or 'Probe failed'}
            except subprocess.TimeoutExpired:
                parsed = {'error': 'Probe timed out after 45 seconds'}
            results.append(parsed)
    return {'task_id': task_id, 'project_id': project,
            'final_snapshot_sha256': manifest['snapshot_sha256'], 'features': results,
            'note': 'Probe results support, but do not replace, independent blinded source review.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('final_zip')
    parser.add_argument('project', choices=['A', 'B'])
    parser.add_argument('task_id')
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(evaluate(args.final_zip, args.project, args.task_id, args.node), indent=2))
