ALTER TABLE IF EXISTS api_keys
  ADD COLUMN IF NOT EXISTS quota_daily INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS quota_monthly INTEGER NOT NULL DEFAULT 5000;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_keys_quota_daily_positive'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_quota_daily_positive
      CHECK (quota_daily > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_keys_quota_monthly_positive'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_quota_monthly_positive
      CHECK (quota_monthly > 0);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_keys_quota_monthly_gte_daily'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_quota_monthly_gte_daily
      CHECK (quota_monthly >= quota_daily);
  END IF;
END
$$;
