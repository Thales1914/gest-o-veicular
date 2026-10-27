const fields = "id, vehicle_id, to_char(date, 'YYYY-MM-DD') AS date, mileage, liters, total_price, fuel_type, full_tank, gas_station, notes, created_at, updated_at";

function serialize(row) {
  if (!row) return null;
  return {
    ...row,
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    date: row.date.slice(0, 10),
    liters: Number(row.liters),
    total_price: Number(row.total_price),
    gas_station: row.gas_station ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function values(input) {
  return [input.date, input.mileage, input.liters, input.total_price,
    input.fuel_type, input.full_tank, input.gas_station ?? null, input.notes ?? null];
}

export class FuelRecordRepository {
  constructor(db) { this.db = db; }

  async create(vehicleId, input) {
    const result = await this.db.query(
      `INSERT INTO fuel_records (vehicle_id, date, mileage, liters, total_price, fuel_type, full_tank, gas_station, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING ${fields}`,
      [vehicleId, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  async list(vehicleId, { start_date, end_date }) {
    const result = await this.db.query(
      `SELECT ${fields} FROM fuel_records WHERE vehicle_id = $1
       AND ($2::date IS NULL OR date >= $2::date)
       AND ($3::date IS NULL OR date <= $3::date)
       ORDER BY date DESC, mileage DESC, id DESC`,
      [vehicleId, start_date ?? null, end_date ?? null],
    );
    return result.rows.map(serialize);
  }

  async detail(vehicleId, id) {
    const result = await this.db.query(
      `SELECT ${fields} FROM fuel_records WHERE vehicle_id = $1 AND id = $2`, [vehicleId, id],
    );
    return serialize(result.rows[0]);
  }

  async update(vehicleId, id, input) {
    const result = await this.db.query(
      `UPDATE fuel_records SET date = $3, mileage = $4, liters = $5, total_price = $6,
       fuel_type = $7, full_tank = $8, gas_station = $9, notes = $10, updated_at = NOW()
       WHERE vehicle_id = $1 AND id = $2 RETURNING ${fields}`,
      [vehicleId, id, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  async remove(vehicleId, id) {
    const result = await this.db.query(
      'DELETE FROM fuel_records WHERE vehicle_id = $1 AND id = $2 RETURNING id', [vehicleId, id],
    );
    return result.rowCount > 0;
  }
}
