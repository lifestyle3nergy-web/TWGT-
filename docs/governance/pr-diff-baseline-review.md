# Independent review checklist

Reviewers should confirm that the repair:

1. does not convert a governance failure into a silent pass;
2. uses the synthetic merge first parent only when HEAD is actually a merge commit;
3. otherwise compares against the explicitly fetched PR base;
4. preserves top-level, activation-boundary, JSON, secret-path, dependency and ADR checks;
5. introduces no runtime or dependency change;
6. has fresh exact-head CI/security evidence.
