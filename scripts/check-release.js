#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function fail(msg) {
  console.error("❌ Release Check Error:", msg);
  process.exit(1);
}

function checkChangelog() {
  const changelog = path.join(process.cwd(), "CHANGELOG.md");

  if (!fs.existsSync(changelog)) {
    fail("CHANGELOG.md missing.");
  }

  const content = fs.readFileSync(changelog, "utf8");

  // Require a version entry like: ## v1.2.3
  if (!content.match(/^##\s*v?\d+\.\d+\.\d+/m)) {
    fail("CHANGELOG.md missing a version entry (e.g. ## v1.2.3).");
  }

  console.log("📄 Changelog OK");
}

function checkVersion() {
  const pkgFile = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(pkgFile)) {
    fail("package.json missing.");
  }

  const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));

  if (!pkg.version) {
    fail("package.json missing version field.");
  }

  console.log(`🔢 Version OK: ${pkg.version}`);
}

function checkDocs() {
  const requiredDocs = [
    "README.md",
    "CONTRIBUTING.md",
    "docs/architecture.md"
  ];

  requiredDocs.forEach(file => {
    if (!fs.existsSync(file)) {
      fail(`Required documentation missing: ${file}`);
    }
  });

  console.log("📚 Documentation OK");
}

function main() {
  console.log("🔍 Running TWGT Release Checks...");

  checkChangelog();
  checkVersion();
  checkDocs();

  console.log("✅ Release checks passed — safe to tag.");
}

main();

