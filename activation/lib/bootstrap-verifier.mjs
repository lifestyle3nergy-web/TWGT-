import { Buffer } from "node:buffer";
import { createPublicKey, sign, verify } from "node:crypto";
import canonicalize from "canonicalize";

const EXPECTED_ALGORITHM = "Ed25519";
const EXPECTED_ENCODING = "base64";
const EXPECTED_KEY_ID = "btc-001-root-v1";
const EXPECTED_SIGNATURE_BYTES = 64;

function fail(message) {
  throw new Error(`BOOTSTRAP_VERIFY_DENIED: ${message}`);
}

function unsignedEvidence(evidence) {
  if (
    evidence === null ||
    typeof evidence !== "object" ||
    Array.isArray(evidence)
  ) {
    fail("evidence must be an object");
  }

  const { signature: _signature, ...unsigned } = evidence;
  return unsigned;
}

export function canonicalizeBootstrapEvidence(evidence) {
  const canonical = canonicalize(unsignedEvidence(evidence));

  if (typeof canonical !== "string") {
    fail("RFC 8785 JCS canonicalization failed");
  }

  return Buffer.from(canonical, "utf8");
}

function validateSignatureEnvelope(evidence) {
  const signature = evidence?.signature;

  if (!signature || typeof signature !== "object") {
    fail("detached signature is missing");
  }

  if (signature.keyId !== EXPECTED_KEY_ID) {
    fail(`unknown keyId: ${String(signature.keyId)}`);
  }

  if (signature.algorithm !== EXPECTED_ALGORITHM) {
    fail(`unsupported algorithm: ${String(signature.algorithm)}`);
  }

  if (signature.encoding !== EXPECTED_ENCODING) {
    fail(`unsupported signature encoding: ${String(signature.encoding)}`);
  }

  if (
    typeof signature.value !== "string" ||
    signature.value.length === 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(signature.value) ||
    signature.value.length % 4 !== 0
  ) {
    fail("malformed base64 signature");
  }

  const decoded = Buffer.from(signature.value, "base64");

  if (decoded.length !== EXPECTED_SIGNATURE_BYTES) {
    fail("Ed25519 signature must decode to exactly 64 bytes");
  }

  return decoded;
}

function resolvePublicKey(keyId, trustedKeys) {
  if (!(trustedKeys instanceof Map)) {
    fail("trusted key registry is missing");
  }

  const key = trustedKeys.get(keyId);

  if (!key) {
    fail(`no trusted public key registered for keyId: ${keyId}`);
  }

  try {
    return key?.type === "public" ? key : createPublicKey(key);
  } catch {
    fail(`invalid public key for keyId: ${keyId}`);
  }
}

export function signBootstrapEvidence(evidence, privateKey) {
  if (!privateKey) {
    throw new Error("BOOTSTRAP_SIGN_DENIED: signing key is missing");
  }

  const bytes = canonicalizeBootstrapEvidence(evidence);
  const signature = sign(null, bytes, privateKey);

  if (signature.length !== EXPECTED_SIGNATURE_BYTES) {
    throw new Error("BOOTSTRAP_SIGN_DENIED: invalid Ed25519 signature length");
  }

  return {
    ...evidence,
    signature: {
      keyId: EXPECTED_KEY_ID,
      algorithm: EXPECTED_ALGORITHM,
      encoding: EXPECTED_ENCODING,
      value: signature.toString("base64"),
    },
  };
}

export function verifyBootstrapEvidence(evidence, trustedKeys) {
  if (evidence?.status !== "issued") {
    fail("bootstrap evidence is not issued");
  }

  const signature = validateSignatureEnvelope(evidence);
  const publicKey = resolvePublicKey(
    evidence.signature.keyId,
    trustedKeys,
  );
  const bytes = canonicalizeBootstrapEvidence(evidence);

  let valid = false;

  try {
    valid = verify(null, bytes, publicKey, signature);
  } catch {
    fail("Ed25519 verification failed");
  }

  if (!valid) {
    fail("signature verification failed");
  }

  return true;
}
