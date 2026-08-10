export default function VersionHistory({ releases }) {
  return (
    <section>
      <h2>Version History</h2>
      <ul>
        {releases.map(r => (
          <li key={r.id}>
            <strong>{r.tag_name}</strong> — {new Date(r.published_at).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
