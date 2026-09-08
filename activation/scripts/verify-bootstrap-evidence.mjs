#!/usr/bin/env node
import { createHash, createPublicKey } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = resolve(process.env.TWGT_BOOTSTRAP_EVIDENCE ?? `${ROOT}/evidence/bootstrap.json`);
const keyPath = resolve(process.env.TWGT_BOOTSTRAP_VERIFIER_KEY ?? `${ROOT}/keys/bootstrap-verifier.pub`);
const repositoryRoot = resolve(process.env.TWGT_BOOTSTRAP_REPOSITORY_ROOT ?? `${ROOT}/..`);

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};
const requireFile = (path, label) => {
  if (!existsSync(path)) fail(`${label} missing: ${path}`);
};
const isGitSha = (value) => typeof value === 'string' && /^[0-9a-fA-F]{40}$/.test(value);
const isSha256 = (value) => typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value);
const isPlaceholder = (value) =>
  typeof value === 'string' && /(REPLACE_WITH|TEAM_ISSUED|REQUIRED:|CHANGE_ME|CHANGEME|PLACEHOLDER|TODO)/i.test(value);

const loadJson = (path, label) => {
  requireFile(path, label);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`invalid JSON in ${label}: ${error.message}`);
  }
};

const schema = loadJson(`${ROOT}/schemas/bootstrap.schema.json`, 'bootstrap schema');
const evidence = loadJson(evidencePath, 'bootstrap evidence');

if (schema.type !== 'object' || schema.additionalProperties !== false) {
  fail('bootstrap schema must define a closed object contract');
}
for (const field of schema.required ?? []) {
  if (!(field in evidence)) fail(`evidence missing required field: ${field}`);
}
for (const key of Object.keys(evidence)) {
  if (!(key in schema.properties)) fail(`evidence contains undeclared property: ${key}`);
}

for (const field of ['commit', 'rollbackPin']) {
  if (!isGitSha(evidence[field]) || isPlaceholder(evidence[field])) {
    fail(`invalid evidence ${field}; expected a real 40-character hexadecimal SHA`);
  }
}

const expectedRepository = process.env.TWGT_REPOSITORY ?? 'lifestyle3nergy-web/TWGT-';
if (evidence.repository !== expectedRepository) {
  fail(`evidence repository does not match expected repository: ${evidence.repository}`);
}

if (!evidence.digests || typeof evidence.digests !== 'object' || Array.isArray(evidence.digests)) {
  fail('evidence digests must be an object');
}
const digestEntries = Object.entries(evidence.digests);
if (digestEntries.length === 0) fail('evidence digests must not be empty');
for (const [path, expected] of digestEntries) {
  if (!isSha256(expected) || isPlaceholder(expected)) fail(`invalid SHA-256 digest for ${path}`);
  const artifact = resolve(repositoryRoot, path);
  const rel = relative(repositoryRoot, artifact);
  if (!rel || rel === '..' || rel.startsWith('../') || rel.includes('/../')) {
    fail(`digest path escapes repository root: ${path}`);
  }
  requireFile(artifact, `digest artifact ${path}`);
  const actual = createHash('sha256').update(readFileSync(artifact)).digest('hex');
  if (actual !== expected.toLowerCase()) fail(`SHA-256 mismatch for ${path}`);
}

requireFile(keyPath, 'bootstrap verifier public key');
const keyText = readFileSync(keyPath, 'utf8');
if (isPlaceholder(keyText)) fail('bootstrap verifier public key contains placeholder material');
try {
  createPublicKey(keyText);
} catch (error) {
  fail(`invalid bootstrap verifier public key: ${error.message}`);
}

if (!evidence.signature || typeof evidence.signature !== 'object' || Array.isArray(evidence.signature)) {
  fail('signature object missing');
}
const algorithm = evidence.signature.algorithm;
const signatureValue = evidence.signature.value;
if (typeof algorithm !== 'string' || algorithm.length === 0 || isPlaceholder(algorithm)) {
  fail('signature algorithm is not authoritatively defined');
}
if (typeof signatureValue !== 'string' || signatureValue.length === 0 || isPlaceholder(signatureValue)) {
  fail('signature value is missing or placeholder material');
}

// Deliberately empty until TWGT maintainers define the authoritative signature
// algorithm and canonical signed payload. Never guess a cryptographic contract.
const SIGNATURE_ADAPTERS = new Map();
if (!SIGNATURE_ADAPTERS.has(algorithm)) {
  fail(`unsupported signature algorithm: ${algorithm}; authoritative signature contract is not registered`);
}
