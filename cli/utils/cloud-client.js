const https = require("https");
const http = require("http");

class CloudClient {
  constructor(opts = {}) {
    this.apiKey = opts.apiKey;
    this.endpoint = opts.endpoint || "https://copilot-cloud.ai";
    this.timeout = opts.timeout || 30000;

    if (!this.apiKey) {
      throw new Error(
        "CloudClient requires apiKey (set via opts or COPILOT_API_KEY env var)"
      );
    }
  }

  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.endpoint);
      const protocol = this.endpoint.startsWith("https") ? https : http;

      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "copilot-cli/1.0.0",
        },
        timeout: this.timeout,
      };

      const req = protocol.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              const err = new Error(
                parsed.message || `HTTP ${res.statusCode}`
              );
              err.statusCode = res.statusCode;
              err.response = parsed;
              reject(err);
            } else {
              resolve(parsed);
            }
          } catch {
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            } else {
              resolve({ raw: body });
            }
          }
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.abort();
        reject(new Error("Request timeout"));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async sync(opts = {}) {
    return this.request("POST", "/api/sync", {
      knowledgeBase: opts.knowledgeBase || "default",
      force: opts.force || false,
      timestamp: new Date().toISOString(),
    });
  }

  async pull(opts = {}) {
    const params = new URLSearchParams();
    if (opts.knowledgeBase) params.append("kb", opts.knowledgeBase);
    if (opts.since) params.append("since", opts.since);

    const path = "/api/pull" + (params.toString() ? "?" + params : "");
    return this.request("GET", path);
  }

  async status() {
    return this.request("GET", "/api/status");
  }

  async getConfig() {
    return this.request("GET", "/api/config");
  }

  async setConfig(updates) {
    return this.request("PATCH", "/api/config", updates);
  }

  async getLogs(opts = {}) {
    const params = new URLSearchParams();
    if (opts.level) params.append("level", opts.level);
    if (opts.lines) params.append("lines", opts.lines);
    if (opts.since) params.append("since", opts.since);

    const path = "/api/logs" + (params.toString() ? "?" + params : "");
    return this.request("GET", path);
  }

  async deploy(opts = {}) {
    return this.request("POST", "/api/deploy", {
      version: opts.version,
      environment: opts.environment || "production",
      rollback: opts.rollback || false,
      timestamp: new Date().toISOString(),
    });
  }

  async health() {
    try {
      const response = await this.request("GET", "/health");
      return response.status === "ok";
    } catch {
      return false;
    }
  }
}

module.exports = CloudClient;
