# ADR-0005: Upgrade CodeQL Action to v4.38.0

- **Status:** Accepted
- **Date:** 2026-09-14
- **Decision owners:** TWGT maintainers
- **Scope:** PR #71

## Context

TWGT runs GitHub CodeQL analysis as a required security gate. The workflow currently references the approved CodeQL Action v4 release line and Dependabot proposes the patch update from 4.37.4 to 4.38.0.

Workflow files are protected structural surfaces, so even a patch-level action update requires an explicit decision record and fresh validation.

## Decision

1. Update all existing `github/codeql-action` references from v4.37.4 to v4.38.0 in the CodeQL workflow.
2. Preserve the workflow triggers, language matrix, query configuration, permissions, build mode, and upload behavior.
3. Do not add new secrets, permissions, external actions, deployment behavior, or execution targets.
4. Require the repository contract validator, workflow YAML validation, diff-format validation, Continuous Integration, Dependency Review, and CodeQL to pass on the final head.

## Security and permissions

The update stays within the existing CodeQL v4 release line. It does not broaden `security-events`, `packages`, `contents`, or pull-request permissions and does not introduce third-party code outside the already approved GitHub CodeQL action.

## Rollback

Revert every CodeQL action reference to v4.37.4 without changing workflow triggers, permissions, or analysis configuration.

## Acceptance criteria

- Repository governance passes.
- Workflow YAML and diff formatting are valid.
- Continuous Integration and Dependency Review pass.
- CodeQL completes successfully using v4.38.0.
- No permission, secret, trigger, or deployment expansion is present.
