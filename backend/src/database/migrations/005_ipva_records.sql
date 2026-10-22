CREATE TABLE ipva_records (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
  total_value NUMERIC(12, 2) NOT NULL CHECK (total_value > 0),
  installments INTEGER NOT NULL CHECK (installments BETWEEN 1 AND 12),
  due_date DATE NOT NULL CHECK (due_date >= DATE '1900-01-01'),
  status VARCHAR(10) NOT NULL CHECK (status IN ('pendente', 'pago')),
  installment_details JSONB NOT NULL,
  notes VARCHAR(2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vehicle_id, year)
);

CREATE INDEX ipva_records_vehicle_due_idx ON ipva_records(vehicle_id, due_date, id);
