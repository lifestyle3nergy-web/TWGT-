import express from "express";
import fetch from "node-fetch";

const app = express();
const API = "https://api.github.com";
const ORG = "lifestyle3nergy-web";
const TOKEN = process.env.GITHUB_TOKEN;

async function gh(path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  return res.json();
}

app.get("/api/repos", async (_req, res) => {
  const repos = await gh(`/orgs/${ORG}/repos`);
  res.json(repos);
});

app.get("/api/metrics", async (_req, res) => {
  const repos = await gh(`/orgs/${ORG}/repos`);

  const results = await Promise.all(
    repos.map(async (repo: any) => {
      const runs = await gh(`/repos/${ORG}/${repo.name}/actions/runs`);
      const releases = await gh(`/repos/${ORG}/${repo.name}/releases`);

      const workflowRuns = runs.workflow_runs || [];
      const total = workflowRuns.length;
      const success = workflowRuns.filter((r: any) => r.conclusion === "success").length;
      const failed = workflowRuns.filter((r: any) => r.conclusion === "failure").length;

      return {
        repo: repo.name,
        latestRelease: releases[0]?.tag_name ?? null,
        ciPassRate: total ? Math.round((success / total) * 100) : 0,
        ciFailRate: total ? Math.round((failed / total) * 100) : 0
      };
    })
  );

  res.json(results);
});

app.listen(3000, () => {
  console.log("TWGT org dashboard backend running on :3000");
});
