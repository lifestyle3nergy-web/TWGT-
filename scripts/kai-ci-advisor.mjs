#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";

const DEFAULT_POLICY = new URL("../ci-intelligence/repair-policy.json", import.meta.url);

const SIGNATURES = [
  {
    id: "repository-contract-adr",
    patterns: [
      /Protected structural change detected without a numbered ADR/i,
      /repository contract/i,
      /numbered ADR/i
    ],
    diagnosis: "A protected structural change is missing the repository governance artifact required by the contract.",
    candidates: [
      { action: "add-numbered-adr", rationale: "Document the structural decision without weakening the governance gate.", risk: "low" },
      { action: "revert-structural-change", rationale: "Return the branch to the previously admitted repository shape.", risk: "low" },
      { action: "change-governance-rule", rationale: "Would alter the admission policy itself.", risk: "high", requiresHumanApproval: true }
    ]
  },
  {
    id: "source-boundary",
    patterns: [
      /source[- ]boundary/i,
      /outside the authoritative production source boundary/i,
      /unexpected production source/i
    ],
    diagnosis: "A source file appears outside the explicitly admitted production TypeScript boundary.",
    candidates: [
      { action: "classify-or-move-source", rationale: "Place the file in the correct runtime/build boundary.", risk: "low" },
      { action: "update-source-boundary-documentation", rationale: "Only if the architecture decision intentionally expands the boundary.", risk: "medium", requiresHumanApproval: true },
      { action: "revert-boundary-expansion", rationale: "Remove an unintended source-boundary change.", risk: "low" }
    ]
  },
  {
    id: "format",
    patterns: [/prettier/i, /format:check/i, /code style/i],
    diagnosis: "Formatting validation failed.",
    candidates: [
      { action: "format-changed-files", rationale: "Apply the repository formatter to the affected files.", risk: "low" }
    ]
  },
  {
    id: "typescript",
    patterns: [/TS\d{4}/i, /TypeScript/i, /tsc/i, /typecheck/i],
    diagnosis: "TypeScript compilation or type validation failed.",
    candidates: [
      { action: "repair-type-error", rationale: "Fix the smallest source-level type error supported by compiler evidence.", risk: "medium" },
      { action: "add-or-adjust-test", rationale: "Only when the failure exposes an untested contract.", risk: "medium" }
    ]
  },
  {
    id: "test",
    patterns: [/vitest/i, /test failed/i, /AssertionError/i, /npm test/i],
    diagnosis: "A test contract failed.",
    candidates: [
      { action: "repair-regression", rationale: "Fix the implementation while preserving the asserted contract.", risk: "medium" },
      { action: "update-test-for-intentional-change", rationale: "Only when the changed behavior is explicitly documented and authorised.", risk: "high", requiresHumanApproval: true }
    ]
  }
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function readInput() {
  const file = arg("--failure-file");
  if (file) return fs.readFile(file, "utf8");

  const message = arg("--message");
  if (message) return message;

  if (!process.stdin.isTTY) {
    return new Promise((resolve, reject) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", chunk => { data += chunk; });
      process.stdin.on("end", () => resolve(data));
      process.stdin.on("error", reject);
    });
  }

  return "";
}

async function main() {
  const input = (await readInput()).trim();
  const policy = JSON.parse(await fs.readFile(DEFAULT_POLICY, "utf8"));

  const matches = SIGNATURES.filter(signature =>
    signature.patterns.some(pattern => pattern.test(input))
  );

  const primary = matches[0];
  const confidence = primary ? (matches.length === 1 ? 0.96 : 0.82) : 0.2;

  const candidates = (primary?.candidates ?? [
    {
      action: "collect-more-evidence",
      rationale: "No known signature matched. Do not modify code until evidence improves.",
      risk: "unknown",
      requiresHumanApproval: true
    }
  ]).slice(0, policy.exploration.maxCandidates);

  const result = {
    advisor: "KAi-CI",
    version: 1,
    mode: "diagnosis-and-proposal",
    adaptivePolicy: "fibonacci-compatible",
    confidence,
    signature: primary?.id ?? "unknown",
    diagnosis: primary?.diagnosis ?? "No trusted failure signature matched.",
    candidates,
    constraints: {
      maxCandidates: policy.exploration.maxCandidates,
      maxChangedFiles: policy.exploration.maxChangedFiles,
      maxChangedLines: policy.exploration.maxChangedLines,
      protectedPaths: policy.protectedPaths,
      humanApprovalRequired: policy.requiresHumanApproval,
      forbiddenActions: policy.forbiddenActions
    },
    nextStep: primary
      ? "Select a candidate in an isolated branch, then run independent validation."
      : "Collect compiler, test, workflow, and repository-contract evidence before proposing a patch."
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
