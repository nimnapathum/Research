"""Read-only, bounded comparison of initial and final study ZIPs. Never executes submitted code."""
import difflib
import hashlib
import json
import re
import stat
import sys
import zipfile
from pathlib import PurePosixPath


def snapshot(path, initial=False, snapshot_id=None):
    with zipfile.ZipFile(path) as archive:
        members = archive.infolist()
        if len(members) > 80000 or sum(row.file_size for row in members) > 1024 * 1024 * 1024:
            raise ValueError('Archive exceeds inspection limits')
        names = [row.filename for row in members]
        if len(names) != len(set(names)):
            raise ValueError('Archive has duplicate members')
        for row in members:
            name = PurePosixPath(row.filename)
            if name.is_absolute() or '..' in name.parts or '\\' in row.filename or ':' in row.filename:
                raise ValueError('Unsafe archive path')
            if stat.S_ISLNK(row.external_attr >> 16) or row.file_size > 20 * 1024 * 1024:
                raise ValueError('Unsupported archive member')
        options = [row.filename for row in members if PurePosixPath(row.filename).name == 'SNAPSHOT_MANIFEST.json'
                   and '__MACOSX' not in row.filename]
        if initial or snapshot_id:
            target = snapshot_id or 'S0001'
            options = [name for name in options if target in PurePosixPath(name).parts]
        if len(options) != 1:
            raise ValueError('Expected one ' + (snapshot_id or ('initial' if initial else 'final')) + ' snapshot manifest')
        name = options[0]
        if archive.getinfo(name).file_size > 2 * 1024 * 1024:
            raise ValueError('Manifest exceeds limit')
        manifest = json.loads(archive.read(name))
        prefix = name[:-len('SNAPSHOT_MANIFEST.json')]
        rows = manifest.get('files', [])
        if not isinstance(rows, list) or not rows or len(rows) > 300:
            raise ValueError('Invalid manifest file list')
        if sum(archive.getinfo(prefix + row['path']).file_size for row in rows) > 20 * 1024 * 1024:
            raise ValueError('Snapshot source exceeds 20 MiB capture limit')
        files = {}
        tree = hashlib.sha256()
        for row in sorted(rows, key=lambda item: item['path']):
            relative = row['path']
            name_parts = PurePosixPath(relative)
            if name_parts.is_absolute() or '..' in name_parts.parts or '\\' in relative or ':' in relative or relative in files:
                raise ValueError('Unsafe or duplicate source path')
            member = archive.getinfo(prefix + relative)
            if member.file_size > 2 * 1024 * 1024:
                raise ValueError('Source file exceeds limit')
            data = archive.read(member)
            if hashlib.sha256(data).hexdigest() != row['sha256']:
                raise ValueError('Source hash mismatch: ' + relative)
            tree.update(relative.encode() + b'\0file\0' + data + b'\0')
            files[relative] = data
        actual = 'sha256:' + tree.hexdigest()
        if actual != manifest.get('snapshot_sha256'):
            raise ValueError('Snapshot hash mismatch')
        return manifest, files


def capture_timeline(path, task_id):
    """Read bounded snapshot manifests only; individual source bytes are checked when opened."""
    rows = []
    with zipfile.ZipFile(path) as archive:
        members = archive.infolist()
        if len(members) > 80000 or sum(row.file_size for row in members) > 1024 * 1024 * 1024:
            raise ValueError('Archive exceeds inspection limits')
        names = [row.filename for row in members]
        if len(names) != len(set(names)):
            raise ValueError('Archive has duplicate members')
        for member in members:
            name = PurePosixPath(member.filename)
            if name.is_absolute() or '..' in name.parts or '\\' in member.filename or ':' in member.filename:
                raise ValueError('Unsafe archive path')
            if stat.S_ISLNK(member.external_attr >> 16) or member.file_size > 20 * 1024 * 1024:
                raise ValueError('Unsupported archive member')
            if name.name != 'SNAPSHOT_MANIFEST.json':
                continue
            found = [part for part in name.parts if re.fullmatch(r'S\d{4}', part)]
            if len(found) != 1:
                continue
            if member.file_size > 2 * 1024 * 1024:
                raise ValueError('Manifest exceeds limit')
            manifest = json.loads(archive.read(member))
            if manifest.get('workspace') != task_id or not isinstance(manifest.get('files'), list):
                raise ValueError('Capture snapshot identity or file list is invalid')
            files = manifest['files']
            if len(files) > 300:
                raise ValueError('Snapshot file list exceeds limit')
            fingerprint = {}
            for item in files:
                file_path = item['path']
                if not isinstance(file_path, str) or not re.fullmatch(r'[a-f0-9]{64}', str(item['sha256'])):
                    raise ValueError('Invalid snapshot file record')
                file_name = PurePosixPath(file_path)
                if file_name.is_absolute() or '..' in file_name.parts or '\\' in file_path or ':' in file_path or file_path in fingerprint:
                    raise ValueError('Unsafe or duplicate snapshot file path')
                fingerprint[file_path] = item['sha256']
            rows.append({'id': found[0], 'captured_at': manifest.get('captured_at'),
                         'snapshot_sha256': manifest.get('snapshot_sha256'), 'files': fingerprint})
    rows.sort(key=lambda row: row['id'])
    if len(rows) > 250 or len({row['id'] for row in rows}) != len(rows):
        raise ValueError('Invalid capture snapshot sequence')
    previous = None
    timeline = []
    for row in rows:
        changed = [] if previous is None else sorted(path for path in row['files'].keys() | previous.keys()
                                                    if row['files'].get(path) != previous.get(path))
        timeline.append({'id': row['id'], 'captured_at': row['captured_at'],
                         'snapshot_sha256': row['snapshot_sha256'], 'file_count': len(row['files']),
                         'changed_files': changed})
        previous = row['files']
    return timeline


def inspect(initial_zip, final_zip, task_id, selected=None):
    if selected and not re.fullmatch(r'S\d{4}', selected):
        raise ValueError('Invalid snapshot selection')
    timeline = capture_timeline(initial_zip, task_id)
    if not timeline or timeline[0]['id'] != 'S0001':
        raise ValueError('Initial snapshot is missing')
    first, before = snapshot(initial_zip, initial=True)
    last, after = snapshot(final_zip)
    if first.get('workspace') != task_id or last.get('workspace') != task_id:
        raise ValueError('Snapshot belongs to a different task')
    comparison_label = 'Initial → final'
    if selected:
        positions = {row['id']: index for index, row in enumerate(timeline)}
        if selected not in positions:
            raise ValueError('Selected snapshot is not in the code history')
        index = positions[selected]
        if index:
            previous_id = timeline[index - 1]['id']
            _, before = snapshot(initial_zip, snapshot_id=previous_id)
            comparison_label = previous_id + ' → ' + selected
        else:
            comparison_label = 'Initial ' + selected
        _, after = snapshot(initial_zip, snapshot_id=selected)
    changed = []
    for path in sorted(before.keys() | after.keys()):
        old = before.get(path)
        new = after.get(path)
        if old == new:
            continue
        if old is not None and b'\0' in old or new is not None and b'\0' in new:
            changed.append({'path': path, 'status': 'binary', 'diff': ''})
            continue
        status = 'added' if old is None else 'removed' if new is None else 'modified'
        old_lines = (old or b'').decode('utf-8', 'replace').splitlines(keepends=True)
        new_lines = (new or b'').decode('utf-8', 'replace').splitlines(keepends=True)
        diff = ''.join(difflib.unified_diff(old_lines, new_lines, fromfile='initial/' + path,
                                            tofile='final/' + path))
        changed.append({'path': path, 'status': status, 'diff': diff[:30000],
                        'truncated': len(diff) > 30000})
    source = []
    for path, data in sorted(after.items()):
        if not (path.startswith('src/') or path.startswith('lib/')) or b'\0' in data:
            continue
        code = data.decode('utf-8', 'replace')
        source.append({'path': path, 'code': code[:30000], 'truncated': len(code) > 30000})
    return {'task_id': task_id, 'initial_snapshot_sha256': first['snapshot_sha256'],
            'final_snapshot_sha256': last['snapshot_sha256'], 'timeline': timeline,
            'comparison_label': comparison_label, 'selected_snapshot': selected,
            'changed': changed, 'final_source': source,
            'note': 'Read-only diff and hash check. No functional or security verdict; review the code and independent probes.'}


def summarize(initial_zip, final_zip, task_id):
    """Bounded, hash-checked edit counts; these are activity measures, not review or security scores."""
    timeline = capture_timeline(initial_zip, task_id)
    if not timeline or timeline[0]['id'] != 'S0001':
        raise ValueError('Initial snapshot is missing')
    first, before = snapshot(initial_zip, initial=True)
    last, after = snapshot(final_zip)
    if first.get('workspace') != task_id or last.get('workspace') != task_id:
        raise ValueError('Snapshot belongs to a different task')
    source = lambda path: path.startswith(('src/', 'lib/'))
    paths = sorted(path for path in before.keys() | after.keys()
                   if source(path) and before.get(path) != after.get(path))
    added = removed = 0
    for path in paths:
        old = before.get(path, b'')
        new = after.get(path, b'')
        if b'\0' in old or b'\0' in new:
            continue
        left = old.decode('utf-8', 'replace').splitlines()
        right = new.decode('utf-8', 'replace').splitlines()
        for operation, start_old, end_old, start_new, end_new in difflib.SequenceMatcher(
                None, left, right, autojunk=False).get_opcodes():
            if operation != 'equal':
                removed += end_old - start_old
                added += end_new - start_new
    changed_snapshots = sum(any(source(path) for path in row['changed_files']) for row in timeline[1:])
    return {'task_id': task_id, 'initial_snapshot_sha256': first['snapshot_sha256'],
            'final_snapshot_sha256': last['snapshot_sha256'], 'snapshot_count': len(timeline),
            'source_change_snapshots': changed_snapshots, 'source_files_changed': len(paths),
            'source_lines_added': added, 'source_lines_removed': removed,
            'source_paths': paths,
            'note': 'Snapshot intervals and initial-to-final source-line differences; no attribution, security verdict, or verification inference.'}


if __name__ == '__main__':
    if len(sys.argv) not in (4, 5) or not sys.argv[3].startswith('P'):
        raise SystemExit('Usage: inspect_natural_code.py CAPTURE_ZIP FINAL_ZIP TASK_ID [SNAPSHOT_ID|--summary]')
    try:
        result = summarize(*sys.argv[1:4]) if len(sys.argv) == 5 and sys.argv[4] == '--summary' else inspect(*sys.argv[1:])
        print(json.dumps(result, ensure_ascii=False))
    except (ValueError, KeyError, TypeError, OSError, zipfile.BadZipFile) as error:
        print(json.dumps({'error': str(error)}))
        raise SystemExit(1)
