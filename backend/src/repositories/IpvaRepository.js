const fields = "id, vehicle_id, year, total_value, installments, to_char(due_date, 'YYYY-MM-DD') AS due_date, status, installment_details, notes, created_at, updated_at";

function serialize(row) {
  if (!row) return null;
  return {
    ...Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)),
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    year: Number(row.year),
    total_value: Number(row.total_value),
    installments: Number(row.installments),
    installment_value: row.installment_details[0].amount,
    next_due_date: row.installment_details.find(item => item.status === 'pendente')?.due_date ?? null,
    paid_installments: row.installment_details.filter(item => item.status === 'pago').length,
  };
}

function values(input) {
  return [input.year, input.total_value, input.installments, input.due_date, input.status, input.notes ?? null, JSON.stringify(input.installment_details)];
}

export class IpvaRepository {
  constructor(db) { this.db = db; }

  async create(vehicleId, input) {
    const result = await this.db.query(
      `INSERT INTO ipva_records (vehicle_id, year, total_value, installments, due_date, status, notes, installment_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${fields}`,
      [vehicleId, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  // O filtro de período usa a data de vencimento.
  async list(vehicleId, { start_date, end_date }) {
    const result = await this.db.query(
      `SELECT ${fields} FROM ipva_records WHERE vehicle_id = $1
       AND ($2::date IS NULL OR due_date >= $2::date)
       AND ($3::date IS NULL OR due_date <= $3::date)
       ORDER BY year DESC, id DESC`,
      [vehicleId, start_date ?? null, end_date ?? null],
    );
    return result.rows.map(serialize);
  }

  async detail(vehicleId, id) {
    const result = await this.db.query(
      `SELECT ${fields} FROM ipva_records WHERE vehicle_id = $1 AND id = $2`, [vehicleId, id],
    );
    return serialize(result.rows[0]);
  }

  async update(vehicleId, id, input) {
    const result = await this.db.query(
      `UPDATE ipva_records SET year = $3, total_value = $4, installments = $5, due_date = $6,
       status = $7, notes = $8, installment_details = $9, updated_at = NOW()
       WHERE vehicle_id = $1 AND id = $2 RETURNING ${fields}`,
      [vehicleId, id, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  async remove(vehicleId, id) {
    const result = await this.db.query(
      'DELETE FROM ipva_records WHERE vehicle_id = $1 AND id = $2 RETURNING id', [vehicleId, id],
    );
    return result.rowCount > 0;
  }
}
