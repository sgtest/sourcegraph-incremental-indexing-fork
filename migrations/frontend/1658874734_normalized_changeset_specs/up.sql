ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS head_repo_id integer REFERENCES repo(id) ON DELETE CASCADE DEFERRABLE;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS base_rev TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS base_ref TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS published TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS commit_message TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS commit_author_name TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS commit_author_email TEXT;
ALTER TABLE changeset_specs ADD COLUMN IF NOT EXISTS type TEXT;
