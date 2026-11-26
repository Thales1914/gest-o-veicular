export class ExpenseRepository {
  constructor(db) { this.db = db; }

  async summarize(vehicleId, { start_date, end_date }) {
    const result = await this.db.query(
      `SELECT 'fuel' AS category, COALESCE(SUM(total_price), 0) AS total,
         COUNT(*) AS record_count, 0 AS unpriced_count
       FROM fuel_records WHERE vehicle_id = $1
         AND ($2::date IS NULL OR date >= $2::date)
         AND ($3::date IS NULL OR date <= $3::date)
       UNION ALL
       SELECT 'maintenance' AS category, COALESCE(SUM(cost), 0) AS total,
         COUNT(*) AS record_count, COUNT(*) - COUNT(cost) AS unpriced_count
       FROM maintenance_records WHERE vehicle_id = $1
         AND ($2::date IS NULL OR date >= $2::date)
         AND ($3::date IS NULL OR date <= $3::date)`,
      [vehicleId, start_date ?? null, end_date ?? null],
    );
    return Object.fromEntries(result.rows.map((row) => [row.category, {
      total: Math.round(Number(row.total) * 100) / 100,
      record_count: Number(row.record_count),
      unpriced_count: Number(row.unpriced_count),
    }]));
  }
}
