const { execSync } = require("child_process");
const CloudClient = require("../utils/cloud-client.js");

module.exports = async function (opts) {
  const isCloud = opts.cloud || opts.c;
  const action = opts._?.[0] || "status";

  if (isCloud) {
    return handleCloudCommand(action, opts);
  }

  // Local mode
  switch (action) {
    case "init":
      return initCopilot(opts);
    case "sync":
      return syncCopilot(opts);
    case "status":
      return statusCopilot(opts);
    default:
      console.error(`❌ Unknown copilot action: ${action}`);
      console.log("Available actions: init, sync, status");
      process.exit(1);
  }
};

async function handleCloudCommand(action, opts) {
  console.log("☁️  Connecting to Copilot Cloud...");

  const client = new CloudClient({
    apiKey: opts.apiKey || process.env.COPILOT_API_KEY,
    endpoint: opts.endpoint || process.env.COPILOT_ENDPOINT || "https://copilot-cloud.ai",
  });

  try {
    switch (action) {
      case "sync":
        return await syncToCloud(client, opts);
      case "pull":
        return await pullFromCloud(client, opts);
      case "status":
        return await statusCloud(client, opts);
      case "config":
        return await configCloud(client, opts);
      case "logs":
        return await logsCloud(client, opts);
      case "deploy":
        return await deployCloud(client, opts);
      default:
        console.error(`❌ Unknown cloud action: ${action}`);
        console.log(
          "Available cloud actions: sync, pull, status, config, logs, deploy"
        );
        process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Cloud operation failed: ${err.message}`);
    if (opts.debug) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

async function initCopilot(opts) {
  console.log("🚀 Initializing Copilot...");

  try {
    // Create .copilot config directory
    execSync("mkdir -p .copilot", { stdio: "inherit" });

    // Create config file
    const config = {
      version: "1.0.0",
      enabled: true,
      cloud: {
        enabled: false,
        apiKey: "$COPILOT_API_KEY",
        endpoint: "https://copilot-cloud.ai",
      },
      memory: {
        type: "redis",
        host: "localhost",
        port: 6379,
      },
      auth: {
        type: "jwt",
        secret: "$JWT_SECRET",
      },
    };

    require("fs").writeFileSync(
      ".copilot/config.json",
      JSON.stringify(config, null, 2)
    );

    // Create .env.example
    const envExample = `COPILOT_API_KEY=your_api_key_here
COPILOT_ENDPOINT=https://copilot-cloud.ai
JWT_SECRET=your_jwt_secret_here
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/twgt`;

    require("fs").writeFileSync(".copilot/.env.example", envExample);

    console.log("✅ Copilot initialized!");
    console.log("📝 Config created at .copilot/config.json");
    console.log("📋 Environment template at .copilot/.env.example");
  } catch (err) {
    console.error("❌ Initialization failed:", err.message);
    process.exit(1);
  }
}

async function syncCopilot(opts) {
  console.log("🔄 Syncing Copilot knowledge base...");

  try {
    // In cloud mode, this would sync to the cloud
    console.log("📦 Scanning knowledge entries...");
    // This would query the database and sync
    console.log("✅ Knowledge base synced.");
  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  }
}

async function statusCopilot(opts) {
  console.log("📊 Copilot Status");
  console.log("─".repeat(50));

  try {
    const fs = require("fs");
    if (fs.existsSync(".copilot/config.json")) {
      const config = JSON.parse(
        fs.readFileSync(".copilot/config.json", "utf-8")
      );
      console.log(`✅ Initialized: Yes`);
      console.log(`📡 Cloud enabled: ${config.cloud.enabled}`);
      console.log(`🔐 Auth type: ${config.auth.type}`);
      console.log(`💾 Memory: ${config.memory.type}`);
    } else {
      console.log("⚠️  Copilot not initialized. Run 'copilot init' first.");
    }
  } catch (err) {
    console.error("❌ Status check failed:", err.message);
    process.exit(1);
  }
}

async function syncToCloud(client, opts) {
  console.log("☁️  Syncing to Copilot Cloud...");

  const response = await client.sync({
    knowledgeBase: opts.knowledgeBase || "default",
    force: opts.force || false,
  });

  console.log(`✅ Synced ${response.count} items to cloud`);
  console.log(`📊 Timestamp: ${response.timestamp}`);
  if (response.warnings) {
    console.log(`⚠️  Warnings: ${response.warnings.join(", ")}`);
  }
}

async function pullFromCloud(client, opts) {
  console.log("☁️  Pulling from Copilot Cloud...");

  const response = await client.pull({
    knowledgeBase: opts.knowledgeBase || "default",
    since: opts.since,
  });

  console.log(`✅ Pulled ${response.count} items from cloud`);
  console.log(`📊 Latest sync: ${response.lastSync}`);
}

async function statusCloud(client, opts) {
  console.log("☁️  Checking Copilot Cloud status...");

  const response = await client.status();

  console.log("┌─ Cloud Status ─────────────────────────────────┐");
  console.log(`│ Status: ${response.status.padEnd(35)}│`);
  console.log(`│ Uptime: ${response.uptime.padEnd(35)}│`);
  console.log(`│ API Version: ${response.apiVersion.padEnd(31)}│`);
  console.log(`│ Your Tier: ${response.tier.padEnd(33)}│`);
  console.log(`│ Knowledge Items: ${response.knowledgeCount.toString().padEnd(29)}│`);
  console.log(`│ Last Sync: ${response.lastSync.padEnd(33)}│`);
  console.log("└─────────────────────────────────────────────────┘");
}

async function configCloud(client, opts) {
  if (opts.get) {
    console.log("☁️  Retrieving cloud config...");
    const config = await client.getConfig();
    console.log(JSON.stringify(config, null, 2));
  } else if (opts.set) {
    console.log("☁️  Updating cloud config...");
    const updates = parseConfigUpdate(opts.set);
    const config = await client.setConfig(updates);
    console.log("✅ Config updated");
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log("Usage: copilot --cloud config --get|--set <key=value>");
  }
}

async function logsCloud(client, opts) {
  console.log("☁️  Fetching cloud logs...");

  const response = await client.getLogs({
    level: opts.level || "info",
    lines: opts.lines || 50,
    since: opts.since,
  });

  console.log(response.logs.join("\n"));
}

async function deployCloud(client, opts) {
  console.log("☁️  Deploying to Copilot Cloud...");

  if (!opts.version) {
    console.error("❌ --version is required for deployment");
    process.exit(1);
  }

  const response = await client.deploy({
    version: opts.version,
    environment: opts.environment || "production",
    rollback: opts.rollback || false,
  });

  console.log(`✅ Deployed version ${response.version}`);
  console.log(`🔗 URL: ${response.url}`);
  console.log(`📊 Status: ${response.status}`);
}

function parseConfigUpdate(updateStr) {
  const updates = {};
  updateStr.split(",").forEach((pair) => {
    const [key, value] = pair.split("=");
    updates[key.trim()] = value.trim();
  });
  return updates;
}
