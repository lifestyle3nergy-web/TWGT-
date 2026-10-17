#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE="${TWGT_BOOTSTRAP_EVIDENCE:-$ROOT/activation/evidence/bootstrap.json}"
KEY="$ROOT/keys/bootstrap-verifier.pub"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || fail "jq required"

[[ -f "$EVIDENCE" ]] || fail "evidence missing: $EVIDENCE"
[[ -f "$KEY" ]] || fail "verifier key missing: $KEY"

status="$(jq -r '.status // empty' "$EVIDENCE")"

case "$status" in
  unissued)
    fail "bootstrap evidence is unissued; activation denied"
    ;;
  issued)
    ;;
  *)
    fail "invalid bootstrap evidence status: $status"
    ;;
esac

commit="$(jq -r '.commit // empty' "$EVIDENCE")"
rollback="$(jq -r '.rollbackPin // empty' "$EVIDENCE")"

[[ "$commit" =~ ^[0-9a-f]{40}$ ]] ||
  fail "issued evidence must contain a lowercase 40-character nucleus commit"

[[ "$rollback" == "5d36c197856ae14ce79482554f9baee8e5893e8e" ]] ||
  fail "rollback pin does not match the authoritative rollback baseline"

signature_algorithm="$(jq -r '.signature.algorithm // empty' "$EVIDENCE")"
signature_encoding="$(jq -r '.signature.encoding // empty' "$EVIDENCE")"
signature_value="$(jq -r '.signature.value // empty' "$EVIDENCE")"

[[ "$signature_algorithm" == "Ed25519" ]] ||
  fail "signature algorithm must be Ed25519"

[[ "$signature_encoding" == "base64" ]] ||
  fail "signature encoding must be base64"

[[ -n "$signature_value" ]] ||
  fail "issued evidence requires a detached signature"

echo "PASS: bootstrap evidence passed structural activation prerequisites."
echo "NOTE: cryptographic signature verification remains required before activation."
