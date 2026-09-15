# Determinism

For a GitHub synthetic merge checkout, `HEAD^1..HEAD` identifies the tree delta introduced into the base side by the synthetic merge result without asking Git to rediscover a merge base. For a non-merge checkout, the validator uses the explicitly fetched named base. This selection is based on repository topology rather than guessed SHAs.
