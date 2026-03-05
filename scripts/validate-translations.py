#!/usr/bin/env python3
"""
Translation validation script.
Compares modified JSON files against their git HEAD version
and flags any change outside of allowed translation fields.

Usage:
    python3 scripts/validate-translations.py                    # all data files
    python3 scripts/validate-translations.py wwm_glossary.json  # specific file
"""

import json
import subprocess
import sys
import os
from pathlib import Path
from typing import Any

DATA_DIR = Path("src/data")

# --- Fields that translators CAN modify ---
ALLOWED_KEYS = frozenset({
    "en", "cn", "fr", "pinyin",
    "nameFR", "nameEN", "nameCN",
    "descriptionFR", "descriptionEN", "descriptionCN",
})

# Parent keys whose children are always translatable
TRANSLATION_PARENTS = frozenset({
    "names", "name", "description", "descriptions",
    "full_path", "philosophy", "rules",
    "tier_names_fr", "tier_names_en",
})

# --- Fields that must NEVER change ---
FORBIDDEN_KEYS = frozenset({
    "id", "version", "total_count", "total_weapons",
    "sources", "last_updated", "lastUpdate", "extractionDate",
    "completion_rate", "data_version",
})


def get_git_version(filepath):
    """Get the HEAD version of a file from git."""
    try:
        result = subprocess.run(
            ["git", "show", "HEAD:" + filepath],
            capture_output=True, text=True, check=True
        )
        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return None


def get_working_version(filepath):
    """Get the current working copy of a file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print("  ERROR: cannot read {}: {}".format(filepath, e))
        return None


def is_translation_field(path):
    """Check if a JSON path points to a translation-safe field."""
    if not path:
        return False

    key = path[-1]
    parent = path[-2] if len(path) >= 2 else None

    if parent in TRANSLATION_PARENTS and key in ALLOWED_KEYS:
        return True

    if key in {"nameFR", "nameEN", "nameCN",
               "descriptionFR", "descriptionEN", "descriptionCN"}:
        return True

    if any(p == "rules" for p in path) and key in ALLOWED_KEYS:
        return True

    return False


def diff_values(old, new, path, violations, changes):
    """Recursively compare two JSON values and collect violations."""
    if old == new:
        return

    if isinstance(old, dict) and isinstance(new, dict):
        all_keys = set(old.keys()) | set(new.keys())
        for k in sorted(all_keys):
            child_path = path + [k]

            if k in new and k not in old:
                violations.append({
                    "path": ".".join(child_path),
                    "type": "ADDED_KEY",
                    "value": truncate(new[k]),
                })
                continue

            if k in old and k not in new:
                violations.append({
                    "path": ".".join(child_path),
                    "type": "REMOVED_KEY",
                    "old": truncate(old[k]),
                })
                continue

            diff_values(old[k], new[k], child_path, violations, changes)

    elif isinstance(old, list) and isinstance(new, list):
        if len(old) != len(new):
            violations.append({
                "path": ".".join(path),
                "type": "ARRAY_LENGTH_CHANGED",
                "old_len": len(old),
                "new_len": len(new),
            })
            return

        for i in range(len(old)):
            diff_values(old[i], new[i], path + [str(i)], violations, changes)

    else:
        entry = {
            "path": ".".join(path),
            "old": truncate(old),
            "new": truncate(new),
        }

        key = path[-1] if path else ""

        if key in FORBIDDEN_KEYS:
            entry["type"] = "FORBIDDEN_FIELD"
            violations.append(entry)
        elif isinstance(old, (int, float)) and not isinstance(old, bool):
            entry["type"] = "NUMERIC_CHANGED"
            violations.append(entry)
        elif isinstance(old, bool):
            entry["type"] = "BOOLEAN_CHANGED"
            violations.append(entry)
        elif is_translation_field(path):
            entry["type"] = "TRANSLATION"
            changes.append(entry)
        elif isinstance(old, str) and isinstance(new, str):
            if " " not in old and old.replace("_", "").replace("-", "").isalnum():
                entry["type"] = "CODE_KEY_CHANGED"
                violations.append(entry)
            else:
                entry["type"] = "TEXT_CHANGED_UNKNOWN"
                violations.append(entry)
        else:
            entry["type"] = "TYPE_CHANGED"
            violations.append(entry)


def truncate(val, max_len=60):
    """Truncate a value for display."""
    s = str(val)
    return s[:max_len] + "..." if len(s) > max_len else s


def validate_file(filename):
    """Validate a single file. Returns (violations, changes)."""
    filepath = str(DATA_DIR / filename)
    print("")
    print("=" * 60)
    print("  Checking: {}".format(filepath))
    print("=" * 60)

    old = get_git_version(filepath)
    if old is None:
        print("  SKIP: not found in git HEAD (new file?)")
        return 0, 0

    new = get_working_version(filepath)
    if new is None:
        return 1, 0

    violations = []
    changes = []
    diff_values(old, new, [], violations, changes)

    if not violations and not changes:
        print("  No changes detected.")
        return 0, 0

    if changes:
        print("")
        print("  VALID translation changes ({}):".format(len(changes)))
        for c in changes:
            print("    OK   {}".format(c["path"]))
            print("         {} -> {}".format(c["old"], c["new"]))

    if violations:
        print("")
        print("  VIOLATIONS ({}):".format(len(violations)))
        for v in violations:
            vtype = v["type"]
            print("    FAIL [{}] {}".format(vtype, v["path"]))
            if "old" in v and "new" in v:
                print("         {} -> {}".format(v["old"], v["new"]))
            elif "value" in v:
                print("         added: {}".format(v["value"]))
            elif "old" in v:
                print("         removed: {}".format(v["old"]))
            elif "old_len" in v:
                print("         {} items -> {} items".format(
                    v["old_len"], v["new_len"]))

    return len(violations), len(changes)


def main():
    if not DATA_DIR.exists():
        print("ERROR: {} not found. Run from project root.".format(DATA_DIR))
        sys.exit(1)

    if len(sys.argv) > 1:
        files = sys.argv[1:]
    else:
        files = sorted(f.name for f in DATA_DIR.glob("wwm_*.json"))

    if not files:
        print("No JSON files found.")
        sys.exit(1)

    total_violations = 0
    total_changes = 0

    for f in files:
        v, c = validate_file(f)
        total_violations += v
        total_changes += c

    print("")
    print("=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print("  Files checked:       {}".format(len(files)))
    print("  Valid translations:  {}".format(total_changes))
    print("  Violations:          {}".format(total_violations))

    if total_violations > 0:
        print("")
        print("  FAILED -- {} violation(s) found.".format(total_violations))
        print("  Only name/description/label fields should be modified.")
        print("  See docs/contributing/TRANSLATION_GUIDE.md")
        sys.exit(1)
    else:
        print("")
        print("  PASSED -- all changes are valid translations.")
        sys.exit(0)


if __name__ == "__main__":
    main()
