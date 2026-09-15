# Governance invariants

The repair must preserve these invariants:

- validation failures remain blocking;
- missing/unreadable base data remains an error;
- forbidden tracked paths remain rejected;
- malformed JSON remains rejected;
- unapproved top-level additions remain rejected;
- activation boundary violations remain rejected;
- protected structural changes still require a numbered ADR;
- dependency-only package changes retain their existing classification behavior.
