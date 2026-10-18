#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export TWGT_BOOTSTRAP_EVIDENCE="${TWGT_BOOTSTRAP_EVIDENCE:-$ROOT/activation/evidence/bootstrap.json}"
export TWGT_REPOSITORY="${TWGT_REPOSITORY:-lifestyle3nergy-web/TWGT-}"
export TWGT_RUNTIME_DIR="${TWGT_RUNTIME_DIR:-${PREFIX:-/var}/lib/twgt}"

[[ -f "$TWGT_BOOTSTRAP_EVIDENCE" ]] || {
  echo "Missing bootstrap evidence: $TWGT_BOOTSTRAP_EVIDENCE" >&2
  exit 1
}

mkdir -p "$TWGT_RUNTIME_DIR"

status="$(jq -r '.status // empty' "$TWGT_BOOTSTRAP_EVIDENCE")"

[[ "$status" == "issued" ]] || {
  echo "Bootstrap evidence is not issued; runtime reconciliation denied." >&2
  exit 1
}

commit="$(jq -r '.commit // empty' "$TWGT_BOOTSTRAP_EVIDENCE")"
rollback="$(jq -r '.rollbackPin // empty' "$TWGT_BOOTSTRAP_EVIDENCE")"

[[ "$commit" =~ ^[0-9a-f]{40}$ ]] || {
  echo "Issued bootstrap evidence has no valid nucleus commit." >&2
  exit 1
}

[[ "$rollback" == "5d36c197856ae14ce79482554f9baee8e5893e8e" ]] || {
  echo "Bootstrap rollback pin does not match the authoritative baseline." >&2
  exit 1
}

cat > "$TWGT_RUNTIME_DIR/bootstrap-state.json" <<EOF
{
  "repository": "$TWGT_REPOSITORY",
  "commit": "$commit",
  "rollbackPin": "$rollback"
}
EOF

echo "Runtime state reconciled to evidence metadata."
