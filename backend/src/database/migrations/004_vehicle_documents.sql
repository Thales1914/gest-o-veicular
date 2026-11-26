CREATE TABLE vehicle_documents (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type VARCHAR(15) NOT NULL CHECK (type IN ('crlv', 'seguro', 'licenciamento', 'cnh', 'outro')),
  title VARCHAR(160) NOT NULL,
  number VARCHAR(80),
  issue_date DATE CHECK (issue_date IS NULL OR issue_date >= DATE '1900-01-01'),
  expiry_date DATE CHECK (expiry_date IS NULL OR expiry_date >= DATE '1900-01-01'),
  notes VARCHAR(2000),
  file_data BYTEA,
  file_name VARCHAR(180),
  file_mime VARCHAR(40),
  file_size INTEGER CHECK (file_size > 0 AND file_size <= 10485760),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (issue_date IS NULL OR expiry_date IS NULL OR issue_date <= expiry_date),
  CHECK ((file_data IS NULL AND file_name IS NULL AND file_mime IS NULL AND file_size IS NULL)
    OR (file_data IS NOT NULL AND file_name IS NOT NULL AND file_mime IS NOT NULL AND file_size IS NOT NULL))
);

CREATE INDEX vehicle_documents_vehicle_expiry_idx ON vehicle_documents(vehicle_id, expiry_date, id);
