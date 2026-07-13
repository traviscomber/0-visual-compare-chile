-- Repair runtime schema drift between the repo and the active production project.
-- This migration is idempotent and focuses on the minimum tables/columns needed by:
-- - authenticated upload/history flows
-- - API key quota tracking
-- - INAPI Phase 1 visibility

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'brand-assets',
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  sha256 TEXT NOT NULL,
  phash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images (user_id);
CREATE INDEX IF NOT EXISTS idx_images_organization_id ON images (organization_id);
CREATE INDEX IF NOT EXISTS idx_images_sha256 ON images (sha256);
CREATE INDEX IF NOT EXISTS idx_images_status ON images (status);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images (created_at DESC);

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_organization_id ON usage_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs (action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_metadata ON usage_logs USING GIN (metadata);

ALTER TABLE IF EXISTS comparisons
  ADD COLUMN IF NOT EXISTS image_a_id UUID,
  ADD COLUMN IF NOT EXISTS image_b_id UUID,
  ADD COLUMN IF NOT EXISTS classification TEXT,
  ADD COLUMN IF NOT EXISTS signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recommendation TEXT,
  ADD COLUMN IF NOT EXISTS result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS diff_storage_path TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comparisons_image_a_id_fkey'
  ) THEN
    ALTER TABLE comparisons
      ADD CONSTRAINT comparisons_image_a_id_fkey
      FOREIGN KEY (image_a_id) REFERENCES images(id) ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comparisons_image_b_id_fkey'
  ) THEN
    ALTER TABLE comparisons
      ADD CONSTRAINT comparisons_image_b_id_fkey
      FOREIGN KEY (image_b_id) REFERENCES images(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_comparisons_image_a_id ON comparisons (image_a_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_image_b_id ON comparisons (image_b_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_classification ON comparisons (classification);

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "images_select_own_scope" ON images;
CREATE POLICY "images_select_own_scope"
  ON images
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "images_insert_own_scope" ON images;
CREATE POLICY "images_insert_own_scope"
  ON images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "images_update_own_scope" ON images;
CREATE POLICY "images_update_own_scope"
  ON images
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "images_delete_own_scope" ON images;
CREATE POLICY "images_delete_own_scope"
  ON images
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "usage_logs_select_own_scope" ON usage_logs;
CREATE POLICY "usage_logs_select_own_scope"
  ON usage_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "usage_logs_insert_own_scope" ON usage_logs;
CREATE POLICY "usage_logs_insert_own_scope"
  ON usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
      OR organization_id = auth.uid()
    )
  );
