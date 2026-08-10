export default function StabilityMetrics({ metrics }) {
  return (
    <section>
      <h2>Stability Metrics</h2>
      <p>Total Runs: {metrics.total}</p>
      <p>Pass Rate: {metrics.passRate}%</p>
      <p>Fail Rate: {metrics.failRate}%</p>
    </section>
  );
}
