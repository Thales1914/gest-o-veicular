const fields = "id, vehicle_id, type, to_char(date, 'YYYY-MM-DD') AS date, mileage, description, cost, oil_type, next_service_mileage, service_notes, brand, warranty_months, created_at, updated_at";

function serialize(row) {
  if (!row) return null;
  return {
    ...Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)),
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    date: row.date.slice(0, 10),
    cost: row.cost == null ? undefined : Number(row.cost),
  };
}

function values(input) {
  return [input.type, input.date, input.mileage, input.description, input.cost ?? null,
    input.oil_type ?? null, input.next_service_mileage ?? null, input.service_notes ?? null,
    input.brand ?? null, input.warranty_months ?? null];
}

export class MaintenanceRecordRepository {
  constructor(db) { this.db = db; }

  async create(vehicleId, input) {
    const result = await this.db.query(
      `INSERT INTO maintenance_records (vehicle_id, type, date, mileage, description, cost,
       oil_type, next_service_mileage, service_notes, brand, warranty_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ${fields}`,
      [vehicleId, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  async list(vehicleId, { start_date, end_date }) {
    const result = await this.db.query(
      `SELECT ${fields} FROM maintenance_records WHERE vehicle_id = $1
       AND ($2::date IS NULL OR date >= $2::date)
       AND ($3::date IS NULL OR date <= $3::date)
       ORDER BY date DESC, mileage DESC, id DESC`,
      [vehicleId, start_date ?? null, end_date ?? null],
    );
    return result.rows.map(serialize);
  }

  async detail(vehicleId, id) {
    const result = await this.db.query(
      `SELECT ${fields} FROM maintenance_records WHERE vehicle_id = $1 AND id = $2`, [vehicleId, id],
    );
    return serialize(result.rows[0]);
  }

  async update(vehicleId, id, input) {
    const result = await this.db.query(
      `UPDATE maintenance_records SET type = $3, date = $4, mileage = $5, description = $6,
       cost = $7, oil_type = $8, next_service_mileage = $9, service_notes = $10,
       brand = $11, warranty_months = $12, updated_at = NOW()
       WHERE vehicle_id = $1 AND id = $2 RETURNING ${fields}`,
      [vehicleId, id, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  async remove(vehicleId, id) {
    const result = await this.db.query(
      'DELETE FROM maintenance_records WHERE vehicle_id = $1 AND id = $2 RETURNING id', [vehicleId, id],
    );
    return result.rowCount > 0;
  }
}
