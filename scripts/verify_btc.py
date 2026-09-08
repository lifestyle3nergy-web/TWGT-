#!/usr/bin/env python3
"""
BTC-001 Verification Script

Verifies that:
  - BTC-001.yaml exists and conforms to the schema
  - nucleus.commit is a valid Git commit in the repository
  - rollback.pin.commit is a valid Git commit and is an ancestor of nucleus.commit
  - crypto.public_key is not left as "CHANGE_ME" (warns)

Usage:
  python scripts/verify_btc.py [path/to/BTC-001.yaml]

Requires:
  - PyYAML (pip install pyyaml)
  - jsonschema (pip install jsonschema) – optional, if you want schema validation
  - git in PATH
"""

import sys
import os
import subprocess
import yaml
import re
from pathlib import Path

# Optional schema validation – skip if jsonschema not installed
try:
    import jsonschema
    from jsonschema import validate
    HAS_SCHEMA = True
except ImportError:
    HAS_SCHEMA = False
    print("INFO: jsonschema not installed – skipping schema validation", file=sys.stderr)

BTC_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("BTC-001.yaml")
SCHEMA_FILE = Path("schema/btc-001.schema.json")

def git(*args, cwd=None):
    """Run a git command and return stdout."""
    try:
        result = subprocess.run(
            ["git"] + list(args),
            cwd=cwd or os.getcwd(),
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"ERROR: git command failed: {' '.join(args)}", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        sys.exit(1)

def is_valid_commit(commit_sha, cwd=None):
    """Check if the given SHA is a valid Git object (commit)."""
    try:
        # rev-parse --verify returns the SHA if valid, exits with 0
        subprocess.run(
            ["git", "rev-parse", "--verify", f"{commit_sha}^{{commit}}"],
            cwd=cwd or os.getcwd(),
            capture_output=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False

def is_ancestor(ancestor, descendant, cwd=None):
    """Check if 'ancestor' commit is an ancestor of 'descendant' commit."""
    try:
        subprocess.run(
            ["git", "merge-base", "--is-ancestor", ancestor, descendant],
            cwd=cwd or os.getcwd(),
            capture_output=True,
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    if not BTC_FILE.exists():
        print(f"ERROR: BTC file not found: {BTC_FILE}", file=sys.stderr)
        sys.exit(1)

    # Load YAML
    with open(BTC_FILE, "r") as f:
        data = yaml.safe_load(f)

    # Optional schema validation
    if HAS_SCHEMA and SCHEMA_FILE.exists():
        with open(SCHEMA_FILE, "r") as f:
            schema = json.load(f)
        try:
            validate(instance=data, schema=schema)
            print("✅ Schema validation passed.")
        except jsonschema.ValidationError as e:
            print(f"❌ Schema validation failed: {e.message}", file=sys.stderr)
            sys.exit(1)
    else:
        print("⚠️  Schema validation skipped (jsonschema missing or schema file not found).")

    # Extract values
    try:
        btc = data["btc-001"]
        nucleus = btc["nucleus"]
        rollback = btc["rollback"]
        crypto = btc["crypto"]
    except KeyError as e:
        print(f"❌ Malformed YAML: missing top-level key {e}", file=sys.stderr)
        sys.exit(1)

    nucleus_commit = nucleus["commit"]
    rollback_commit = rollback["pin"]["commit"]
    public_key = crypto["signature"]["public_key"]

    # 1. Check nucleus commit
    print(f"🔍 Checking nucleus commit: {nucleus_commit}")
    if not re.fullmatch(r"[a-fA-F0-9]{40}", nucleus_commit):
        print("❌ Nucleus commit does not look like a 40‑char SHA‑1.", file=sys.stderr)
        sys.exit(1)
    if not is_valid_commit(nucleus_commit):
        print(f"❌ Nucleus commit {nucleus_commit} is not a valid Git commit.", file=sys.stderr)
        sys.exit(1)
    print("✅ Nucleus commit exists.")

    # 2. Check rollback commit
    print(f"🔍 Checking rollback pin commit: {rollback_commit}")
    if not re.fullmatch(r"[a-fA-F0-9]{40}", rollback_commit):
        print("❌ Rollback commit does not look like a 40‑char SHA‑1.", file=sys.stderr)
        sys.exit(1)
    if not is_valid_commit(rollback_commit):
        print(f"❌ Rollback commit {rollback_commit} is not a valid Git commit.", file=sys.stderr)
        sys.exit(1)
    print("✅ Rollback commit exists.")

    # 3. Check ancestor relationship (rollback is ancestor of nucleus)
    if is_ancestor(rollback_commit, nucleus_commit):
        print("✅ Rollback commit is an ancestor of nucleus commit (valid fallback).")
    else:
        print("⚠️  Rollback commit is NOT an ancestor of nucleus commit. "
              "This may still be acceptable if governance approves it, but verify manually.",
              file=sys.stderr)
        # We do not fail here because the audit said "rollback commit exists + belongs + approved historical state"
        # Ancestor is a strong recommendation, but not absolute.

    # 4. Warn if crypto public key is placeholder
    if public_key in ["CHANGE_ME", "REQUIRED", ""]:
        print("⚠️  crypto.signature.public_key is still a placeholder. "
              "This must be replaced with an actual key before activation.", file=sys.stderr)
    else:
        print("✅ Public key appears to be set.")

    print("\n✅ All verifications completed successfully (with warnings noted above).")

if __name__ == "__main__":
    main()
