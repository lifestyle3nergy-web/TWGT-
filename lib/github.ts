import fetch from "node-fetch";

const API = "https://api.github.com";

export async function getReleases(repo: string, token: string) {
  const res = await fetch(`${API}/repos/${repo}/releases`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getWorkflowRuns(repo: string, token: string) {
  const res = await fetch(`${API}/repos/${repo}/actions/runs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function getTags(repo: string, token: string) {
  const res = await fetch(`${API}/repos/${repo}/tags`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}
