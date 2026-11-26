const fields = "id, vehicle_id, type, title, number, to_char(issue_date, 'YYYY-MM-DD') AS issue_date, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, notes, file_name, file_mime, file_size, created_at, updated_at";

function serialize(row) {
  if (!row) return null;
  return {
    ...Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)),
    id: String(row.id),
    vehicle_id: String(row.vehicle_id),
    attachment: row.file_size == null ? null : { name: row.file_name, mime_type: row.file_mime, size: row.file_size },
  };
}

function values(input) {
  return [input.type, input.title, input.number ?? null, input.issue_date ?? null,
    input.expiry_date ?? null, input.notes ?? null];
}

export class DocumentRepository {
  constructor(db) { this.db = db; }

  async create(vehicleId, input, file) {
    const result = await this.db.query(
      `INSERT INTO vehicle_documents (vehicle_id, type, title, number, issue_date, expiry_date, notes,
       file_data, file_name, file_mime, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ${fields}`,
      [vehicleId, ...values(input), file?.buffer ?? null, file?.name ?? null, file?.mime ?? null, file?.size ?? null],
    );
    return serialize(result.rows[0]);
  }

  // O filtro de período usa a data de vencimento do documento.
  async list(vehicleId, { start_date, end_date }) {
    const result = await this.db.query(
      `SELECT ${fields} FROM vehicle_documents WHERE vehicle_id = $1
       AND ($2::date IS NULL OR expiry_date >= $2::date)
       AND ($3::date IS NULL OR expiry_date <= $3::date)
       ORDER BY expiry_date ASC NULLS LAST, id ASC`,
      [vehicleId, start_date ?? null, end_date ?? null],
    );
    return result.rows.map(serialize);
  }

  async detail(vehicleId, id) {
    const result = await this.db.query(
      `SELECT ${fields} FROM vehicle_documents WHERE vehicle_id = $1 AND id = $2`, [vehicleId, id],
    );
    return serialize(result.rows[0]);
  }

  async update(vehicleId, id, input) {
    const result = await this.db.query(
      `UPDATE vehicle_documents SET type = $3, title = $4, number = $5, issue_date = $6,
       expiry_date = $7, notes = $8, updated_at = NOW()
       WHERE vehicle_id = $1 AND id = $2 RETURNING ${fields}`,
      [vehicleId, id, ...values(input)],
    );
    return serialize(result.rows[0]);
  }

  async remove(vehicleId, id) {
    const result = await this.db.query(
      'DELETE FROM vehicle_documents WHERE vehicle_id = $1 AND id = $2 RETURNING id', [vehicleId, id],
    );
    return result.rowCount > 0;
  }

  async file(vehicleId, id) {
    const result = await this.db.query(
      'SELECT file_data, file_name, file_mime, file_size FROM vehicle_documents WHERE vehicle_id = $1 AND id = $2',
      [vehicleId, id],
    );
    return result.rows[0] ?? null;
  }

  async attach(vehicleId, id, file) {
    const result = await this.db.query(
      `UPDATE vehicle_documents SET file_data = $3, file_name = $4, file_mime = $5, file_size = $6,
       updated_at = NOW() WHERE vehicle_id = $1 AND id = $2 RETURNING ${fields}`,
      [vehicleId, id, file.buffer, file.name, file.mime, file.size],
    );
    return serialize(result.rows[0]);
  }
}
