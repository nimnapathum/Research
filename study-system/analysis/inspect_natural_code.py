"""Read-only, bounded comparison of initial and final study ZIPs. Never executes submitted code."""
import difflib
import hashlib
import json
import stat
import sys
import zipfile
from pathlib import PurePosixPath


def snapshot(path, initial=False):
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
        if initial:
            options = [name for name in options if 'S0001' in PurePosixPath(name).parts]
        if len(options) != 1:
            raise ValueError('Expected one ' + ('initial' if initial else 'final') + ' snapshot manifest')
        name = options[0]
        if archive.getinfo(name).file_size > 2 * 1024 * 1024:
            raise ValueError('Manifest exceeds limit')
        manifest = json.loads(archive.read(name))
        prefix = name[:-len('SNAPSHOT_MANIFEST.json')]
        rows = manifest.get('files', [])
        if not isinstance(rows, list) or not rows or len(rows) > 300:
            raise ValueError('Invalid manifest file list')
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


def inspect(initial_zip, final_zip, task_id):
    first, before = snapshot(initial_zip, initial=True)
    last, after = snapshot(final_zip)
    if first.get('workspace') != task_id or last.get('workspace') != task_id:
        raise ValueError('Snapshot belongs to a different task')
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
            'final_snapshot_sha256': last['snapshot_sha256'], 'changed': changed, 'final_source': source,
            'note': 'Read-only diff and hash check. No functional or security verdict; review the code and independent probes.'}


if __name__ == '__main__':
    if len(sys.argv) != 4 or not sys.argv[3].startswith('P'):
        raise SystemExit('Usage: inspect_natural_code.py CAPTURE_ZIP FINAL_ZIP TASK_ID')
    try:
        print(json.dumps(inspect(*sys.argv[1:]), ensure_ascii=False))
    except (ValueError, KeyError, TypeError, OSError, zipfile.BadZipFile) as error:
        print(json.dumps({'error': str(error)}))
        raise SystemExit(1)
