#!/usr/bin/env bash
set -euo pipefail

pattern='-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}'

if git grep -nEI -e "$pattern" -- . ':!tests/fixtures/**'; then
  echo 'Credential signature detected in tracked source.' >&2
  exit 1
fi
