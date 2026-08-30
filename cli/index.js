#!/usr/bin/env node

const copilot = require("./commands/copilot.js");
const release = require("./commands/release.js");
const update = require("./commands/update.js");

const commands = { copilot, release, update };

function parseArgs(args) {
  const options = { _: [] };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("-")) {
      options._.push(arg);
      continue;
    }

    const normalized = arg.replace(/^-+/, "");
    const [key, inlineValue] = normalized.split("=", 2);

    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }

    const next = args[index + 1];
    if (next && !next.startsWith("-")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }

  if (options.c === true) options.cloud = true;
  return options;
}

function printHelp() {
  console.log("TWGT CLI");
  console.log("");
  console.log("Usage: twgt <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  copilot   Manage Copilot operations");
  console.log("  release   Validate and publish a release tag");
  console.log("  update    Update dependencies and apply security fixes");
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  await handler(parseArgs(args));
}

main().catch((error) => {
  console.error("TWGT CLI failed:", error.message);
  process.exitCode = 1;
});
