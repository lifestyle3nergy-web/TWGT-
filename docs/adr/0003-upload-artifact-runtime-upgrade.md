# ADR-0003: GitHub Actions Upload-Artifact Runtime Upgrade

- **Status:** Proposed
- **Date:** 2026-09-08
- **Decision owners:** TWGT maintainers

## Context

The TWGT repository uses GitHub Actions for CI execution, artifact capture, and multi-gate validation.

The `actions/upload-artifact` action is part of the CI runtime and therefore part of the repository’s supply-chain surface. Upgrading this action constitutes a protected structural change because it modifies `.github/workflows/`, which is governed by TWGT’s architectural decision process.

The existing workflow referenced `upload-artifact@v4`. GitHub now provides `upload-artifact@v7`, which includes updated runtime behavior, improved artifact URL handling, and compatibility improvements with modern GitHub runner environments.

The CI pipeline correctly rejected PR #59 because workflow changes require a numbered ADR documenting the rationale, impact, and validation of the runtime upgrade.

## Decision

Upgrade the GitHub Actions runtime dependency:

```text
actions/upload-artifact@v4 → actions/upload-artifact@v7
```

This change is limited to a single workflow line in `.github/workflows/predictive-validation.yml`. No other workflow logic, job structure, or CI semantics are modified.

## Consequences

- CI pipelines will use the newer artifact-upload runtime.
- Artifact handling and retention behavior may improve due to upstream changes.
- The supply-chain surface is updated to a newer version, requiring traceability through this ADR.
- No changes occur to build, test, or validation semantics.
- Future workflow changes will continue to require ADRs under TWGT governance.

## Alternatives considered

### Remain on v4

Rejected. v4 is older, less aligned with current GitHub runner behavior, and lacks improvements present in v7.

### Upgrade to an intermediate version (v5 or v6)

Rejected. No benefit was identified over adopting the latest stable version.

### Replace artifact upload with a custom action

Rejected. TWGT relies on GitHub’s maintained action for supply-chain stability.

## Validation

- Dependency Review: success.
- CodeQL: success.
- Predictive Risk Validation: success.
- Artifact upload using v7: success.
  - Artifact ID: `10042133119`
  - Size: 835 bytes
  - Digest: `sha256:377c83866c758b098c051b524bede7345ad2321841caef32022308cdbba69716`
- CI structural gate must pass with this ADR present in the pull request.

## Reversal / migration

If regressions occur in artifact URL generation, retention, or runner compatibility, revert the workflow line to:

```yaml
uses: actions/upload-artifact@v4
```

No additional migration steps are required.
