-- Add organization_id to existing tables (if not exists)
ALTER TABLE images
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id);

ALTER TABLE comparisons
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id);

ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the full key
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for api_keys table
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Users can view own organization api keys" ON api_keys
  FOR SELECT USING (organization_id = auth.uid());

CREATE POLICY "Users can insert api keys for own organization" ON api_keys
  FOR INSERT WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Users can update own organization api keys" ON api_keys
  FOR UPDATE USING (organization_id = auth.uid());

CREATE POLICY "Users can delete own organization api keys" ON api_keys
  FOR DELETE USING (organization_id = auth.uid());

-- Add indexes to existing tables for performance
CREATE INDEX IF NOT EXISTS idx_images_organization_id ON images(organization_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_organization_id ON comparisons(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_organization_id ON usage_logs(organization_id);
