# Implementation note

The first-parent rule is deliberately limited to merge commits. A normal branch checkout has one parent and therefore uses `origin/${GITHUB_BASE_REF}`. This keeps local/branch behavior explicit while making GitHub's pull-request synthetic merge checkout deterministic.
