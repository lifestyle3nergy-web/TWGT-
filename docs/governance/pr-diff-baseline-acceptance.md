# Acceptance criteria

The repair is merge-eligible only when the exact PR head has:

- all requested npm gates green;
- repository contract regression green;
- Repository Governance green;
- Continuous Integration green;
- Dependency Review green;
- CodeQL green;
- no unresolved blocking review threads;
- independent human approval.

Until then the decision is HOLD.
