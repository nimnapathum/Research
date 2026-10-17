"""Audit received files and code hashes without extracting or executing submitted code."""
import argparse
import hashlib
import json
import stat
import zipfile
from pathlib import Path, PurePosixPath

KINDS = ['capture_zip', 'capture_health', 'final_zip', 'final_manifest', 'rating_json',
         'agent_transcript']


def digest_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def archive_manifests(path, task_id):
    manifests = []
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        if sum(item.file_size for item in entries) > 1024 * 1024 * 1024 or len(entries) > 80000:
            raise ValueError('Archive exceeds audit limits')
        names = [item.filename for item in entries]
        if len(names) != len(set(names)):
            raise ValueError('Duplicate ZIP members')
        for item in entries:
            name = PurePosixPath(item.filename)
            if name.is_absolute() or '..' in name.parts or '\\' in item.filename or ':' in item.filename:
                raise ValueError('Unsafe archive path')
            if stat.S_ISLNK(item.external_attr >> 16):
                raise ValueError('Archive includes a symlink')
            if item.file_size > 20 * 1024 * 1024:
                raise ValueError('Oversized archive member')
        for item in entries:
            if PurePosixPath(item.filename).name != 'SNAPSHOT_MANIFEST.json' or '__MACOSX' in item.filename:
                continue
            if item.file_size > 2 * 1024 * 1024:
                raise ValueError('Oversized manifest')
            manifest = json.loads(archive.read(item))
            if not isinstance(manifest, dict):
                raise ValueError('Manifest must be an object')
            if manifest.get('workspace') != task_id:
                raise ValueError('Snapshot task identity mismatch')
            prefix = item.filename[:-len('SNAPSHOT_MANIFEST.json')]
            files = manifest.get('files', [])
            if not files or len(files) > 300 or len({row['path'] for row in files}) != len(files):
                raise ValueError('Invalid file list')
            tree = hashlib.sha256()
            for row in sorted(files, key=lambda row: row['path']):
                relative = PurePosixPath(row['path'])
                if relative.is_absolute() or '..' in relative.parts or '\\' in row['path'] or ':' in row['path']:
                    raise ValueError('Unsafe manifest path')
                member = archive.getinfo(prefix + row['path'])
                if member.file_size > 2 * 1024 * 1024:
                    raise ValueError('Source file exceeds capture limit')
                data = archive.read(member)
                if hashlib.sha256(data).hexdigest() != row['sha256']:
                    raise ValueError('Source hash mismatch: ' + row['path'])
                tree.update(row['path'].encode() + b'\0file\0' + data + b'\0')
            if 'sha256:' + tree.hexdigest() != manifest.get('snapshot_sha256'):
                raise ValueError('Snapshot aggregate hash mismatch')
            manifests.append(manifest)
    if not manifests:
        raise ValueError('Archive contains no snapshot manifest')
    return manifests


def audit(folder):
    folder = Path(folder)
    task_id = folder.name
    issues, receipts, records = [], {}, {}
    for kind in KINDS:
        try:
            receipt = json.loads((folder / (kind + '.receipt.json')).read_text())
            data = folder / (kind + '.data')
            if receipt['task_id'] != task_id or receipt['kind'] != kind:
                raise ValueError('Receipt identity mismatch')
            if data.stat().st_size != receipt['size_bytes'] or digest_file(data) != receipt['sha256']:
                raise ValueError('Receipt content hash/size mismatch')
            receipts[kind] = receipt
        except (OSError, ValueError, KeyError) as error:
            issues.append(f'{kind}: {error}')
    for kind in ['final_manifest', 'rating_json', 'capture_health']:
        try:
            records[kind] = json.loads((folder / (kind + '.data')).read_text())
            if not isinstance(records[kind], dict):
                records[kind] = {}
                raise ValueError('Record must be an object')
        except (OSError, ValueError) as error:
            issues.append(f'{kind} JSON: {error}')
    final, capture = [], []
    for kind in ['final_zip', 'capture_zip']:
        try:
            found = archive_manifests(folder / (kind + '.data'), task_id)
            if kind == 'final_zip':
                final = found
                if len(final) != 1 or final[0] != records.get('final_manifest'):
                    issues.append('Final ZIP manifest differs from separately uploaded manifest')
            else:
                capture = found
        except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
            issues.append(f'{kind}: {error}')
    rating, manifest, health = (records.get(kind, {}) for kind in ['rating_json', 'final_manifest', 'capture_health'])
    if rating.get('participant_task_id') != task_id or rating.get('final_snapshot_sha256') != manifest.get('snapshot_sha256'):
        issues.append('Rating does not refer to the final task/hash')
    if not manifest.get('protocol_version') or len({manifest.get('protocol_version'),
            rating.get('protocol_version'), health.get('protocol_version')}) != 1:
        issues.append('Protocol version missing or inconsistent across final/rating/capture')
    for key in ['sql_probability_pct', 'path_probability_pct']:
        value = rating.get(key)
        if type(value) is not int or not 0 <= value <= 100:
            issues.append('Invalid rating: ' + key)
    if health.get('workspace') != task_id or health.get('status') != 'stopped' or health.get('errors'):
        issues.append('Watcher did not stop cleanly for this task')
    if len(capture) != health.get('snapshot_count'):
        issues.append('Capture snapshot count differs from health record')
    agent_capture = None
    observer_format = False
    try:
        lines = (folder / 'agent_transcript.data').read_text().strip().splitlines()
        first = json.loads(lines[0])
        if isinstance(first, dict) and first.get('kind') == 'study_agent_capture':
            observer_format = True
            agent_rows = [json.loads(line) for line in lines]
            agent_capture = agent_rows[-1]
            if (first.get('task_id') != task_id or agent_capture.get('kind') != 'capture_health' or
                    agent_capture.get('task_id') != task_id or first.get('protocol_version') != manifest.get('protocol_version') or
                    agent_capture.get('protocol_version') != manifest.get('protocol_version')):
                issues.append('Agent export task/protocol/footer mismatch')
            if agent_capture.get('transcript_records') != sum(row.get('kind') == 'transcript_record' for row in agent_rows):
                issues.append('Agent export record count mismatch')
            if agent_capture.get('status') != 'stopped' or agent_capture.get('errors'):
                issues.append('Agent capture reported missing records or errors; coverage review required')
    except (OSError, ValueError, IndexError, AttributeError):
        # Manual exports need human review; their storage hashes were checked above.
        if observer_format:
            issues.append('Observer transcript export could not be parsed')
    return {'task_id': task_id, 'automatic_integrity_pass': not issues, 'issues': issues,
            'verified_receipt_count': len(receipts), 'capture_snapshot_count': len(capture),
            'final_snapshot_sha256': manifest.get('snapshot_sha256'),
            'agent_capture_health': agent_capture,
            'manual_checks_required': ['open researcher-linked Meet video and check playback', 'transcript completeness', 'recording/snapshot clock alignment',
                                       'code/file coverage including omitted files', 'rating before researcher feedback',
                                       'interview linkage', 'blinded functionality/security assessment'],
            'note': 'This audit checks linked file integrity. It does not infer participant behaviour or establish code security.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('task_evidence_folder')
    args = parser.parse_args()
    result = audit(args.task_evidence_folder)
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result['automatic_integrity_pass'] else 1)
