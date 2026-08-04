export default function CiHealth({ runs }) {
  return (
    <section>
      <h2>CI Health</h2>
      <ul>
        {runs.map(run => (
          <li key={run.id}>
            {run.name}: {run.conclusion}
          </li>
        ))}
      </ul>
    </section>
  );
}
