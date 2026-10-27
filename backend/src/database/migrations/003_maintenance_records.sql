CREATE TABLE maintenance_records (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('oleo', 'revisao', 'pneus', 'bateria', 'outro')),
  date DATE NOT NULL CHECK (date >= DATE '1900-01-01'),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  description VARCHAR(2000) NOT NULL,
  cost NUMERIC(12, 2) CHECK (cost IS NULL OR cost >= 0),
  oil_type VARCHAR(15) CHECK (oil_type IS NULL OR oil_type IN ('mineral', 'semissintetico', 'sintetico')),
  next_service_mileage INTEGER CHECK (next_service_mileage IS NULL OR next_service_mileage >= 0),
  service_notes VARCHAR(2000),
  brand VARCHAR(160),
  warranty_months INTEGER CHECK (warranty_months IS NULL OR warranty_months >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX maintenance_records_vehicle_date_idx ON maintenance_records(vehicle_id, date DESC, id DESC);
