# Exact validation command set

```sh
npm ci
npm run lint
npm run build
npm test
npm run format:check
node --test scripts/validate-repository-contract.test.mjs
node scripts/validate-repository-contract.mjs
git diff --check
```

Results must be captured from the exact candidate head. No result is inferred from an earlier commit.
