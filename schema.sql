-- TWGT governance bootstrap schema.
-- Review against the authoritative TWGT database design before applying.
-- This file intentionally contains no credentials or environment-specific endpoints.

CREATE TABLE IF NOT EXISTS governance_bootstrap (
    id BIGSERIAL PRIMARY KEY,
    nucleus_commit CHAR(40) NOT NULL,
    nucleus_tag TEXT,
    nucleus_version TEXT,
    repository TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
