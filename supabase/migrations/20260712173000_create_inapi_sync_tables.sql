CREATE TABLE IF NOT EXISTS trademark_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_record_id TEXT,
  nombre TEXT NOT NULL,
  solicitante TEXT,
  numero_registro TEXT,
  numero_solicitud TEXT,
  estado TEXT,
  fecha_presentacion DATE,
  fecha_registro DATE,
  fecha_resolucion DATE,
  pais TEXT DEFAULT 'CL',
  source_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, source_record_id)
);

CREATE INDEX IF NOT EXISTS idx_trademark_records_nombre ON trademark_records USING GIN (to_tsvector('simple', coalesce(nombre, '')));
CREATE INDEX IF NOT EXISTS idx_trademark_records_solicitante ON trademark_records USING GIN (to_tsvector('simple', coalesce(solicitante, '')));
CREATE INDEX IF NOT EXISTS idx_trademark_records_numero_registro ON trademark_records (numero_registro);
CREATE INDEX IF NOT EXISTS idx_trademark_records_estado ON trademark_records (estado);
CREATE INDEX IF NOT EXISTS idx_trademark_records_updated_at ON trademark_records (updated_at DESC);

CREATE TABLE IF NOT EXISTS trademark_record_niza (
  trademark_record_id UUID NOT NULL REFERENCES trademark_records(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trademark_record_id, code)
);

CREATE INDEX IF NOT EXISTS idx_trademark_record_niza_code ON trademark_record_niza (code);

CREATE TABLE IF NOT EXISTS trademark_record_viena (
  trademark_record_id UUID NOT NULL REFERENCES trademark_records(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (trademark_record_id, code)
);

CREATE INDEX IF NOT EXISTS idx_trademark_record_viena_code ON trademark_record_viena (code);

CREATE TABLE IF NOT EXISTS inapi_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'inapi',
  status TEXT NOT NULL,
  search_type TEXT NOT NULL,
  query TEXT NOT NULL,
  total_fetched INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  initiated_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inapi_sync_runs_created_at ON inapi_sync_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inapi_sync_runs_status ON inapi_sync_runs (status);

CREATE OR REPLACE FUNCTION set_trademark_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trademark_records_updated_at ON trademark_records;
CREATE TRIGGER trg_trademark_records_updated_at
BEFORE UPDATE ON trademark_records
FOR EACH ROW
EXECUTE FUNCTION set_trademark_records_updated_at();

ALTER TABLE trademark_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trademark_record_niza ENABLE ROW LEVEL SECURITY;
ALTER TABLE trademark_record_viena ENABLE ROW LEVEL SECURITY;
ALTER TABLE inapi_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read trademark_records" ON trademark_records;
CREATE POLICY "Allow authenticated read trademark_records"
  ON trademark_records
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read trademark_record_niza" ON trademark_record_niza;
CREATE POLICY "Allow authenticated read trademark_record_niza"
  ON trademark_record_niza
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read trademark_record_viena" ON trademark_record_viena;
CREATE POLICY "Allow authenticated read trademark_record_viena"
  ON trademark_record_viena
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read inapi_sync_runs" ON inapi_sync_runs;
CREATE POLICY "Allow authenticated read inapi_sync_runs"
  ON inapi_sync_runs
  FOR SELECT
  TO authenticated
  USING (true);
