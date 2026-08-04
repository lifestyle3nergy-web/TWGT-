export function computeStability(runs: any[]) {
  const total = runs.length;
  const success = runs.filter(r => r.conclusion === "success").length;
  const failed = runs.filter(r => r.conclusion === "failure").length;

  return {
    total,
    success,
    failed,
    passRate: total ? Math.round((success / total) * 100) : 0,
    failRate: total ? Math.round((failed / total) * 100) : 0
  };
}

export function stabilityScore(passRate: number, failRate: number) {
  return Math.max(0, passRate - failRate);
}
