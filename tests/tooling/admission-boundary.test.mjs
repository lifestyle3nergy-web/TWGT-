// Boundary tests for the structural-vs-admission contract.
//
// NOTE: validateAdmissionRecord below is a temporary reference stub, not the
// production validator. These tests define expected behavior but do not prove
// production enforcement. Replace the stub with the production validator before
// treating this suite as admission evidence.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const EXIT = Object.freeze({
  FULL_VERIFICATION_PASS: 0,
  STRUCTURE_VALID_ONLY: 10,
  EVIDENCE_MISSING: 20,
  EVIDENCE_INVALID: 21,
  EVIDENCE_EXPIRED: 22,
  SIGNATURE_UNVERIFIED: 23,
  ARTIFACT_INTEGRITY_FAILED: 24,
  POLICY_SOURCE_UNAVAILABLE: 25,
  POLICY_SIGNATURE_INVALID: 26,
  CANDIDATE_IDENTITY_MISMATCH: 27,
  POLICY_VERSION_CHANGED: 28,
  REVIEW_INDEPENDENCE_FAILED: 29,
  AUTHORIZATION_EXPIRED: 30,
  ENVIRONMENT_QUARANTINED: 31,
  AUDIT_STORE_UNAVAILABLE: 32,
  REQUIRED_EVIDENCE_UNAVAILABLE: 33,
  INVALID_TRANSITION: 34,
  REJECTED_TERMINAL: 35,
  BREAK_GLASS_INVALID: 36,
  VALIDATOR_INTERNAL_ERROR: 70,
});

const HEAD = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const BASE = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const T0 = '2026-01-01T00:00:00Z';
const T1 = '2026-01-02T00:00:00Z';

function structuralResult(overrides = {}) {
  return {
    schema_version: '1.0.0-draft.1',
    authorizing: false,
    candidate_head_sha: HEAD,
    result: 'STRUCTURALLY_VALID',
    checks: [{ check_id: 'layout', result: 'PASS', reason_code: 'LAYOUT_OK' }],
    ...overrides,
  };
}

function admissionRecord(overrides = {}) {
  return {
    schema_version: '1.0.0-draft.1',
    decision_id: 'test-decision-0001',
    candidate: {
      repository: 'lifestyle3nergy-web/TWGT-',
      pull_request: 119,
      base_sha: BASE,
      head_sha: HEAD,
      lockfile_digest: 'sha256:' + '0'.repeat(64),
      artifact_digest: 'sha256:' + '0'.repeat(64),
      deploy_config_digest: 'sha256:' + '0'.repeat(64),
      contract_version: 'v1',
      contract_digest: 'sha256:' + '0'.repeat(64),
      identity_digest: 'sha256:' + '0'.repeat(64),
      identity_digest_spec: 'twgt-candidate-identity-v1',
    },
    policy: {
      artifact_uri: 'test://policy',
      artifact_digest: 'sha256:' + '1'.repeat(64),
      trust_root_id: 'test-root',
      signing_key_id: 'test-key',
      signature_artifact_digest: 'sha256:' + '2'.repeat(64),
    },
    evidence: [],
    review: {
      author_id: 'author',
      last_committer_id: 'committer',
      approver_id: null,
      decided_at: T0,
      rationale: null,
      review_state: 'PENDING',
    },
    authorization: {
      stage: 'staging',
      authorization_state: 'ACTIVE',
      issued_at: T0,
      expires_at: T1,
      candidate_identity_digest: 'sha256:' + '0'.repeat(64),
      policy_digest: 'sha256:' + '1'.repeat(64),
      deploy_config_digest: 'sha256:' + '0'.repeat(64),
    },
    environment: {
      environment_id: 'staging-1',
      state: 'HEALTHY',
      parity_report_digest: 'sha256:' + '3'.repeat(64),
      declared_deviations: [],
    },
    decision: { state: 'HOLD', reason_codes: ['REQUIRED_EVIDENCE_UNAVAILABLE'] },
    audit: { record_uri: 'test://audit/1', record_digest: 'sha256:' + '4'.repeat(64), sequence: 1 },
    ...overrides,
  };
}

// Temporary reference model. Replace with the production validator.
function validateStructuralResult(_result) {
  return {
    exit: EXIT.STRUCTURE_VALID_ONLY,
    authorizing: false,
    reason_code: 'STRUCTURE_VALID_ONLY',
  };
}

function validateAdmissionRecord(record, now = new Date(T0)) {
  if (!record || typeof record !== 'object') {
    return {
      exit: EXIT.VALIDATOR_INTERNAL_ERROR,
      state: 'HOLD',
      reason_codes: ['VALIDATOR_INTERNAL_ERROR'],
    };
  }
  if ('result' in record && record.result === 'STRUCTURALLY_VALID') {
    return { exit: EXIT.EVIDENCE_INVALID, state: 'HOLD', reason_codes: ['EVIDENCE_INVALID'] };
  }

  const reasons = [];
  if (record.review?.review_state === 'RECORDED') {
    const { approver_id, author_id, last_committer_id } = record.review;
    if (!approver_id || approver_id === author_id || approver_id === last_committer_id) {
      reasons.push('REVIEW_INDEPENDENCE_FAILED');
    }
  }
  if (record.authorization?.expires_at && new Date(record.authorization.expires_at) <= now) {
    reasons.push('AUTHORIZATION_EXPIRED');
  }
  if (
    record.environment?.state === 'QUARANTINED' &&
    record.decision?.state === 'ADMITTED_TO_STAGING'
  ) {
    reasons.push('ENVIRONMENT_QUARANTINED');
  }
  if (record.decision?.state === 'RELEASE_ADMITTED') {
    if (record.authorization?.stage !== 'production') reasons.push('INVALID_TRANSITION');
    if (record.authorization?.authorization_state !== 'ACTIVE')
      reasons.push('AUTHORIZATION_EXPIRED');
  }
  if (!Array.isArray(record.evidence) || record.evidence.length === 0)
    reasons.push('REQUIRED_EVIDENCE_UNAVAILABLE');
  if (['HOLD', 'REJECTED'].includes(record.decision?.state)) {
    if (
      !Array.isArray(record.decision?.reason_codes) ||
      record.decision.reason_codes.length === 0
    ) {
      reasons.push('REQUIRED_EVIDENCE_UNAVAILABLE');
    }
  }

  const exits = {
    EVIDENCE_INVALID: EXIT.EVIDENCE_INVALID,
    REQUIRED_EVIDENCE_UNAVAILABLE: EXIT.REQUIRED_EVIDENCE_UNAVAILABLE,
    REVIEW_INDEPENDENCE_FAILED: EXIT.REVIEW_INDEPENDENCE_FAILED,
    AUTHORIZATION_EXPIRED: EXIT.AUTHORIZATION_EXPIRED,
    ENVIRONMENT_QUARANTINED: EXIT.ENVIRONMENT_QUARANTINED,
    INVALID_TRANSITION: EXIT.INVALID_TRANSITION,
  };
  if (reasons.length) {
    const reason = reasons[0];
    return {
      exit: exits[reason] ?? EXIT.VALIDATOR_INTERNAL_ERROR,
      state: 'HOLD',
      reason_codes: [...new Set(reasons)],
    };
  }
  return {
    exit: EXIT.REQUIRED_EVIDENCE_UNAVAILABLE,
    state: 'HOLD',
    reason_codes: ['REQUIRED_EVIDENCE_UNAVAILABLE'],
  };
}

function assertHold(v, exit, reason) {
  assert.equal(v.state, 'HOLD');
  assert.equal(v.exit, exit);
  assert.ok(v.reason_codes.includes(reason));
  assert.notEqual(v.exit, EXIT.FULL_VERIFICATION_PASS);
}

test('structural result is non-authorizing by construction', () => {
  const result = structuralResult();
  assert.equal(result.authorizing, false);
  const validation = validateStructuralResult(result);
  assert.equal(validation.authorizing, false);
  assert.equal(validation.exit, EXIT.STRUCTURE_VALID_ONLY);
  assert.equal(validation.reason_code, 'STRUCTURE_VALID_ONLY');
  assert.notEqual(validation.exit, EXIT.FULL_VERIFICATION_PASS);
});

test('structural result passed to admission validator is refused', () => {
  assertHold(
    validateAdmissionRecord(structuralResult()),
    EXIT.EVIDENCE_INVALID,
    'EVIDENCE_INVALID',
  );
});

test('empty evidence is HOLD regardless of other fields', () => {
  assertHold(
    validateAdmissionRecord(admissionRecord()),
    EXIT.REQUIRED_EVIDENCE_UNAVAILABLE,
    'REQUIRED_EVIDENCE_UNAVAILABLE',
  );
});

test('HOLD without reason codes is refused', () => {
  const record = admissionRecord({ decision: { state: 'HOLD', reason_codes: [] } });
  assertHold(
    validateAdmissionRecord(record),
    EXIT.REQUIRED_EVIDENCE_UNAVAILABLE,
    'REQUIRED_EVIDENCE_UNAVAILABLE',
  );
});

test('approver equal to author fails independence', () => {
  const record = admissionRecord({
    review: {
      author_id: 'alice',
      last_committer_id: 'alice',
      approver_id: 'alice',
      decided_at: T0,
      rationale: 'self-approved',
      review_state: 'RECORDED',
    },
  });
  assertHold(
    validateAdmissionRecord(record),
    EXIT.REVIEW_INDEPENDENCE_FAILED,
    'REVIEW_INDEPENDENCE_FAILED',
  );
});

test('approver equal to last committer fails independence', () => {
  const record = admissionRecord({
    review: {
      author_id: 'alice',
      last_committer_id: 'bob',
      approver_id: 'bob',
      decided_at: T0,
      rationale: 'committer-approved',
      review_state: 'RECORDED',
    },
  });
  assertHold(
    validateAdmissionRecord(record),
    EXIT.REVIEW_INDEPENDENCE_FAILED,
    'REVIEW_INDEPENDENCE_FAILED',
  );
});

test('expiry boundary is inclusive', () => {
  const record = admissionRecord();
  assertHold(
    validateAdmissionRecord(record, new Date(T1)),
    EXIT.AUTHORIZATION_EXPIRED,
    'AUTHORIZATION_EXPIRED',
  );
});

test('quarantined environment blocks staging admission', () => {
  const record = admissionRecord({
    environment: {
      environment_id: 'staging-1',
      state: 'QUARANTINED',
      parity_report_digest: 'sha256:' + '3'.repeat(64),
      declared_deviations: [],
    },
    decision: { state: 'ADMITTED_TO_STAGING', reason_codes: ['DERIVED'] },
  });
  assertHold(
    validateAdmissionRecord(record),
    EXIT.ENVIRONMENT_QUARANTINED,
    'ENVIRONMENT_QUARANTINED',
  );
});

test('release admission requires production-stage authorization', () => {
  const record = admissionRecord({
    authorization: { ...admissionRecord().authorization, stage: 'staging' },
    decision: { state: 'RELEASE_ADMITTED', reason_codes: ['DERIVED'] },
  });
  assertHold(validateAdmissionRecord(record), EXIT.INVALID_TRANSITION, 'INVALID_TRANSITION');
});

test('every HOLD has a non-empty machine-readable reason', () => {
  for (const record of [
    admissionRecord(),
    admissionRecord({ evidence: [] }),
    admissionRecord({ decision: { state: 'HOLD', reason_codes: [] } }),
  ]) {
    const validation = validateAdmissionRecord(record);
    assert.equal(validation.state, 'HOLD');
    assert.ok(Array.isArray(validation.reason_codes) && validation.reason_codes.length > 0);
    assert.notEqual(validation.exit, EXIT.FULL_VERIFICATION_PASS);
  }
});
