#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

die() { echo "ERROR: $*" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || die "jq is required"
command -v openssl >/dev/null 2>&1 || die "openssl is required"

[[ -f "$ROOT/schema.sql" ]] || die "schema.sql missing"
[[ -f "$ROOT/catalog/repositories.yaml" ]] || die "catalog/repositories.yaml missing"
[[ -f "$ROOT/policy/activation-policy.yaml" ]] || die "policy/activation-policy.yaml missing"
[[ -f "$ROOT/keys/bootstrap-verifier.pub" ]] || die "keys/bootstrap-verifier.pub missing"
[[ -f "$ROOT/evidence/bootstrap.json" ]] || die "evidence/bootstrap.json missing"

shopt -s nullglob
schemas=("$ROOT"/contracts/*.schema.json)
(( ${#schemas[@]} > 0 )) || die "contracts/*.schema.json missing"

for schema in "${schemas[@]}"; do
  jq -e . "$schema" >/dev/null || die "invalid JSON: $schema"
done

jq -e '.commit and (.commit | type == "string")' "$ROOT/evidence/bootstrap.json" >/dev/null \
  || die "evidence/bootstrap.json must contain string field: commit"

rollback="$(jq -r '.rollbackPin // empty' "$ROOT/evidence/bootstrap.json")"
if [[ -z "$rollback" ]]; then
  [[ -f "$ROOT/rollback_pin.txt" ]] && rollback="$(tr -d '[:space:]' < "$ROOT/rollback_pin.txt")"
fi

if [[ -n "$rollback" && ! "$rollback" =~ ^[0-9a-fA-F]{40}$ ]]; then
  die "rollback pin must be exactly 40 hexadecimal characters"
fi

if [[ "${1:-}" == "--verify-only" ]]; then
  echo "Structural verification passed."
  echo "NOTE: cryptographic evidence verification requires a real team-issued public key,"
  echo "signature, and evidence bundle. This template does not fabricate those values."
  exit 0
fi

echo "Bootstrap package is structurally valid. No mutation performed."
