CREATE TABLE fuel_records (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL CHECK (date >= DATE '1900-01-01'),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  liters NUMERIC(12, 3) NOT NULL CHECK (liters > 0),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price > 0),
  fuel_type VARCHAR(10) NOT NULL CHECK (fuel_type IN ('gasolina', 'etanol', 'diesel', 'flex')),
  full_tank BOOLEAN NOT NULL,
  gas_station VARCHAR(160),
  notes VARCHAR(2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX fuel_records_vehicle_date_idx ON fuel_records(vehicle_id, date DESC, id DESC);
