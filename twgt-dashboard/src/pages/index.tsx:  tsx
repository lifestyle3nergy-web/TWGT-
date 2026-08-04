import { useEffect, useState } from "react";

type RepoMetrics = {
  repo: string;
  latestRelease: string | null;
  ciPassRate: number;
  ciFailRate: number;
};

export default function OrgDashboard() {
  const [metrics, setMetrics] = useState<RepoMetrics[]>([]);

  useEffect(() => {
    fetch("/api/metrics")
      .then(res => res.json())
      .then(setMetrics);
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>TWGT Org‑wide Engineering Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Repo</th>
            <th>Latest Release</th>
            <th>CI Pass %</th>
            <th>CI Fail %</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(m => (
            <tr key={m.repo}>
              <td>{m.repo}</td>
              <td>{m.latestRelease ?? "—"}</td>
              <td>{m.ciPassRate}%</td>
              <td>{m.ciFailRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
