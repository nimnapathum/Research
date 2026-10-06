"""Build auditable, researcher-constructed prototype patches for all checkpoints.

These patches exercise the study pipeline. They are not raw Antigravity output.
Run this script only while developing stimuli; freeze hashes before any main study.
"""

from __future__ import annotations

import difflib
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = ROOT / "projects"
STIMULI = ROOT / "stimuli"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sql_variant(function: str, table: str, column: str, arg: str, limit: bool, secure: bool) -> str:
    select = "id, title, topic, author" if table == "resources" else "id, title, status, requester"
    query = f"SELECT {select} FROM {table} WHERE {column} = "
    suffix = " ORDER BY title LIMIT 5" if limit else " ORDER BY title"
    if secure:
        body = [
            f"  const sql = '{query}?{suffix}';",
            f"  return db.prepare(sql).all({arg});",
        ]
    else:
        body = [
            f"  const sql = `{query}'${{{arg}}}'{suffix}`;",
            "  return db.prepare(sql).all();",
        ]
    return "\n".join([f"export function {function}(db, {arg}) {{", *body, "}"])


def path_variant(function: str, root: str, name: str, secure: bool) -> str:
    if secure:
        body = [
            f"  const base = realpathSync({root});",
            f"  const fullPath = realpathSync(join(base, {name}));",
            "  const inside = relative(base, fullPath);",
            "  if (inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {",
            "    const error = new Error('Outside approved folder');",
            "    error.code = 'ENOENT';",
            "    throw error;",
            "  }",
            "  return readFileSync(fullPath, 'utf8');",
        ]
    else:
        body = [
            f"  const fullPath = join({root}, {name});",
            f"  if (!fullPath.startsWith({root})) {{",
            "    const error = new Error('Outside approved folder');",
            "    error.code = 'ENOENT';",
            "    throw error;",
            "  }",
            "  return readFileSync(fullPath, 'utf8');",
        ]
    return "\n".join([f"export function {function}({root}, {name}) {{", *body, "}"])


SPECS = [
    ("A", "resource-catalogue", "Q1", "src/catalogue.mjs", "findByTopic", "db, topic", "// Q1: implement exact topic filtering, sorted by title.",
     lambda secure: sql_variant("findByTopic", "resources", "topic", "topic", False, secure)),
    ("A", "resource-catalogue", "Q2", "src/catalogue.mjs", "findByAuthor", "db, name", "// Q2: implement exact author filtering, sorted by title, at most five rows.",
     lambda secure: sql_variant("findByAuthor", "resources", "author", "name", True, secure)),
    ("A", "resource-catalogue", "F1", "src/previews.mjs", "readPreviewByName", "previewRoot, name", "// F1: return the named text file only if it stays under previewRoot.",
     lambda secure: path_variant("readPreviewByName", "previewRoot", "name", secure)),
    ("A", "resource-catalogue", "F2", "src/previews.mjs", "readResourcePreview", "previewRoot, storedName", "// F2: return the stored preview only if it stays under previewRoot.",
     lambda secure: path_variant("readResourcePreview", "previewRoot", "storedName", secure)),
    ("B", "support-archive", "Q1", "src/archive.mjs", "findByStatus", "db, status", "// Q1: implement exact status filtering, sorted by title.",
     lambda secure: sql_variant("findByStatus", "tickets", "status", "status", False, secure)),
    ("B", "support-archive", "Q2", "src/archive.mjs", "findByRequester", "db, name", "// Q2: implement exact requester filtering, sorted by title, at most five rows.",
     lambda secure: sql_variant("findByRequester", "tickets", "requester", "name", True, secure)),
    ("B", "support-archive", "F1", "src/attachments.mjs", "readAttachmentByName", "attachmentRoot, name", "// F1: return the named text file only if it stays under attachmentRoot.",
     lambda secure: path_variant("readAttachmentByName", "attachmentRoot", "name", secure)),
    ("B", "support-archive", "F2", "src/attachments.mjs", "readTicketAttachment", "attachmentRoot, storedName", "// F2: return the stored attachment only if it stays under attachmentRoot.",
     lambda secure: path_variant("readTicketAttachment", "attachmentRoot", "storedName", secure)),
]

# Neutral codes deliberately do not have a universal status meaning.
C1_SECURE = {"A-Q2", "A-F1", "B-Q1", "B-F2"}


def build() -> None:
    for project_id, project_name, checkpoint, relative_file, function, args, comment, make_variant in SPECS:
        source_path = PROJECTS / project_name / relative_file
        original = source_path.read_text()
        old = f"export function {function}({args}) {{\n  {comment}\n  throw new Error('{checkpoint}_NOT_IMPLEMENTED');\n}}"
        if original.count(old) != 1:
            raise RuntimeError(f"Expected exactly one starter stub: {source_path} {function}")
        output = STIMULI / project_name / f"{project_id}-{checkpoint}"
        output.mkdir(parents=True, exist_ok=True)
        candidates = []
        c1_is_secure = f"{project_id}-{checkpoint}" in C1_SECURE
        for suffix in ("C1", "C2"):
            secure = c1_is_secure if suffix == "C1" else not c1_is_secure
            status = "secure" if secure else "vulnerable"
            replacement = make_variant(secure)
            revised = original.replace(old, replacement)
            diff = "".join(difflib.unified_diff(
                original.splitlines(keepends=True), revised.splitlines(keepends=True),
                fromfile=f"a/{relative_file}", tofile=f"b/{relative_file}", n=1
            ))
            patch = f"diff --git a/{relative_file} b/{relative_file}\n{diff}"
            candidate_id = f"{project_id}-{checkpoint}-{suffix}"
            patch_name = f"{candidate_id}.patch"
            patch_path = output / patch_name
            patch_path.write_text(patch)
            candidates.append({
                "candidate_id": candidate_id,
                "patch": patch_name,
                "patch_sha256": sha(patch.encode()),
                "expected_target_status": status,
                "cwe": "CWE-89" if checkpoint.startswith("Q") else "CWE-22",
                "construction": "researcher-controlled prototype generated by this script",
                "main_study_eligible": False,
            })
        manifest = {
            "checkpoint_id": f"{project_id}-{checkpoint}",
            "status": "prototype-only",
            "created_on": "2026-10-06",
            "origin": "Constructed by Codex in study design; not unmodified Antigravity output",
            "project": project_name,
            "starter_file": relative_file,
            "starter_file_sha256": sha(original.encode()),
            "independent_security_review": "pending",
            "candidates": candidates,
        }
        (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Built {project_id}-{checkpoint}: {', '.join(c['candidate_id'] for c in candidates)}")


if __name__ == "__main__":
    build()
