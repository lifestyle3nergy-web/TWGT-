#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

pass() {
  echo "PASS: $*"
}

command -v jq >/dev/null 2>&1 || fail "jq missing"
command -v yq >/dev/null 2>&1 || fail "yq missing"
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum missing"

EVIDENCE="$ROOT/activation/evidence/bootstrap.json"
SCHEMA="$ROOT/activation/schemas/bootstrap.schema.json"
POLICY="$ROOT/activation/config/activation-policy.yaml"
COMPAT="$ROOT/activation/config/compatibility-matrix.yaml"
CATALOG="$ROOT/catalog/repositories.yaml"
KEY="$ROOT/keys/bootstrap-verifier.pub"

for file in "$EVIDENCE" "$SCHEMA" "$POLICY" "$COMPAT" "$CATALOG" "$KEY"; do
  [[ -s "$file" ]] || fail "required file missing or empty: ${file#$ROOT/}"
done

jq -e . "$EVIDENCE" >/dev/null ||
  fail "invalid JSON: ${EVIDENCE#$ROOT/}"

jq -e . "$SCHEMA" >/dev/null ||
  fail "invalid JSON schema: ${SCHEMA#$ROOT/}"

yq -e '.' "$POLICY" >/dev/null ||
  fail "invalid YAML: ${POLICY#$ROOT/}"

yq -e '.' "$COMPAT" >/dev/null ||
  fail "invalid YAML: ${COMPAT#$ROOT/}"

yq -e '.' "$CATALOG" >/dev/null ||
  fail "invalid YAML: ${CATALOG#$ROOT/}"

status="$(jq -r '.status // empty' "$EVIDENCE")"
[[ "$status" == "unissued" ]] ||
  fail "bootstrap evidence must remain unissued until team issuance"

if jq -e 'has("commit")' "$EVIDENCE" >/dev/null; then
  fail "unissued bootstrap evidence must not contain commit"
fi

if jq -e 'has("signature")' "$EVIDENCE" >/dev/null; then
  fail "unissued bootstrap evidence must not contain signature"
fi

rollback="$(jq -r '.rollbackPin // empty' "$EVIDENCE")"
[[ "$rollback" =~ ^[0-9a-fA-F]{40}$ ]] ||
  fail "rollbackPin must be exactly 40 hexadecimal characters"

declared_policy_digest="$(
  jq -r '.digests["activation/config/activation-policy.yaml"] // empty' "$EVIDENCE"
)"

[[ -n "$declared_policy_digest" ]] ||
  fail "evidence does not declare the activation policy digest"

actual_policy_digest="$(
  sha256sum "$POLICY" | awk '{print "sha256:" $1}'
)"

[[ "$declared_policy_digest" == "$actual_policy_digest" ]] ||
  fail "activation policy digest mismatch"

pass "required bootstrap artifacts exist"
pass "JSON and YAML syntax are valid"
pass "bootstrap evidence remains UNISSUED"
pass "unissued evidence contains no commit or signature"
pass "rollbackPin is syntactically valid"
pass "activation policy digest matches evidence"

echo
echo "NOTE: evidence artifact path reconciliation remains pending."
echo "NOTE: cryptographic issuance remains blocked pending authoritative team inputs."
echo "NOTE: no runtime mutation performed."
